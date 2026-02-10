import logging
from datetime import timedelta, datetime
from decimal import Decimal
from oauth.models import GA4Token, GA4User
from oauth.services.ga4_oauth import refresh_ga4_token
from ga4.models import GA4Property, GA4Insight
from ga4.services.ga4_api import GA4APIClient

logger = logging.getLogger('smartanalytics.sync')


def sync_insights(user, property_ids, start_date, end_date):
    token = GA4Token.objects.get(user=user)
    refresh_ga4_token(user)
    token.refresh_from_db()

    client = GA4APIClient(token.access_token)
    ga4_user = GA4User.objects.get(user=user)

    all_dates = {start_date + timedelta(days=i) for i in range((end_date - start_date).days + 1)}
    total_synced = 0

    for property_id in property_ids:
        logger.info(f'Syncing GA4 insights for property {property_id}...')

        # Check existing dates (without source/medium breakdown)
        existing = set(
            GA4Insight.objects.filter(
                property_id=property_id,
                source='', medium='',
                date__range=(start_date, end_date),
            ).values_list('date', flat=True)
        )

        missing = all_dates - existing
        if not missing:
            logger.info(f'Property {property_id}: complete, skip')
            continue

        logger.info(f'Property {property_id}: {len(existing)} existing, {len(missing)} missing')

        try:
            # Fetch basic report (date only)
            rows = client.run_report(property_id, min(missing), max(missing))
            count = 0

            for row in rows:
                # GA4 date format: "20260101"
                date_str = row.get('date', '')
                try:
                    row_date = datetime.strptime(date_str, '%Y%m%d').date()
                except ValueError:
                    continue

                GA4Insight.objects.update_or_create(
                    date=row_date,
                    property_id=property_id,
                    source='',
                    medium='',
                    defaults={
                        'user': user,
                        'google_user_id': ga4_user.google_user_id,
                        'sessions': int(row.get('sessions', 0)),
                        'users': int(row.get('totalUsers', 0)),
                        'pageviews': int(row.get('screenPageViews', 0)),
                        'bounce_rate': Decimal(str(row.get('bounceRate', 0))),
                        'conversions': int(row.get('conversions', 0)),
                        'events': int(row.get('eventCount', 0)),
                        'revenue': Decimal(str(row.get('totalRevenue', 0))),
                    },
                )
                count += 1

            total_synced += count
            logger.info(f'Property {property_id}: {count} insights synced OK')

            # Also fetch with source/medium breakdown
            try:
                source_rows = client.run_report(
                    property_id, min(missing), max(missing),
                    dimensions=['sessionSource', 'sessionMedium'],
                )
                source_count = 0
                for row in source_rows:
                    date_str = row.get('date', '')
                    try:
                        row_date = datetime.strptime(date_str, '%Y%m%d').date()
                    except ValueError:
                        continue

                    source = row.get('sessionSource', '')
                    medium = row.get('sessionMedium', '')

                    GA4Insight.objects.update_or_create(
                        date=row_date,
                        property_id=property_id,
                        source=source,
                        medium=medium,
                        defaults={
                            'user': user,
                            'google_user_id': ga4_user.google_user_id,
                            'sessions': int(row.get('sessions', 0)),
                            'users': int(row.get('totalUsers', 0)),
                            'pageviews': int(row.get('screenPageViews', 0)),
                            'bounce_rate': Decimal(str(row.get('bounceRate', 0))),
                            'conversions': int(row.get('conversions', 0)),
                            'events': int(row.get('eventCount', 0)),
                            'revenue': Decimal(str(row.get('totalRevenue', 0))),
                        },
                    )
                    source_count += 1

                total_synced += source_count
                logger.info(f'Property {property_id}: {source_count} source/medium insights synced')
            except Exception as e:
                logger.warning(f'Property {property_id}: source/medium sync failed - {e}')

        except Exception as e:
            logger.error(f'Property {property_id}: FAILED - {e}')

    logger.info(f'GA4 insights sync complete: {total_synced} total insights')
    return {'success': True, 'total_insights': total_synced}
