import requests
import secrets
import logging
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from oauth.models import OAuthState, MetaToken, MetaUser
from meta.models import MetaBusiness, MetaAccount

logger = logging.getLogger('oauth')

META_OAUTH_URL = 'https://www.facebook.com/v21.0/dialog/oauth'
META_TOKEN_URL = 'https://graph.facebook.com/v21.0/oauth/access_token'
META_GRAPH_URL = 'https://graph.facebook.com/v21.0'


def generate_state(user, service_type):
    state = secrets.token_hex(32)
    expires_at = timezone.now() + timedelta(minutes=10)
    OAuthState.objects.filter(user=user, service_type=service_type).delete()
    OAuthState.objects.create(state=state, user=user, service_type=service_type, expires_at=expires_at)
    logger.info(f'Generated OAuth state for {user.email} ({service_type})')
    return state


def verify_state(state, service_type):
    """Verify OAuth state and return the associated user. Returns None if invalid."""
    try:
        oauth_state = OAuthState.objects.get(state=state, service_type=service_type)
        if oauth_state.is_expired():
            logger.warning(f'OAuth state expired for {oauth_state.user.email} ({service_type})')
            oauth_state.delete()
            return None
        user = oauth_state.user
        oauth_state.delete()
        logger.info(f'OAuth state verified for {user.email} ({service_type})')
        return user
    except OAuthState.DoesNotExist:
        logger.warning(f'Invalid OAuth state ({service_type})')
        return None


def generate_meta_oauth_url(user, redirect_uri):
    state = generate_state(user, 'meta')
    scopes = ['ads_read', 'business_management']
    url = (
        f"{META_OAUTH_URL}?client_id={settings.META_APP_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&scope={','.join(scopes)}"
        f"&response_type=code"
        f"&state={state}"
    )
    logger.info(f'Generated Meta OAuth URL for {user.email}')
    return {'url': url, 'state': state}


def meta_exchange_code(code, redirect_uri, user):
    logger.info(f'META OAUTH: Starting token exchange for {user.email}')

    # Step 1: Exchange code for short-lived token
    logger.info('Step 1: Exchanging code for short-lived token...')
    response = requests.get(META_TOKEN_URL, params={
        'client_id': settings.META_APP_ID,
        'client_secret': settings.META_APP_SECRET,
        'redirect_uri': redirect_uri,
        'code': code,
    }, timeout=10)
    response.raise_for_status()
    short_lived_token = response.json().get('access_token')
    logger.info('Short-lived token obtained')

    # Step 2: Exchange for long-lived token (60 days)
    logger.info('Step 2: Exchanging for long-lived token...')
    response = requests.get(META_TOKEN_URL, params={
        'grant_type': 'fb_exchange_token',
        'client_id': settings.META_APP_ID,
        'client_secret': settings.META_APP_SECRET,
        'fb_exchange_token': short_lived_token,
    }, timeout=10)
    response.raise_for_status()
    data = response.json()
    long_lived_token = data.get('access_token')
    expires_in = data.get('expires_in', 60 * 24 * 60 * 60)
    expiry_date = timezone.now() + timedelta(seconds=expires_in)
    logger.info(f'Long-lived token obtained (expires in {expires_in // 86400} days)')

    # Step 3: Fetch user info
    logger.info('Step 3: Fetching user info...')
    response = requests.get(f'{META_GRAPH_URL}/me', params={
        'access_token': long_lived_token,
        'fields': 'id,name,email',
    }, timeout=10)
    response.raise_for_status()
    user_info = response.json()
    meta_user_id = user_info.get('id')
    name = user_info.get('name', 'Unknown')
    email = user_info.get('email', '')
    logger.info(f'User info: {name} (ID: {meta_user_id})')

    # Step 4: Save MetaUser
    MetaUser.objects.update_or_create(user=user, defaults={
        'meta_user_id': meta_user_id,
        'name': name,
        'email': email,
    })
    logger.info(f'MetaUser saved for {user.email}')

    # Step 5: Fetch businesses
    logger.info('Step 5: Fetching businesses...')
    response = requests.get(f'{META_GRAPH_URL}/me/businesses', params={
        'access_token': long_lived_token,
        'fields': 'id,name',
    }, timeout=10)
    response.raise_for_status()
    businesses = response.json().get('data', [])
    business_id_map = {}
    for biz in businesses:
        obj, _ = MetaBusiness.objects.update_or_create(
            user=user, business_id=biz['id'],
            defaults={'meta_user_id': meta_user_id, 'name': biz.get('name', '')},
        )
        business_id_map[biz['id']] = obj
    logger.info(f'{len(businesses)} businesses synced')

    # Step 6: Fetch ad accounts
    logger.info('Step 6: Fetching ad accounts...')
    response = requests.get(f'{META_GRAPH_URL}/me/adaccounts', params={
        'access_token': long_lived_token,
        'fields': 'id,name,currency,timezone_name,account_status,business',
    }, timeout=10)
    response.raise_for_status()
    accounts = response.json().get('data', [])
    for acc in accounts:
        biz_id = acc.get('business', {}).get('id') if isinstance(acc.get('business'), dict) else None
        business = business_id_map.get(biz_id)
        MetaAccount.objects.update_or_create(
            user=user, account_id=acc['id'],
            defaults={
                'meta_user_id': meta_user_id,
                'business': business,
                'name': acc.get('name', ''),
                'status': acc.get('account_status', 1),
                'currency': acc.get('currency', ''),
                'timezone_offset_hours_utc': acc.get('timezone_name', ''),
            },
        )
    logger.info(f'{len(accounts)} accounts synced')

    # Step 7: Save MetaToken
    MetaToken.objects.update_or_create(user=user, defaults={
        'token': long_lived_token,
        'scopes': ['ads_read', 'business_management'],
        'expiry_date': expiry_date,
        'meta_user_id': meta_user_id,
        'name': name,
    })
    logger.info(f'MetaToken saved for {user.email}')

    return {
        'success': True,
        'user_name': name,
        'meta_user_id': meta_user_id,
        'businesses': len(businesses),
        'accounts': len(accounts),
        'expires_at': expiry_date,
    }
