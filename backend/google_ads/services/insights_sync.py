import logging
from datetime import timedelta, datetime
from decimal import Decimal
from oauth.models import GoogleToken, GoogleUser
from oauth.services.google_oauth import refresh_google_token
from google_ads.models import GoogleAdsAccount, GoogleAdsCampaign, GoogleAdsAdGroup, GoogleAdsAd, GoogleAdsInsight
from google_ads.services.google_ads_api import GoogleAdsAPIClient

logger = logging.getLogger('smartanalytics.sync')


def get_entities_by_level(user, account_id):
    """Yield (level, resource_type, [object_ids]) for each level."""
    yield 'account', 'customer', [account_id]

    campaign_ids = list(
        GoogleAdsCampaign.objects.filter(user=user, account__account_id=account_id)
        .values_list('campaign_id', flat=True)
    )
    if campaign_ids:
        yield 'campaign', 'campaign', campaign_ids

    ad_group_ids = list(
        GoogleAdsAdGroup.objects.filter(user=user, account__account_id=account_id)
        .values_list('ad_group_id', flat=True)
    )
    if ad_group_ids:
        yield 'ad_group', 'ad_group', ad_group_ids

    ad_ids = list(
        GoogleAdsAd.objects.filter(user=user, account__account_id=account_id)
        .values_list('ad_id', flat=True)
    )
    if ad_ids:
        yield 'ad', 'ad_group_ad', ad_ids


def sync_insights(user, account_ids, start_date, end_date):
    token = GoogleToken.objects.get(user=user)
    refresh_google_token(user)
    token.refresh_from_db()

    client = GoogleAdsAPIClient(token.access_token)
    google_user = GoogleUser.objects.get(user=user)

    all_dates = {start_date + timedelta(days=i) for i in range((end_date - start_date).days + 1)}
    total_synced = 0

    for account_id in account_ids:
        logger.info(f'Syncing Google Ads insights for account {account_id}...')

        for level, resource_type, object_ids in get_entities_by_level(user, account_id):
            for object_id in object_ids:
                existing = set(
                    GoogleAdsInsight.objects.filter(
                        level=level, object_id=object_id,
                        date__range=(start_date, end_date),
                    ).values_list('date', flat=True)
                )

                missing = all_dates - existing
                if not missing:
                    logger.info(f'{level} {object_id}: complete, skip')
                    continue

                logger.info(f'{level} {object_id}: {len(existing)} existing, {len(missing)} missing')

                try:
                    insights = client.get_insights(
                        account_id, min(missing), max(missing),
                        resource_type=resource_type,
                    )
                    count = 0
                    for row in insights:
                        row_object_id = row.get('object_id', object_id)
                        if level != 'account' and row_object_id != object_id:
                            continue

                        row_date = datetime.strptime(row['date'], '%Y-%m-%d').date()

                        GoogleAdsInsight.objects.update_or_create(
                            date=row_date, level=level, object_id=object_id,
                            defaults={
                                'user': user,
                                'google_user_id': google_user.google_user_id,
                                'spend': Decimal(str(row.get('spend', 0))),
                                'impressions': int(row.get('impressions', 0)),
                                'clicks': int(row.get('clicks', 0)),
                                'cpc': Decimal(str(row.get('cpc', 0))),
                                'cpm': Decimal(str(row.get('cpm', 0))),
                                'ctr': Decimal(str(row.get('ctr', 0))),
                                'conversions': Decimal(str(row.get('conversions', 0))),
                                'conversion_value': Decimal(str(row.get('conversion_value', 0))),
                            },
                        )
                        count += 1

                    total_synced += count
                    logger.info(f'{level} {object_id}: {count} insights synced OK')

                except Exception as e:
                    logger.error(f'{level} {object_id}: FAILED - {e}')

    logger.info(f'Google Ads insights sync complete: {total_synced} total insights')
    return {'success': True, 'total_insights': total_synced}
