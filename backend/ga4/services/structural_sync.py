import logging
from oauth.models import GA4Token, GA4User
from oauth.services.ga4_oauth import refresh_ga4_token
from ga4.models import GA4Account, GA4Property
from ga4.services.ga4_api import GA4APIClient

logger = logging.getLogger('smartanalytics.sync')


def sync_structural(user):
    token = GA4Token.objects.get(user=user)
    refresh_ga4_token(user)
    token.refresh_from_db()

    client = GA4APIClient(token.access_token)
    ga4_user = GA4User.objects.get(user=user)

    results = {'accounts': 0, 'properties': 0}

    # 1. Fetch accounts
    accounts = client.get_accounts()
    for acc in accounts:
        GA4Account.objects.update_or_create(
            user=user, account_id=acc['id'],
            defaults={
                'google_user_id': ga4_user.google_user_id,
                'name': acc.get('name', ''),
            },
        )
    results['accounts'] = len(accounts)
    logger.info(f'GA4: {len(accounts)} accounts synced')

    # 2. Fetch properties for each account
    total_properties = 0
    for acc in accounts:
        try:
            properties = client.get_properties(acc['id'])
            account_obj = GA4Account.objects.get(user=user, account_id=acc['id'])

            for prop in properties:
                GA4Property.objects.update_or_create(
                    user=user, property_id=prop['id'],
                    defaults={
                        'google_user_id': ga4_user.google_user_id,
                        'account': account_obj,
                        'name': prop.get('name', ''),
                        'timezone': prop.get('timezone', ''),
                        'currency': prop.get('currency', ''),
                    },
                )
            total_properties += len(properties)
            logger.info(f'GA4 account {acc["id"]}: {len(properties)} properties')
        except Exception as e:
            logger.error(f'GA4 account {acc["id"]}: FAILED - {e}')

    results['properties'] = total_properties
    logger.info(f'GA4 structural sync complete: {results}')
    return results
