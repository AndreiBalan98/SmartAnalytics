"""
Meta Ads API service layer
Handles OAuth and API calls to Meta Graph API
"""

import requests
import logging
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from datetime import timedelta, datetime, date
from integrations.models import MetaIntegration
from campaigns.models import Campaign, AdSet, Ad
from metrics.models import DailyMetric

logger = logging.getLogger(__name__)

GRAPH_API_VERSION = 'v21.0'
GRAPH_API_BASE = f'https://graph.facebook.com/{GRAPH_API_VERSION}'


def exchange_code_for_token(code: str, redirect_uri: str, agency) -> dict:
    """
    Exchange authorization code for long-lived access token
    and save it for the agency
    """
    url = f'{GRAPH_API_BASE}/oauth/access_token'
    params = {
        'client_id': settings.META_APP_ID,
        'client_secret': settings.META_APP_SECRET,
        'redirect_uri': redirect_uri,
        'code': code,
    }
    
    response = requests.get(url, params=params)
    response.raise_for_status()
    
    data = response.json()
    access_token = data['access_token']
    
    # Get business info
    business_info = get_business_info(access_token)
    
    # Calculate expiration (Meta tokens are typically 60 days for long-lived)
    expires_at = timezone.now() + timedelta(days=60)
    
    # Create or update Meta integration for this agency
    integration, created = MetaIntegration.objects.update_or_create(
        agency=agency,
        defaults={
            'access_token': access_token,
            'token_type': data.get('token_type', 'bearer'),
            'expires_at': expires_at,
            'business_id': business_info.get('id', ''),
            'business_name': business_info.get('name', ''),
            'last_refreshed_at': timezone.now(),
        }
    )
    
    return {
        'success': True,
        'created': created,
        'business_name': business_info.get('name', ''),
    }


def get_business_info(access_token: str) -> dict:
    """
    Get basic business/user info from Meta
    """
    try:
        url = f'{GRAPH_API_BASE}/me'
        params = {
            'access_token': access_token,
            'fields': 'id,name',
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        return response.json()
    except Exception as e:
        print(f'Failed to get business info: {e}')
        return {}


def get_ad_accounts(agency) -> list:
    """
    Fetch ad accounts from Meta Graph API for the agency
    """
    try:
        integration = MetaIntegration.objects.get(agency=agency)
    except MetaIntegration.DoesNotExist:
        return []
    
    url = f'{GRAPH_API_BASE}/me/adaccounts'
    params = {
        'access_token': integration.access_token,
        'fields': 'id,name,currency,account_status',
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        return data.get('data', [])
    except Exception as e:
        print(f'Failed to fetch ad accounts: {e}')
        return []


def get_insights(agency, account_id: str, date_preset: str = 'last_7d') -> dict:
    """
    Fetch insights for a specific ad account
    """
    try:
        integration = MetaIntegration.objects.get(agency=agency)
    except MetaIntegration.DoesNotExist:
        raise ValueError('Meta integration not found for this agency')
    
    # Remove 'act_' prefix if present
    if account_id.startswith('act_'):
        account_id = account_id
    
    url = f'{GRAPH_API_BASE}/{account_id}/insights'
    params = {
        'access_token': integration.access_token,
        'date_preset': date_preset,
        'fields': 'spend,impressions,clicks,actions,action_values',
        'level': 'account',
        'time_increment': 1,
    }
    
    response = requests.get(url, params=params)
    response.raise_for_status()
    
    data = response.json()
    
    # Process insights
    insights = data.get('data', [])
    
    total_spend = 0
    total_impressions = 0
    total_clicks = 0
    total_purchases = 0
    total_revenue = 0
    
    for day in insights:
        total_spend += float(day.get('spend', 0))
        total_impressions += int(day.get('impressions', 0))
        total_clicks += int(day.get('clicks', 0))
        
        # Extract purchases and revenue
        actions = day.get('actions', [])
        for action in actions:
            if action.get('action_type') == 'offsite_conversion.fb_pixel_purchase':
                total_purchases += int(action.get('value', 0))
        
        action_values = day.get('action_values', [])
        for action_value in action_values:
            if action_value.get('action_type') == 'offsite_conversion.fb_pixel_purchase':
                total_revenue += float(action_value.get('value', 0))
    
    roas = (total_revenue / total_spend) if total_spend > 0 else 0
    
    return {
        'account_id': account_id,
        'date_range': date_preset,
        'metrics': {
            'spend': round(total_spend, 2),
            'impressions': total_impressions,
            'clicks': total_clicks,
            'purchases': total_purchases,
            'revenue': round(total_revenue, 2),
            'roas': round(roas, 2),
        }
    }


def sync_campaigns(agency, account_id: str, access_token: str) -> dict:
    """
    Sync campaigns for a specific ad account.
    Returns: {'created': count, 'updated': count, 'errors': []}
    """
    result = {'created': 0, 'updated': 0, 'errors': []}

    try:
        url = f'{GRAPH_API_BASE}/{account_id}/campaigns'
        params = {
            'access_token': access_token,
            'fields': 'id,name,status,objective,daily_budget,lifetime_budget,created_time',
            'limit': 500,
        }

        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        campaigns_data = data.get('data', [])

        for campaign_data in campaigns_data:
            try:
                # Parse created_time
                platform_created_at = None
                if campaign_data.get('created_time'):
                    platform_created_at = datetime.fromisoformat(
                        campaign_data['created_time'].replace('Z', '+00:00')
                    )

                # Upsert campaign
                campaign, created = Campaign.objects.update_or_create(
                    platform='meta',
                    external_id=campaign_data['id'],
                    defaults={
                        'agency': agency,
                        'account_id': account_id,
                        'name': campaign_data.get('name', ''),
                        'status': campaign_data.get('status', 'unknown').lower(),
                        'objective': campaign_data.get('objective', ''),
                        'daily_budget': campaign_data.get('daily_budget'),
                        'lifetime_budget': campaign_data.get('lifetime_budget'),
                        'platform_created_at': platform_created_at,
                    }
                )

                if created:
                    result['created'] += 1
                else:
                    result['updated'] += 1

            except Exception as e:
                logger.error(f"Failed to sync campaign {campaign_data.get('id')}: {e}")
                result['errors'].append(f"Campaign {campaign_data.get('id')}: {str(e)}")

        logger.info(f"Synced campaigns for {account_id}: {result['created']} created, {result['updated']} updated")

    except Exception as e:
        logger.error(f"Failed to fetch campaigns for {account_id}: {e}")
        result['errors'].append(f"Fetch failed: {str(e)}")

    return result


def sync_ad_sets(agency, campaign_external_id: str, access_token: str) -> dict:
    """
    Sync ad sets for a specific campaign.
    Returns: {'created': count, 'updated': count, 'errors': []}
    """
    result = {'created': 0, 'updated': 0, 'errors': []}

    try:
        # Get campaign from DB
        campaign = Campaign.objects.get(platform='meta', external_id=campaign_external_id)

        url = f'{GRAPH_API_BASE}/{campaign_external_id}/adsets'
        params = {
            'access_token': access_token,
            'fields': 'id,name,status,daily_budget,lifetime_budget,targeting,created_time',
            'limit': 500,
        }

        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        ad_sets_data = data.get('data', [])

        for ad_set_data in ad_sets_data:
            try:
                # Parse created_time
                platform_created_at = None
                if ad_set_data.get('created_time'):
                    platform_created_at = datetime.fromisoformat(
                        ad_set_data['created_time'].replace('Z', '+00:00')
                    )

                # Upsert ad set
                ad_set, created = AdSet.objects.update_or_create(
                    campaign=campaign,
                    external_id=ad_set_data['id'],
                    defaults={
                        'name': ad_set_data.get('name', ''),
                        'status': ad_set_data.get('status', 'unknown').lower(),
                        'daily_budget': ad_set_data.get('daily_budget'),
                        'lifetime_budget': ad_set_data.get('lifetime_budget'),
                        'targeting': ad_set_data.get('targeting', {}),
                        'platform_created_at': platform_created_at,
                    }
                )

                if created:
                    result['created'] += 1
                else:
                    result['updated'] += 1

            except Exception as e:
                logger.error(f"Failed to sync ad set {ad_set_data.get('id')}: {e}")
                result['errors'].append(f"Ad Set {ad_set_data.get('id')}: {str(e)}")

    except Campaign.DoesNotExist:
        result['errors'].append(f"Campaign {campaign_external_id} not found in DB")
    except Exception as e:
        logger.error(f"Failed to fetch ad sets for campaign {campaign_external_id}: {e}")
        result['errors'].append(f"Fetch failed: {str(e)}")

    return result


def sync_ads(agency, ad_set_external_id: str, access_token: str) -> dict:
    """
    Sync ads for a specific ad set.
    Returns: {'created': count, 'updated': count, 'errors': []}
    """
    result = {'created': 0, 'updated': 0, 'errors': []}

    try:
        # Get ad set from DB
        ad_set = AdSet.objects.get(external_id=ad_set_external_id)

        url = f'{GRAPH_API_BASE}/{ad_set_external_id}/ads'
        params = {
            'access_token': access_token,
            'fields': 'id,name,status,creative,created_time',
            'limit': 500,
        }

        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        ads_data = data.get('data', [])

        for ad_data in ads_data:
            try:
                # Parse created_time
                platform_created_at = None
                if ad_data.get('created_time'):
                    platform_created_at = datetime.fromisoformat(
                        ad_data['created_time'].replace('Z', '+00:00')
                    )

                # Upsert ad
                ad, created = Ad.objects.update_or_create(
                    ad_set=ad_set,
                    external_id=ad_data['id'],
                    defaults={
                        'name': ad_data.get('name', ''),
                        'status': ad_data.get('status', 'unknown').lower(),
                        'creative': ad_data.get('creative', {}),
                        'platform_created_at': platform_created_at,
                    }
                )

                if created:
                    result['created'] += 1
                else:
                    result['updated'] += 1

            except Exception as e:
                logger.error(f"Failed to sync ad {ad_data.get('id')}: {e}")
                result['errors'].append(f"Ad {ad_data.get('id')}: {str(e)}")

    except AdSet.DoesNotExist:
        result['errors'].append(f"Ad Set {ad_set_external_id} not found in DB")
    except Exception as e:
        logger.error(f"Failed to fetch ads for ad set {ad_set_external_id}: {e}")
        result['errors'].append(f"Fetch failed: {str(e)}")

    return result


def sync_insights_for_account(agency, account_id: str, access_token: str, days: int = 30) -> dict:
    """
    Sync daily insights for an ad account (last N days).
    Returns: {'created': count, 'updated': count, 'errors': []}
    """
    result = {'created': 0, 'updated': 0, 'errors': []}

    try:
        # Calculate date range
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        url = f'{GRAPH_API_BASE}/{account_id}/insights'
        params = {
            'access_token': access_token,
            'level': 'account',
            'time_increment': 1,
            'time_range': f'{{"since":"{start_date.strftime("%Y-%m-%d")}","until":"{end_date.strftime("%Y-%m-%d")}"}}',
            'fields': 'spend,impressions,clicks,actions,action_values,account_currency',
            'limit': 500,
        }

        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        insights_data = data.get('data', [])

        for day_data in insights_data:
            try:
                # Parse date
                date_str = day_data.get('date_start')
                if not date_str:
                    continue

                metric_date = datetime.strptime(date_str, '%Y-%m-%d').date()

                # Extract metrics
                spend = float(day_data.get('spend', 0))
                impressions = int(day_data.get('impressions', 0))
                clicks = int(day_data.get('clicks', 0))
                currency = day_data.get('account_currency', 'USD')

                # Extract conversions (purchases)
                conversions = 0
                conversion_value = 0.0

                actions = day_data.get('actions', [])
                for action in actions:
                    if action.get('action_type') == 'offsite_conversion.fb_pixel_purchase':
                        conversions = int(float(action.get('value', 0)))

                action_values = day_data.get('action_values', [])
                for action_value in action_values:
                    if action_value.get('action_type') == 'offsite_conversion.fb_pixel_purchase':
                        conversion_value = float(action_value.get('value', 0))

                # Upsert daily metric
                metric, created = DailyMetric.objects.update_or_create(
                    platform='meta',
                    entity_type='account',
                    entity_id=account_id,
                    date=metric_date,
                    defaults={
                        'agency': agency,
                        'account_id': account_id,
                        'impressions': impressions,
                        'clicks': clicks,
                        'spend': spend,
                        'currency': currency,
                        'conversions': conversions,
                        'conversion_value': conversion_value,
                    }
                )

                if created:
                    result['created'] += 1
                else:
                    result['updated'] += 1

            except Exception as e:
                logger.error(f"Failed to sync metric for date {day_data.get('date_start')}: {e}")
                result['errors'].append(f"Date {day_data.get('date_start')}: {str(e)}")

        logger.info(f"Synced insights for {account_id}: {result['created']} created, {result['updated']} updated")

    except Exception as e:
        logger.error(f"Failed to fetch insights for {account_id}: {e}")
        result['errors'].append(f"Fetch failed: {str(e)}")

    return result


def sync_all_data(agency, days: int = 30) -> dict:
    """
    Orchestrate full sync: campaigns -> ad sets -> ads -> insights for all ad accounts.
    Skips failed accounts and continues with the rest.

    Returns: {
        'success': bool,
        'ad_accounts_synced': count,
        'campaigns': {'created': X, 'updated': Y},
        'ad_sets': {'created': X, 'updated': Y},
        'ads': {'created': X, 'updated': Y},
        'metrics': {'created': X, 'updated': Y},
        'errors': []
    }
    """
    result = {
        'success': True,
        'ad_accounts_synced': 0,
        'campaigns': {'created': 0, 'updated': 0},
        'ad_sets': {'created': 0, 'updated': 0},
        'ads': {'created': 0, 'updated': 0},
        'metrics': {'created': 0, 'updated': 0},
        'errors': []
    }

    try:
        # Get Meta integration
        integration = MetaIntegration.objects.get(agency=agency)
        access_token = integration.access_token

        # Get all ad accounts
        ad_accounts = get_ad_accounts(agency)

        if not ad_accounts:
            result['errors'].append('No ad accounts found')
            result['success'] = False
            return result

        # Sync each ad account
        for account in ad_accounts:
            account_id = account['id']

            try:
                logger.info(f"Starting sync for ad account {account_id}")

                # 1. Sync campaigns
                campaigns_result = sync_campaigns(agency, account_id, access_token)
                result['campaigns']['created'] += campaigns_result['created']
                result['campaigns']['updated'] += campaigns_result['updated']
                result['errors'].extend(campaigns_result['errors'])

                # 2. Get all campaigns for this account and sync their ad sets
                campaigns = Campaign.objects.filter(
                    platform='meta',
                    account_id=account_id,
                    agency=agency
                )

                for campaign in campaigns:
                    # Sync ad sets
                    ad_sets_result = sync_ad_sets(agency, campaign.external_id, access_token)
                    result['ad_sets']['created'] += ad_sets_result['created']
                    result['ad_sets']['updated'] += ad_sets_result['updated']
                    result['errors'].extend(ad_sets_result['errors'])

                    # 3. Sync ads for each ad set
                    ad_sets = AdSet.objects.filter(campaign=campaign)
                    for ad_set in ad_sets:
                        ads_result = sync_ads(agency, ad_set.external_id, access_token)
                        result['ads']['created'] += ads_result['created']
                        result['ads']['updated'] += ads_result['updated']
                        result['errors'].extend(ads_result['errors'])

                # 4. Sync insights (metrics)
                metrics_result = sync_insights_for_account(agency, account_id, access_token, days)
                result['metrics']['created'] += metrics_result['created']
                result['metrics']['updated'] += metrics_result['updated']
                result['errors'].extend(metrics_result['errors'])

                result['ad_accounts_synced'] += 1
                logger.info(f"Completed sync for ad account {account_id}")

            except Exception as e:
                error_msg = f"Failed to sync account {account_id}: {str(e)}"
                logger.error(error_msg)
                result['errors'].append(error_msg)
                # Continue with next account
                continue

        # Update last synced timestamp
        integration.last_refreshed_at = timezone.now()
        integration.save()

        logger.info(f"Sync completed for agency {agency.name}: {result['ad_accounts_synced']} accounts synced")

    except MetaIntegration.DoesNotExist:
        result['success'] = False
        result['errors'].append('Meta integration not found for this agency')
    except Exception as e:
        result['success'] = False
        error_msg = f"Sync orchestration failed: {str(e)}"
        logger.error(error_msg)
        result['errors'].append(error_msg)

    return result