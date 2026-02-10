import logging
from oauth.models import GoogleToken, GoogleUser
from oauth.services.google_oauth import refresh_google_token
from google_ads.models import GoogleAdsAccount, GoogleAdsCampaign, GoogleAdsAdGroup, GoogleAdsAd
from google_ads.services.google_ads_api import GoogleAdsAPIClient

logger = logging.getLogger('smartanalytics.sync')


def sync_structural(user, account_ids):
    token = GoogleToken.objects.get(user=user)
    refresh_google_token(user)
    token.refresh_from_db()

    client = GoogleAdsAPIClient(token.access_token)
    google_user = GoogleUser.objects.get(user=user)

    results = {}

    for account in GoogleAdsAccount.objects.filter(user=user, account_id__in=account_ids):
        logger.info(f'Syncing structural data for Google Ads account {account.account_id}...')

        try:
            # 1. Campaigns
            campaigns = client.get_campaigns(account.account_id)
            for c in campaigns:
                GoogleAdsCampaign.objects.update_or_create(
                    user=user, campaign_id=c['id'],
                    defaults={
                        'google_user_id': google_user.google_user_id,
                        'account': account,
                        'name': c.get('name', ''),
                        'status': c.get('status', ''),
                        'campaign_type': c.get('type', ''),
                        'daily_budget': c.get('daily_budget', ''),
                    },
                )
            logger.info(f'{account.account_id}: {len(campaigns)} campaigns')

            # 2. Ad Groups
            ad_groups = client.get_ad_groups(account.account_id)
            for ag in ad_groups:
                campaign = GoogleAdsCampaign.objects.filter(
                    user=user, campaign_id=ag.get('campaign_id', '')
                ).first()
                if not campaign:
                    continue

                GoogleAdsAdGroup.objects.update_or_create(
                    user=user, ad_group_id=ag['id'],
                    defaults={
                        'google_user_id': google_user.google_user_id,
                        'account': account,
                        'campaign': campaign,
                        'name': ag.get('name', ''),
                        'status': ag.get('status', ''),
                    },
                )
            logger.info(f'{account.account_id}: {len(ad_groups)} ad groups')

            # 3. Ads
            ads = client.get_ads(account.account_id)
            for a in ads:
                campaign = GoogleAdsCampaign.objects.filter(
                    user=user, campaign_id=a.get('campaign_id', '')
                ).first()
                ad_group = GoogleAdsAdGroup.objects.filter(
                    user=user, ad_group_id=a.get('ad_group_id', '')
                ).first()
                if not campaign or not ad_group:
                    continue

                GoogleAdsAd.objects.update_or_create(
                    user=user, ad_id=a['id'],
                    defaults={
                        'google_user_id': google_user.google_user_id,
                        'account': account,
                        'campaign': campaign,
                        'ad_group': ad_group,
                        'name': a.get('name', ''),
                        'status': a.get('status', ''),
                        'ad_type': a.get('ad_type', ''),
                    },
                )
            logger.info(f'{account.account_id}: {len(ads)} ads')

            results[account.account_id] = {
                'campaigns': len(campaigns),
                'ad_groups': len(ad_groups),
                'ads': len(ads),
            }

        except Exception as e:
            logger.error(f'{account.account_id}: FAILED - {e}')
            results[account.account_id] = {'error': str(e)}

    return results
