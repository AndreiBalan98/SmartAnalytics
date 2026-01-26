"""
Meta Sync Service - Rewritten for new meta_ads models
Uses sync_state as source of truth for tracking sync progress
"""
import requests
import logging
import json
from datetime import datetime, date, timedelta
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction
from django.db import models

from meta_ads.models import (
    MetaUser,
    Business,
    AdAccount,
    Campaign,
    AdSet,
    Ad,
    AdCreative,
    Insight,
    SyncState,
    AgencyAdAccountAccess,
)
from core.models import SystemLog

logger = logging.getLogger('smartanalytics.sync')

GRAPH_API_VERSION = 'v21.0'
GRAPH_API_BASE = f'https://graph.facebook.com/{GRAPH_API_VERSION}'


class MetaSyncService:
    """
    Comprehensive Meta Ads sync service
    Syncs data from Meta Graph API to local database using Meta IDs as primary keys
    """

    def __init__(self, agency, access_token):
        self.agency = agency
        self.access_token = access_token

    # ===== RATE LIMITING =====

    def check_rate_limit(self):
        """Ensure max 1 sync per minute per agency"""
        key = f'sync_rate_limit_{self.agency.id}'
        if cache.get(key):
            raise Exception('Sync already in progress. Please wait 1 minute.')
        cache.set(key, True, 60)  # Lock for 60 seconds

    def release_rate_limit(self):
        """Release rate limit lock"""
        key = f'sync_rate_limit_{self.agency.id}'
        cache.delete(key)

    # ===== SYNC STATE MANAGEMENT =====

    def _update_sync_state(self, entity_type, entity_id, status, **kwargs):
        """
        Update or create sync state for tracking
        kwargs can include: error_message, last_insight_date, metadata
        """
        defaults = {
            'status': status,
            'last_synced_at': timezone.now() if status in ['completed', 'running'] else None,
        }
        defaults.update(kwargs)

        SyncState.objects.update_or_create(
            agency=self.agency,
            provider='meta',
            entity_type=entity_type,
            entity_id=entity_id,
            defaults=defaults
        )

    def _get_sync_state(self, entity_type, entity_id):
        """Get sync state for an entity"""
        try:
            return SyncState.objects.get(
                agency=self.agency,
                provider='meta',
                entity_type=entity_type,
                entity_id=entity_id
            )
        except SyncState.DoesNotExist:
            return None

    def _should_sync_level(self, entity_type, hours=24):
        """
        Check if a level should be synced based on last sync time
        Returns True if never synced OR last sync was > hours ago
        """
        # Get most recent sync for this entity type
        latest_sync = SyncState.objects.filter(
            agency=self.agency,
            provider='meta',
            entity_type=entity_type,
            status='completed'
        ).order_by('-last_synced_at').first()

        if not latest_sync or not latest_sync.last_synced_at:
            return True  # Never synced, should sync

        # Check if last sync was more than X hours ago
        time_since_sync = timezone.now() - latest_sync.last_synced_at
        return time_since_sync.total_seconds() > (hours * 3600)

    def _log_level_skip(self, entity_type, last_sync_time):
        """Log when a level is skipped due to rate limiting"""
        logger.info(f'  └─ Skipping {entity_type}: synced {last_sync_time.strftime("%Y-%m-%d %H:%M")} (< 24h ago)')
        SystemLog.objects.create(
            level='DEBUG',
            logger_name='meta.sync.structural',
            message=f'[SYNC] Skipping {entity_type}: last sync {last_sync_time.strftime("%Y-%m-%d %H:%M")} (< 24h)'
        )

    # ===== ERROR HANDLING =====

    def handle_api_error(self, error, entity_type, entity_id):
        """Log error to sync_state"""
        error_msg = str(error)
        logger.error(f'Sync failed for {entity_type}/{entity_id}: {error_msg}')
        self._update_sync_state(
            entity_type,
            entity_id,
            'failed',
            error_message=error_msg
        )

    # ===== STRUCTURAL SYNC (Step 2 from plan) =====

    def sync_structural_until_ad_accounts(self):
        """
        Sync ONLY user, businesses, and ad accounts (for OAuth connection)
        Used when user connects Meta - we don't sync campaigns/adsets/ads yet
        Respects 24h rate limiting per level
        """
        logger.info('=' * 80)
        logger.info(f'STRUCTURAL SYNC (AD ACCOUNTS ONLY): Agency {self.agency.name}')
        logger.info('=' * 80)

        SystemLog.objects.create(
            level='INFO',
            logger_name='meta.sync.structural',
            message=f'[SYNC] START (Ad Accounts Only) - Agency {self.agency.name}'
        )

        try:
            user_id = None
            business_ids = []
            account_ids = []

            # Step 1: User
            if self._should_sync_level('user', hours=24):
                logger.info('Step 1/3: Syncing Meta user info...')
                user_id = self._sync_user()
                logger.info(f'✓ User synced: {user_id}')
                SystemLog.objects.create(
                    level='INFO',
                    logger_name='meta.sync.structural',
                    message=f'[SYNC] User synced: {user_id}'
                )
            else:
                latest = SyncState.objects.filter(
                    agency=self.agency, entity_type='user', status='completed'
                ).order_by('-last_synced_at').first()
                self._log_level_skip('user', latest.last_synced_at)

            # Step 2: Businesses
            if self._should_sync_level('business', hours=24):
                logger.info('Step 2/3: Syncing businesses...')
                business_ids = self._sync_businesses()
                logger.info(f'✓ Businesses synced: {len(business_ids)} businesses')
                SystemLog.objects.create(
                    level='INFO',
                    logger_name='meta.sync.structural',
                    message=f'[SYNC] Businesses synced: {len(business_ids)} businesses'
                )
            else:
                latest = SyncState.objects.filter(
                    agency=self.agency, entity_type='business', status='completed'
                ).order_by('-last_synced_at').first()
                self._log_level_skip('business', latest.last_synced_at)

            # Step 3: Ad Accounts
            if self._should_sync_level('ad_account', hours=24):
                logger.info('Step 3/3: Syncing ad accounts...')
                account_ids = self._sync_ad_accounts()
                logger.info(f'✓ Ad accounts synced: {len(account_ids)} accounts')
                SystemLog.objects.create(
                    level='INFO',
                    logger_name='meta.sync.structural',
                    message=f'[SYNC] Ad accounts synced: {len(account_ids)} accounts'
                )

                # Grant agency access
                logger.info('Step 3.5/3: Granting agency access...')
                self._grant_agency_access(account_ids)
                SystemLog.objects.create(
                    level='INFO',
                    logger_name='meta.sync.structural',
                    message=f'[SYNC] Agency access granted to {len(account_ids)} accounts'
                )
            else:
                latest = SyncState.objects.filter(
                    agency=self.agency, entity_type='ad_account', status='completed'
                ).order_by('-last_synced_at').first()
                self._log_level_skip('ad_account', latest.last_synced_at)

            logger.info('=' * 80)
            logger.info('STRUCTURAL SYNC (AD ACCOUNTS ONLY) COMPLETED')
            logger.info('=' * 80)

            SystemLog.objects.create(
                level='INFO',
                logger_name='meta.sync.structural',
                message=f'[SYNC] COMPLETED (Ad Accounts Only)'
            )

            return {
                'success': True,
                'user_id': user_id,
                'businesses': len(business_ids),
                'ad_accounts': len(account_ids),
            }

        except Exception as e:
            logger.error('=' * 80)
            logger.error(f'STRUCTURAL SYNC FAILED: {str(e)}')
            logger.error('=' * 80)
            SystemLog.objects.create(
                level='ERROR',
                logger_name='meta.sync.structural',
                message=f'[SYNC] FAILED - Error: {str(e)}'
            )
            raise

    def sync_structural_data(self):
        """
        Sync all structural data: user, businesses, ad accounts, campaigns, adsets, ads, creatives
        This is Step 2 of the sync process (after OAuth connection)
        """
        logger.info('=' * 80)
        logger.info(f'STRUCTURAL SYNC STARTED: Agency {self.agency.name} (ID: {self.agency.id})')
        logger.info('=' * 80)

        # Log start to database
        SystemLog.objects.create(
            level='INFO',
            logger_name='meta.sync.structural',
            message=f'[SYNC] START - Agency {self.agency.name} (ID: {self.agency.id})'
        )

        try:
            logger.info('Step 1/7: Syncing Meta user info...')
            user_id = self._sync_user()
            logger.info(f'✓ User synced: {user_id}')
            SystemLog.objects.create(
                level='INFO',
                logger_name='meta.sync.structural',
                message=f'[SYNC] User synced: {user_id}'
            )

            logger.info('Step 2/7: Syncing businesses...')
            business_ids = self._sync_businesses()
            logger.info(f'✓ Businesses synced: {len(business_ids)} businesses')
            SystemLog.objects.create(
                level='INFO',
                logger_name='meta.sync.structural',
                message=f'[SYNC] Businesses synced: {len(business_ids)} businesses - IDs: {business_ids}'
            )

            logger.info('Step 3/7: Syncing ad accounts...')
            account_ids = self._sync_ad_accounts()
            logger.info(f'✓ Ad accounts synced: {len(account_ids)} accounts')
            SystemLog.objects.create(
                level='INFO',
                logger_name='meta.sync.structural',
                message=f'[SYNC] Ad accounts synced: {len(account_ids)} accounts - IDs: {account_ids}'
            )

            # Grant agency access to all ad accounts
            logger.info('Step 3.5/7: Granting agency access to ad accounts...')
            self._grant_agency_access(account_ids)
            logger.info(f'✓ Agency access granted to {len(account_ids)} accounts')
            SystemLog.objects.create(
                level='INFO',
                logger_name='meta.sync.structural',
                message=f'[SYNC] Agency access granted to {len(account_ids)} accounts'
            )

            logger.info('Step 4/7: Syncing campaigns...')
            campaign_count = self._sync_campaigns(account_ids)
            logger.info(f'✓ Campaigns synced: {campaign_count} campaigns')
            SystemLog.objects.create(
                level='INFO',
                logger_name='meta.sync.structural',
                message=f'[SYNC] Campaigns synced: {campaign_count} campaigns'
            )

            logger.info('Step 5/7: Syncing ad sets...')
            adset_count = self._sync_adsets()
            logger.info(f'✓ Ad sets synced: {adset_count} ad sets')
            SystemLog.objects.create(
                level='INFO',
                logger_name='meta.sync.structural',
                message=f'[SYNC] Ad sets synced: {adset_count} ad sets'
            )

            logger.info('Step 6/7: Syncing ads...')
            ad_count = self._sync_ads()
            logger.info(f'✓ Ads synced: {ad_count} ads')
            SystemLog.objects.create(
                level='INFO',
                logger_name='meta.sync.structural',
                message=f'[SYNC] Ads synced: {ad_count} ads'
            )

            logger.info('Step 7/7: Syncing ad creatives...')
            creative_count = self._sync_creatives(account_ids)
            logger.info(f'✓ Creatives synced: {creative_count} creatives')
            SystemLog.objects.create(
                level='INFO',
                logger_name='meta.sync.structural',
                message=f'[SYNC] Creatives synced: {creative_count} creatives'
            )

            logger.info('=' * 80)
            logger.info('STRUCTURAL SYNC COMPLETED SUCCESSFULLY')
            logger.info(f'Summary: {len(account_ids)} accounts, {campaign_count} campaigns, {adset_count} ad sets, {ad_count} ads, {creative_count} creatives')
            logger.info('=' * 80)

            # Log success to database
            SystemLog.objects.create(
                level='INFO',
                logger_name='meta.sync.structural',
                message=f'[SYNC] COMPLETED - Accounts: {len(account_ids)}, Campaigns: {campaign_count}, AdSets: {adset_count}, Ads: {ad_count}, Creatives: {creative_count}'
            )

            return {
                'success': True,
                'user_id': user_id,
                'businesses': len(business_ids),
                'ad_accounts': len(account_ids),
                'campaigns': campaign_count,
                'adsets': adset_count,
                'ads': ad_count,
                'creatives': creative_count,
            }

        except Exception as e:
            logger.error('=' * 80)
            logger.error(f'STRUCTURAL SYNC FAILED: {str(e)}')
            logger.error('=' * 80)

            # Log error to database
            SystemLog.objects.create(
                level='ERROR',
                logger_name='meta.sync.structural',
                message=f'[SYNC] FAILED - Error: {str(e)}'
            )
            raise

    def _sync_user(self):
        """Sync Meta user (/me endpoint)"""
        try:
            url = f'{GRAPH_API_BASE}/me'
            params = {
                'access_token': self.access_token,
                'fields': 'id,name,email',
            }

            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            # Upsert user
            MetaUser.objects.update_or_create(
                id=data['id'],
                defaults={
                    'name': data.get('name', ''),
                    'email': data.get('email'),
                    'raw': data,
                }
            )

            self._update_sync_state('user', data['id'], 'completed')
            return data['id']

        except Exception as e:
            self.handle_api_error(e, 'user', 'unknown')
            raise

    def _sync_businesses(self):
        """Sync businesses (/me/businesses endpoint)"""
        try:
            url = f'{GRAPH_API_BASE}/me/businesses'
            params = {
                'access_token': self.access_token,
                'fields': 'id,name',
            }

            response = requests.get(url, params=params)
            response.raise_for_status()
            businesses = response.json().get('data', [])

            business_ids = []
            for biz in businesses:
                Business.objects.update_or_create(
                    id=biz['id'],
                    defaults={
                        'name': biz.get('name', ''),
                        'raw': biz,
                    }
                )
                self._update_sync_state('business', biz['id'], 'completed')
                business_ids.append(biz['id'])

            return business_ids

        except Exception as e:
            self.handle_api_error(e, 'business', 'unknown')
            raise

    def _sync_ad_accounts(self):
        """Sync ad accounts (/me/adaccounts endpoint)"""
        try:
            url = f'{GRAPH_API_BASE}/me/adaccounts'
            params = {
                'access_token': self.access_token,
                'fields': 'id,name,currency,timezone_name,account_status,business',
            }

            response = requests.get(url, params=params)
            response.raise_for_status()
            accounts = response.json().get('data', [])

            account_ids = []
            for acc in accounts:
                # Get business FK if available
                business_id = acc.get('business', {}).get('id') if isinstance(acc.get('business'), dict) else None
                business = Business.objects.filter(id=business_id).first() if business_id else None

                AdAccount.objects.update_or_create(
                    id=acc['id'],
                    defaults={
                        'business': business,
                        'name': acc.get('name', ''),
                        'currency': acc.get('currency', ''),
                        'timezone': acc.get('timezone_name', ''),
                        'account_status': acc.get('account_status', 1),
                        'raw': acc,
                    }
                )
                self._update_sync_state('ad_account', acc['id'], 'completed')
                account_ids.append(acc['id'])

            return account_ids

        except Exception as e:
            self.handle_api_error(e, 'ad_account', 'unknown')
            raise

    def _grant_agency_access(self, account_ids):
        """Grant agency access to ad accounts (multi-tenancy)"""
        for account_id in account_ids:
            AgencyAdAccountAccess.objects.get_or_create(
                agency=self.agency,
                ad_account_id=account_id,
            )

    def _sync_campaigns(self, account_ids):
        """Sync campaigns for all ad accounts"""
        total = 0
        for account_id in account_ids:
            try:
                url = f'{GRAPH_API_BASE}/{account_id}/campaigns'
                params = {
                    'access_token': self.access_token,
                    'fields': 'id,name,objective,status,buying_type',
                    'limit': 500,
                }

                response = requests.get(url, params=params)
                response.raise_for_status()
                campaigns = response.json().get('data', [])

                for camp in campaigns:
                    Campaign.objects.update_or_create(
                        id=camp['id'],
                        defaults={
                            'ad_account_id': account_id,
                            'name': camp.get('name', ''),
                            'objective': camp.get('objective', ''),
                            'status': camp.get('status', ''),
                            'buying_type': camp.get('buying_type', ''),
                            'raw': camp,
                        }
                    )
                    self._update_sync_state('campaign', camp['id'], 'completed')
                    total += 1

                logger.info(f'  └─ Account {account_id}: {len(campaigns)} campaigns')

            except Exception as e:
                logger.error(f'  └─ Account {account_id}: FAILED - {str(e)}')
                self.handle_api_error(e, 'campaign', account_id)

        return total

    def _sync_adsets(self):
        """Sync ad sets for all campaigns"""
        campaigns = Campaign.objects.all()
        total = 0

        for campaign in campaigns:
            try:
                url = f'{GRAPH_API_BASE}/{campaign.id}/adsets'
                params = {
                    'access_token': self.access_token,
                    'fields': 'id,name,daily_budget,lifetime_budget,optimization_goal,status,start_time,end_time',
                    'limit': 500,
                }

                response = requests.get(url, params=params)
                response.raise_for_status()
                adsets = response.json().get('data', [])

                for adset in adsets:
                    # Parse start/end times
                    start_time = None
                    end_time = None
                    if adset.get('start_time'):
                        start_time = datetime.fromisoformat(adset['start_time'].replace('Z', '+00:00'))
                    if adset.get('end_time'):
                        end_time = datetime.fromisoformat(adset['end_time'].replace('Z', '+00:00'))

                    AdSet.objects.update_or_create(
                        id=adset['id'],
                        defaults={
                            'campaign_id': campaign.id,
                            'ad_account_id': campaign.ad_account_id,
                            'name': adset.get('name', ''),
                            'daily_budget': adset.get('daily_budget'),
                            'lifetime_budget': adset.get('lifetime_budget'),
                            'optimization_goal': adset.get('optimization_goal', ''),
                            'status': adset.get('status', ''),
                            'start_time': start_time,
                            'end_time': end_time,
                            'raw': adset,
                        }
                    )
                    self._update_sync_state('adset', adset['id'], 'completed')
                    total += 1

            except Exception as e:
                logger.error(f'  └─ Campaign {campaign.id}: FAILED - {str(e)}')
                self.handle_api_error(e, 'adset', campaign.id)

        return total

    def _sync_ads(self):
        """Sync ads for all ad sets"""
        adsets = AdSet.objects.all()
        total = 0

        for adset in adsets:
            try:
                url = f'{GRAPH_API_BASE}/{adset.id}/ads'
                params = {
                    'access_token': self.access_token,
                    'fields': 'id,name,status,effective_status,creative{id}',
                    'limit': 500,
                }

                response = requests.get(url, params=params)
                response.raise_for_status()
                ads = response.json().get('data', [])

                for ad in ads:
                    creative_id = ad.get('creative', {}).get('id') if isinstance(ad.get('creative'), dict) else ''

                    Ad.objects.update_or_create(
                        id=ad['id'],
                        defaults={
                            'adset_id': adset.id,
                            'campaign_id': adset.campaign_id,
                            'ad_account_id': adset.ad_account_id,
                            'name': ad.get('name', ''),
                            'status': ad.get('status', ''),
                            'effective_status': ad.get('effective_status', ''),
                            'creative_id': creative_id,
                            'raw': ad,
                        }
                    )
                    self._update_sync_state('ad', ad['id'], 'completed')
                    total += 1

            except Exception as e:
                logger.error(f'  └─ AdSet {adset.id}: FAILED - {str(e)}')
                self.handle_api_error(e, 'ad', adset.id)

        return total

    def _sync_creatives(self, account_ids):
        """Sync ad creatives for all ad accounts"""
        total = 0
        for account_id in account_ids:
            try:
                url = f'{GRAPH_API_BASE}/{account_id}/adcreatives'
                params = {
                    'access_token': self.access_token,
                    'fields': 'id,name,object_story_spec,image_url,video_id',
                    'limit': 500,
                }

                response = requests.get(url, params=params)
                response.raise_for_status()
                creatives = response.json().get('data', [])

                for creative in creatives:
                    AdCreative.objects.update_or_create(
                        id=creative['id'],
                        defaults={
                            'ad_account_id': account_id,
                            'name': creative.get('name', ''),
                            'object_story_spec': creative.get('object_story_spec', {}),
                            'image_url': creative.get('image_url', ''),
                            'video_url': creative.get('video_id', ''),  # Note: video_id not full URL
                            'raw': creative,
                        }
                    )
                    self._update_sync_state('creative', creative['id'], 'completed')
                    total += 1

            except Exception as e:
                logger.error(f'  └─ Account {account_id}: FAILED - {str(e)}')
                self.handle_api_error(e, 'creative', account_id)

        return total

    # ===== STRUCTURAL SYNC FOR SPECIFIC ACCOUNTS (Step 3.1) =====

    def sync_structural_for_accounts(self, ad_account_ids):
        """
        Sync structural data (campaigns, adsets, ads, creatives) for specific ad accounts
        This is called BEFORE insights sync to ensure structure is up-to-date
        Respects 24h rate limiting per level
        Returns: {account_id: {campaigns: N, adsets: N, ads: N, creatives: N}}
        """
        logger.info('=' * 80)
        logger.info(f'STRUCTURAL SYNC FOR SELECTED ACCOUNTS: {len(ad_account_ids)} accounts')
        logger.info('=' * 80)

        SystemLog.objects.create(
            level='INFO',
            logger_name='meta.sync.structural.selected',
            message=f'[SYNC SELECTED] START - {len(ad_account_ids)} accounts: {ad_account_ids}'
        )

        results = {}
        total_campaigns = 0
        total_adsets = 0
        total_ads = 0
        total_creatives = 0

        # Check rate limiting for each level
        should_sync_campaigns = self._should_sync_level('campaign', hours=24)
        should_sync_adsets = self._should_sync_level('adset', hours=24)
        should_sync_ads = self._should_sync_level('ad', hours=24)
        should_sync_creatives = self._should_sync_level('creative', hours=24)

        # Log skipped levels
        if not should_sync_campaigns:
            latest = SyncState.objects.filter(
                agency=self.agency, entity_type='campaign', status='completed'
            ).order_by('-last_synced_at').first()
            self._log_level_skip('campaign', latest.last_synced_at)

        if not should_sync_adsets:
            latest = SyncState.objects.filter(
                agency=self.agency, entity_type='adset', status='completed'
            ).order_by('-last_synced_at').first()
            self._log_level_skip('adset', latest.last_synced_at)

        if not should_sync_ads:
            latest = SyncState.objects.filter(
                agency=self.agency, entity_type='ad', status='completed'
            ).order_by('-last_synced_at').first()
            self._log_level_skip('ad', latest.last_synced_at)

        if not should_sync_creatives:
            latest = SyncState.objects.filter(
                agency=self.agency, entity_type='creative', status='completed'
            ).order_by('-last_synced_at').first()
            self._log_level_skip('creative', latest.last_synced_at)

        # Only sync if at least one level needs syncing
        if not any([should_sync_campaigns, should_sync_adsets, should_sync_ads, should_sync_creatives]):
            logger.info('All structural levels synced within 24h - skipping')
            SystemLog.objects.create(
                level='INFO',
                logger_name='meta.sync.structural.selected',
                message=f'[SYNC SELECTED] All levels synced within 24h - skipping structural sync'
            )
            return {'skipped': True, 'reason': 'All levels synced within 24h'}

        for account_id in ad_account_ids:
            try:
                logger.info(f'Syncing structural data for account {account_id}...')

                campaign_count = 0
                adset_count = 0
                ad_count = 0
                creative_count = 0

                # Sync campaigns for this account (if needed)
                if should_sync_campaigns:
                    campaign_count = self._sync_campaigns([account_id])
                    total_campaigns += campaign_count

                # Sync adsets for campaigns in this account (if needed)
                if should_sync_adsets:
                    adset_count = self._sync_adsets_for_account(account_id)
                    total_adsets += adset_count

                # Sync ads for adsets in this account (if needed)
                if should_sync_ads:
                    ad_count = self._sync_ads_for_account(account_id)
                    total_ads += ad_count

                # Sync creatives for this account (if needed)
                if should_sync_creatives:
                    creative_count = self._sync_creatives([account_id])
                    total_creatives += creative_count

                results[account_id] = {
                    'campaigns': campaign_count,
                    'adsets': adset_count,
                    'ads': ad_count,
                    'creatives': creative_count,
                }

                logger.info(f'✓ Account {account_id}: {campaign_count} campaigns, {adset_count} adsets, {ad_count} ads, {creative_count} creatives')

                SystemLog.objects.create(
                    level='INFO',
                    logger_name='meta.sync.structural.selected',
                    message=f'[SYNC SELECTED] Account {account_id}: campaigns={campaign_count}, adsets={adset_count}, ads={ad_count}, creatives={creative_count}'
                )

            except Exception as e:
                logger.error(f'✗ Account {account_id}: FAILED - {str(e)}')
                SystemLog.objects.create(
                    level='ERROR',
                    logger_name='meta.sync.structural.selected',
                    message=f'[SYNC SELECTED] Account {account_id} FAILED: {str(e)}'
                )
                results[account_id] = {'error': str(e)}

        logger.info('=' * 80)
        logger.info(f'STRUCTURAL SYNC COMPLETED: {total_campaigns} campaigns, {total_adsets} adsets, {total_ads} ads, {total_creatives} creatives')
        logger.info('=' * 80)

        SystemLog.objects.create(
            level='INFO',
            logger_name='meta.sync.structural.selected',
            message=f'[SYNC SELECTED] COMPLETED - Total: campaigns={total_campaigns}, adsets={total_adsets}, ads={total_ads}, creatives={total_creatives}'
        )

        return results

    def _sync_adsets_for_account(self, account_id):
        """Sync ad sets for all campaigns in a specific account"""
        campaigns = Campaign.objects.filter(ad_account_id=account_id)
        total = 0

        for campaign in campaigns:
            try:
                url = f'{GRAPH_API_BASE}/{campaign.id}/adsets'
                params = {
                    'access_token': self.access_token,
                    'fields': 'id,name,daily_budget,lifetime_budget,optimization_goal,status,start_time,end_time',
                    'limit': 500,
                }

                response = requests.get(url, params=params)
                response.raise_for_status()
                adsets = response.json().get('data', [])

                for adset in adsets:
                    # Parse start/end times
                    start_time = None
                    end_time = None
                    if adset.get('start_time'):
                        start_time = datetime.fromisoformat(adset['start_time'].replace('Z', '+00:00'))
                    if adset.get('end_time'):
                        end_time = datetime.fromisoformat(adset['end_time'].replace('Z', '+00:00'))

                    AdSet.objects.update_or_create(
                        id=adset['id'],
                        defaults={
                            'campaign_id': campaign.id,
                            'ad_account_id': account_id,
                            'name': adset.get('name', ''),
                            'daily_budget': adset.get('daily_budget'),
                            'lifetime_budget': adset.get('lifetime_budget'),
                            'optimization_goal': adset.get('optimization_goal', ''),
                            'status': adset.get('status', ''),
                            'start_time': start_time,
                            'end_time': end_time,
                            'raw': adset,
                        }
                    )
                    self._update_sync_state('adset', adset['id'], 'completed')
                    total += 1

            except Exception as e:
                logger.error(f'  └─ Campaign {campaign.id}: FAILED - {str(e)}')
                self.handle_api_error(e, 'adset', campaign.id)

        return total

    def _sync_ads_for_account(self, account_id):
        """Sync ads for all ad sets in a specific account"""
        adsets = AdSet.objects.filter(ad_account_id=account_id)
        total = 0

        for adset in adsets:
            try:
                url = f'{GRAPH_API_BASE}/{adset.id}/ads'
                params = {
                    'access_token': self.access_token,
                    'fields': 'id,name,status,effective_status,creative{id}',
                    'limit': 500,
                }

                response = requests.get(url, params=params)
                response.raise_for_status()
                ads = response.json().get('data', [])

                for ad in ads:
                    creative_id = ad.get('creative', {}).get('id') if isinstance(ad.get('creative'), dict) else ''

                    Ad.objects.update_or_create(
                        id=ad['id'],
                        defaults={
                            'adset_id': adset.id,
                            'campaign_id': adset.campaign_id,
                            'ad_account_id': account_id,
                            'name': ad.get('name', ''),
                            'status': ad.get('status', ''),
                            'effective_status': ad.get('effective_status', ''),
                            'creative_id': creative_id,
                            'raw': ad,
                        }
                    )
                    self._update_sync_state('ad', ad['id'], 'completed')
                    total += 1

            except Exception as e:
                logger.error(f'  └─ AdSet {adset.id}: FAILED - {str(e)}')
                self.handle_api_error(e, 'ad', adset.id)

        return total

    # ===== INSIGHTS SYNC (Step 4 from plan) =====

    def sync_insights(self, ad_account_ids, start_date, end_date):
        """
        Sync insights for selected ad accounts
        Fetches insights at all levels: account, campaign, adset, ad
        """
        logger.info('=' * 80)
        logger.info(f'INSIGHTS SYNC STARTED: Agency {self.agency.name}')
        logger.info(f'Accounts: {len(ad_account_ids)}, Date range: {start_date} to {end_date}')
        logger.info('=' * 80)

        # Log to database
        SystemLog.objects.create(
            level='INFO',
            logger_name='meta.sync.insights',
            message=f'[INSIGHTS] START - Accounts: {ad_account_ids}, Range: {start_date} to {end_date}'
        )

        # Convert strings to dates if needed
        if isinstance(start_date, str):
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if isinstance(end_date, str):
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

        total_created = 0
        for account_id in ad_account_ids:
            try:
                logger.info(f'Syncing insights for account {account_id}...')
                SystemLog.objects.create(
                    level='INFO',
                    logger_name='meta.sync.insights',
                    message=f'[INSIGHTS] Syncing account {account_id}...'
                )

                count = self._sync_insights_for_account(account_id, start_date, end_date)
                total_created += count

                logger.info(f'✓ Account {account_id}: {count} insights synced')
                SystemLog.objects.create(
                    level='INFO',
                    logger_name='meta.sync.insights',
                    message=f'[INSIGHTS] Account {account_id}: {count} insights synced'
                )

            except Exception as e:
                logger.error(f'✗ Account {account_id}: FAILED - {str(e)}')
                SystemLog.objects.create(
                    level='ERROR',
                    logger_name='meta.sync.insights',
                    message=f'[INSIGHTS] Account {account_id} FAILED: {str(e)}'
                )
                self.handle_api_error(e, 'insights', account_id)

        logger.info('=' * 80)
        logger.info(f'INSIGHTS SYNC COMPLETED: {total_created} total insights')
        logger.info('=' * 80)

        # Log completion to database
        SystemLog.objects.create(
            level='INFO',
            logger_name='meta.sync.insights',
            message=f'[INSIGHTS] COMPLETED - Total: {total_created} insights'
        )

        return {'success': True, 'total_insights': total_created}

    def _sync_insights_for_account(self, ad_account_id, start_date, end_date):
        """
        Fetch insights at ALL levels for an account
        INCREMENTAL: Only fetches missing date ranges (fills gaps)
        """
        total = 0

        # Check what date ranges we already have in the database
        existing_insights = Insight.objects.filter(
            ad_account_id=ad_account_id
        ).aggregate(
            min_date=models.Min('date_start'),
            max_date=models.Max('date_start')
        )

        min_existing = existing_insights['min_date']
        max_existing = existing_insights['max_date']

        # Determine what ranges need to be synced
        ranges_to_sync = []

        if not min_existing or not max_existing:
            # No data at all, sync entire range
            ranges_to_sync.append((start_date, end_date))
            logger.info(f'  └─ Account {ad_account_id}: No existing data, syncing full range {start_date} to {end_date}')
            SystemLog.objects.create(
                level='DEBUG',
                logger_name='meta.sync.insights',
                message=f'[INSIGHTS] Account {ad_account_id}: No existing data, syncing {start_date} to {end_date}'
            )
        else:
            # We have some data, identify gaps
            logger.info(f'  └─ Account {ad_account_id}: Existing data from {min_existing} to {max_existing}')

            # Gap before existing data?
            if start_date < min_existing:
                gap_end = min_existing - timedelta(days=1)
                ranges_to_sync.append((start_date, gap_end))
                logger.info(f'    └─ Gap BEFORE: {start_date} to {gap_end}')
                SystemLog.objects.create(
                    level='DEBUG',
                    logger_name='meta.sync.insights',
                    message=f'[INSIGHTS] Account {ad_account_id}: Gap before - {start_date} to {gap_end}'
                )

            # Gap after existing data?
            if end_date > max_existing:
                gap_start = max_existing + timedelta(days=1)
                ranges_to_sync.append((gap_start, end_date))
                logger.info(f'    └─ Gap AFTER: {gap_start} to {end_date}')
                SystemLog.objects.create(
                    level='DEBUG',
                    logger_name='meta.sync.insights',
                    message=f'[INSIGHTS] Account {ad_account_id}: Gap after - {gap_start} to {end_date}'
                )

            if not ranges_to_sync:
                logger.info(f'  └─ Account {ad_account_id}: All data already synced!')
                SystemLog.objects.create(
                    level='INFO',
                    logger_name='meta.sync.insights',
                    message=f'[INSIGHTS] Account {ad_account_id}: All data already synced (no gaps)'
                )
                return 0

        # Fetch insights for each missing range
        for range_start, range_end in ranges_to_sync:
            logger.info(f'  └─ Syncing range: {range_start} to {range_end}')

            # Fetch insights at each level
            # Account level - direct request
            count = self._fetch_insights(ad_account_id, 'account', range_start, range_end)
            total += count
            logger.info(f'    └─ Level account: {count} insights')
            SystemLog.objects.create(
                level='DEBUG',
                logger_name='meta.sync.insights',
                message=f'[INSIGHTS] Account {ad_account_id} - Level account ({range_start} to {range_end}): {count} records'
            )

            # Campaign/AdSet/Ad levels - fetch per entity to get correct object_id
            count = self._fetch_insights_per_entity(ad_account_id, range_start, range_end)
            total += count

        # Update sync state
        self._update_sync_state(
            'insights',
            ad_account_id,
            'completed',
            last_insight_date=end_date
        )

        return total

    def _fetch_insights_per_entity(self, ad_account_id, start_date, end_date):
        """
        Fetch insights by making separate requests for each campaign/adset/ad
        This ensures object_id is stored correctly
        """
        total = 0

        # Fetch campaigns for this account
        campaigns = Campaign.objects.filter(ad_account_id=ad_account_id)
        logger.info(f'  └─ Fetching insights for {campaigns.count()} campaigns')

        for campaign in campaigns:
            try:
                count = self._fetch_entity_insights(campaign.id, 'campaign', ad_account_id, start_date, end_date)
                total += count
            except Exception as e:
                logger.error(f'Failed to fetch insights for campaign {campaign.id}: {str(e)}')
                continue

        # Fetch adsets for this account
        adsets = AdSet.objects.filter(ad_account_id=ad_account_id)
        logger.info(f'  └─ Fetching insights for {adsets.count()} adsets')

        for adset in adsets:
            try:
                count = self._fetch_entity_insights(adset.id, 'adset', ad_account_id, start_date, end_date)
                total += count
            except Exception as e:
                logger.error(f'Failed to fetch insights for adset {adset.id}: {str(e)}')
                continue

        # Fetch ads for this account
        ads = Ad.objects.filter(ad_account_id=ad_account_id)
        logger.info(f'  └─ Fetching insights for {ads.count()} ads')

        for ad in ads:
            try:
                count = self._fetch_entity_insights(ad.id, 'ad', ad_account_id, start_date, end_date)
                total += count
            except Exception as e:
                logger.error(f'Failed to fetch insights for ad {ad.id}: {str(e)}')
                continue

        logger.info(f'  └─ Total entity insights fetched: {total}')
        return total

    def _fetch_entity_insights(self, entity_id, level, ad_account_id, start_date, end_date):
        """Fetch insights for a specific entity (campaign/adset/ad)"""
        try:
            url = f'{GRAPH_API_BASE}/{entity_id}/insights'

            time_range_json = json.dumps({
                'since': start_date.isoformat(),
                'until': end_date.isoformat(),
            })

            params = {
                'access_token': self.access_token,
                'time_range': time_range_json,
                'time_increment': 1,
                'fields': 'impressions,clicks,spend,reach,actions,cpc,cpm,ctr',
                'limit': 500,
            }

            response = requests.get(url, params=params)

            if response.status_code != 200:
                logger.warning(f'Failed to fetch insights for {level} {entity_id}: {response.status_code}')
                try:
                    error_data = response.json()
                    logger.warning(f'  Error details: {error_data}')
                except:
                    logger.warning(f'  Error body: {response.text[:200]}')
                return 0

            insights = response.json().get('data', [])

            if len(insights) == 0:
                logger.debug(f'No insights returned by Meta API for {level} {entity_id}')
            else:
                logger.debug(f'Received {len(insights)} insights from Meta API for {level} {entity_id}')

            count = 0
            for insight in insights:
                try:
                    date_start = datetime.strptime(insight['date_start'], '%Y-%m-%d').date()
                    date_stop = datetime.strptime(insight['date_stop'], '%Y-%m-%d').date()

                    # Check if this insight already exists (avoid duplicates)
                    if not Insight.objects.filter(
                        level=level,
                        object_id=entity_id,
                        ad_account_id=ad_account_id,
                        date_start=date_start,
                        date_stop=date_stop
                    ).exists():
                        # Use entity_id as object_id - this is correct!
                        Insight.objects.create(
                            level=level,
                            object_id=entity_id,  # Correct object_id!
                            ad_account_id=ad_account_id,
                            date_start=date_start,
                            date_stop=date_stop,
                            metrics=insight,
                            raw=insight,
                        )
                        count += 1
                    else:
                        logger.debug(f'Insight already exists for {level} {entity_id} on {date_start}')
                except Exception as e:
                    logger.error(f'Failed to save insight for {entity_id}: {str(e)}')
                    continue

            if count > 0:
                logger.debug(f'Saved {count} insights for {level} {entity_id}')

            return count

        except Exception as e:
            logger.error(f'Error fetching insights for {level} {entity_id}: {str(e)}')
            return 0

    def _fetch_insights(self, ad_account_id, level, start_date, end_date):
        """Fetch insights for specific level - APPEND ONLY"""
        try:
            url = f'{GRAPH_API_BASE}/{ad_account_id}/insights'

            # CRITICAL: time_range must be JSON STRING, not dict!
            time_range_json = json.dumps({
                'since': start_date.isoformat(),
                'until': end_date.isoformat(),
            })

            params = {
                'access_token': self.access_token,
                'level': level,
                'time_range': time_range_json,  # JSON STRING!
                'time_increment': 1,  # Daily
                'fields': 'impressions,clicks,spend,reach,actions,cpc,cpm,ctr',
                'limit': 500,
            }

            # Log request details (without token)
            logger.info(f'Fetching {level} insights for {ad_account_id}')
            logger.debug(f'URL: {url}')
            logger.debug(f'Params: level={level}, time_range={time_range_json}, fields={params["fields"]}')

            response = requests.get(url, params=params)

            # Log response status
            logger.debug(f'Response status: {response.status_code}')

            # Check for errors BEFORE raise_for_status
            if response.status_code != 200:
                error_body = response.text
                try:
                    error_json = response.json()
                    error_msg = f'Meta API Error: {error_json}'
                    logger.error(f'❌ Meta API returned {response.status_code}: {error_json}')

                    SystemLog.objects.create(
                        level='ERROR',
                        logger_name='meta.sync.insights',
                        message=f'[INSIGHTS] Meta API Error {response.status_code} for {ad_account_id} level={level}: {error_json}'
                    )
                except:
                    error_msg = f'Meta API Error {response.status_code}: {error_body}'
                    logger.error(f'❌ Meta API returned {response.status_code}: {error_body}')

                    SystemLog.objects.create(
                        level='ERROR',
                        logger_name='meta.sync.insights',
                        message=f'[INSIGHTS] Meta API Error {response.status_code} for {ad_account_id} level={level}: {error_body}'
                    )

                raise Exception(error_msg)

            insights = response.json().get('data', [])
            logger.debug(f'Received {len(insights)} insights from Meta API')

            count = 0
            for insight in insights:
                try:
                    # Log first insight to see what fields Meta API returns
                    if count == 0:
                        logger.info(f'Sample insight keys for level={level}: {list(insight.keys())}')
                        logger.info(f'Sample insight data: {insight}')

                    # Determine object_id based on level
                    object_id = (
                        insight.get('ad_id') or
                        insight.get('adset_id') or
                        insight.get('campaign_id') or
                        ad_account_id
                    )

                    # Log what we're using as object_id
                    if count == 0:
                        logger.info(f'Using object_id: {object_id} for level={level}')

                    # APPEND ONLY - no update_or_create, just create
                    Insight.objects.create(
                        level=level,
                        object_id=object_id,
                        ad_account_id=ad_account_id,
                        date_start=datetime.strptime(insight['date_start'], '%Y-%m-%d').date(),
                        date_stop=datetime.strptime(insight['date_stop'], '%Y-%m-%d').date(),
                        metrics=insight,
                        raw=insight,
                    )
                    count += 1
                except Exception as e:
                    logger.error(f'Failed to save insight: {str(e)}')
                    logger.error(f'Problematic insight data: {insight}')
                    SystemLog.objects.create(
                        level='ERROR',
                        logger_name='meta.sync.insights',
                        message=f'[INSIGHTS] Failed to save insight for {ad_account_id}: {str(e)}'
                    )
                    # Continue with next insight instead of failing completely
                    continue

            logger.info(f'Successfully saved {count} insights for {ad_account_id} level={level}')
            return count

        except requests.exceptions.RequestException as e:
            error_msg = f'Network error fetching {level} insights for {ad_account_id}: {str(e)}'
            logger.error(f'❌ {error_msg}')
            SystemLog.objects.create(
                level='ERROR',
                logger_name='meta.sync.insights',
                message=f'[INSIGHTS] Network error for {ad_account_id} level={level}: {str(e)}'
            )
            raise Exception(error_msg)
        except Exception as e:
            error_msg = f'Failed to fetch {level} insights for {ad_account_id}: {str(e)}'
            logger.error(f'❌ {error_msg}')
            SystemLog.objects.create(
                level='ERROR',
                logger_name='meta.sync.insights',
                message=f'[INSIGHTS] Failed for {ad_account_id} level={level}: {str(e)}'
            )
            raise
