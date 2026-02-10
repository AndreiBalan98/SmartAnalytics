import logging
from datetime import timedelta
from decimal import Decimal
from oauth.models import MetaToken, MetaUser
from meta.models import MetaAccount, MetaCampaign, MetaAdset, MetaAd, MetaInsight
from meta.services.meta_api import MetaAPIClient

logger = logging.getLogger('smartanalytics.sync')


def get_entities_by_level(user, account_id):
    """Yield (level, [object_ids]) for each level."""
    yield 'account', [account_id]

    campaign_ids = list(
        MetaCampaign.objects.filter(user=user, account__account_id=account_id)
        .values_list('campaign_id', flat=True)
    )
    if campaign_ids:
        yield 'campaign', campaign_ids

    adset_ids = list(
        MetaAdset.objects.filter(user=user, account__account_id=account_id)
        .values_list('adset_id', flat=True)
    )
    if adset_ids:
        yield 'adset', adset_ids

    ad_ids = list(
        MetaAd.objects.filter(user=user, account__account_id=account_id)
        .values_list('ad_id', flat=True)
    )
    if ad_ids:
        yield 'ad', ad_ids


def sync_insights(user, account_ids, start_date, end_date):
    token = MetaToken.objects.get(user=user)
    client = MetaAPIClient(token.token)
    meta_user = MetaUser.objects.get(user=user)

    all_dates = {start_date + timedelta(days=i) for i in range((end_date - start_date).days + 1)}
    total_synced = 0

    for account_id in account_ids:
        logger.info(f'Syncing insights for account {account_id}...')

        for level, object_ids in get_entities_by_level(user, account_id):
            for object_id in object_ids:
                existing = set(
                    MetaInsight.objects.filter(
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
                    insights = client.get_insights(object_id, min(missing), max(missing))
                    count = 0
                    for row in insights:
                        from datetime import datetime
                        row_date = datetime.strptime(row['date_start'], '%Y-%m-%d').date()

                        MetaInsight.objects.update_or_create(
                            date=row_date, level=level, object_id=object_id,
                            defaults={
                                'user': user,
                                'meta_user_id': meta_user.meta_user_id,
                                'spend': Decimal(str(row.get('spend', '0'))),
                                'impressions': int(row.get('impressions', 0)),
                                'reach': int(row.get('reach', 0)),
                                'clicks': int(row.get('clicks', 0)),
                                'cpc': Decimal(str(row.get('cpc', '0'))),
                                'cpm': Decimal(str(row.get('cpm', '0'))),
                                'ctr': Decimal(str(row.get('ctr', '0'))),
                                'actions': row.get('actions', []),
                                'action_values': row.get('action_values', []),
                            },
                        )
                        count += 1

                    total_synced += count
                    logger.info(f'{level} {object_id}: {count} insights synced OK')

                except Exception as e:
                    logger.error(f'{level} {object_id}: FAILED - {e}')

    logger.info(f'Insights sync complete: {total_synced} total insights')
    return {'success': True, 'total_insights': total_synced}
