import logging
from datetime import datetime
from oauth.models import MetaToken, MetaUser
from meta.models import MetaAccount, MetaCampaign, MetaAdset, MetaAd
from meta.services.meta_api import MetaAPIClient

logger = logging.getLogger('smartanalytics.sync')


def extract_creative(ad_data):
    creative = ad_data.get('creative', {})
    if not isinstance(creative, dict):
        return {}
    return {
        'id': creative.get('id', ''),
        'name': creative.get('name', ''),
        'status': creative.get('status', ''),
        'body': creative.get('body', ''),
        'title': creative.get('title', ''),
        'image_url': creative.get('image_url', ''),
    }


def sync_structural(user, account_ids):
    token = MetaToken.objects.get(user=user)
    client = MetaAPIClient(token.token)
    meta_user = MetaUser.objects.get(user=user)

    results = {}

    for account in MetaAccount.objects.filter(user=user, account_id__in=account_ids):
        logger.info(f'Syncing structural data for {account.account_id}...')

        try:
            # 1. Campaigns
            campaigns = client.get_campaigns(account.account_id)
            for c in campaigns:
                updated_time = None
                if c.get('updated_time'):
                    try:
                        updated_time = datetime.fromisoformat(c['updated_time'].replace('+0000', '+00:00'))
                    except (ValueError, AttributeError):
                        pass

                MetaCampaign.objects.update_or_create(
                    user=user, campaign_id=c['id'],
                    defaults={
                        'meta_user_id': meta_user.meta_user_id,
                        'business': account.business,
                        'account': account,
                        'name': c.get('name', ''),
                        'status': c.get('status', ''),
                        'objective': c.get('objective', ''),
                        'daily_budget': c.get('daily_budget', ''),
                        'updated_time': updated_time,
                    },
                )
            logger.info(f'{account.account_id}: {len(campaigns)} campaigns')

            # 2. Adsets
            adsets = client.get_adsets(account.account_id)
            for a in adsets:
                campaign = MetaCampaign.objects.filter(user=user, campaign_id=a.get('campaign_id', '')).first()
                if not campaign:
                    continue

                updated_time = None
                if a.get('updated_time'):
                    try:
                        updated_time = datetime.fromisoformat(a['updated_time'].replace('+0000', '+00:00'))
                    except (ValueError, AttributeError):
                        pass

                MetaAdset.objects.update_or_create(
                    user=user, adset_id=a['id'],
                    defaults={
                        'meta_user_id': meta_user.meta_user_id,
                        'business': account.business,
                        'account': account,
                        'campaign': campaign,
                        'name': a.get('name', ''),
                        'status': a.get('status', ''),
                        'optimization_goal': a.get('optimization_goal', ''),
                        'daily_budget': a.get('daily_budget', ''),
                        'updated_time': updated_time,
                    },
                )
            logger.info(f'{account.account_id}: {len(adsets)} adsets')

            # 3. Ads with creatives inline
            ads = client.get_ads_with_creatives(account.account_id)
            for a in ads:
                campaign = MetaCampaign.objects.filter(user=user, campaign_id=a.get('campaign_id', '')).first()
                adset = MetaAdset.objects.filter(user=user, adset_id=a.get('adset_id', '')).first()
                if not campaign or not adset:
                    continue

                MetaAd.objects.update_or_create(
                    user=user, ad_id=a['id'],
                    defaults={
                        'meta_user_id': meta_user.meta_user_id,
                        'business': account.business,
                        'account': account,
                        'campaign': campaign,
                        'adset': adset,
                        'name': a.get('name', ''),
                        'status': a.get('status', ''),
                        'creative': extract_creative(a),
                    },
                )
            logger.info(f'{account.account_id}: {len(ads)} ads')

            results[account.account_id] = {
                'campaigns': len(campaigns),
                'adsets': len(adsets),
                'ads': len(ads),
            }

        except Exception as e:
            logger.error(f'{account.account_id}: FAILED - {e}')
            results[account.account_id] = {'error': str(e)}

    return results
