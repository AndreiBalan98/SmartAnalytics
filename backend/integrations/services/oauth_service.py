"""
OAuth Service pentru autentificare externă (Meta, Google Ads, GA4)
Handles OAuth 2.0 flows pentru toate platformele
"""

import requests
import secrets
import logging
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from integrations.models import OAuthState, MetaToken, GoogleToken, GA4Token

logger = logging.getLogger(__name__)

# ==================================
# Meta OAuth Configuration
# ==================================
META_OAUTH_URL = 'https://www.facebook.com/v21.0/dialog/oauth'
META_TOKEN_URL = 'https://graph.facebook.com/v21.0/oauth/access_token'
META_USERINFO_URL = 'https://graph.facebook.com/v21.0/me'

# ==================================
# Google OAuth Configuration
# ==================================
GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_USERINFO_URL = 'https://oauth2.googleapis.com/userinfo'


# ==================================
# HELPER FUNCTIONS
# ==================================

def generate_state(user, service_type: str) -> str:
    """
    Generează și salvează un state OAuth pentru verificare la callback

    Args:
        user: User object
        service_type: 'meta', 'google_ads', 'ga4'

    Returns:
        state string (32 bytes hex)
    """
    state = secrets.token_hex(32)
    expires_at = timezone.now() + timedelta(minutes=10)

    # Șterge state-urile vechi ale utilizatorului pentru același serviciu
    OAuthState.objects.filter(user=user, service_type=service_type).delete()

    # Creează state nou
    OAuthState.objects.create(
        state=state,
        user=user,
        service_type=service_type,
        expires_at=expires_at
    )

    logger.info(f'Generated OAuth state for {user.email} ({service_type}): {state[:8]}...')
    return state


def verify_state(state: str, user, service_type: str) -> bool:
    """
    Verifică state-ul OAuth la callback

    Args:
        state: State string din callback
        user: User object
        service_type: 'meta', 'google_ads', 'ga4'

    Returns:
        True dacă state-ul este valid, False altfel
    """
    try:
        oauth_state = OAuthState.objects.get(
            state=state,
            user=user,
            service_type=service_type
        )

        if oauth_state.is_expired():
            logger.warning(f'OAuth state expired for {user.email} ({service_type})')
            oauth_state.delete()
            return False

        # State valid - șterge-l după verificare
        oauth_state.delete()
        logger.info(f'OAuth state verified for {user.email} ({service_type})')
        return True

    except OAuthState.DoesNotExist:
        logger.warning(f'Invalid OAuth state for {user.email} ({service_type}): {state[:8]}...')
        return False


def cleanup_expired_states():
    """
    Șterge state-urile expirate din baza de date
    Poate fi apelată periodic (cron job)
    """
    deleted_count = OAuthState.objects.filter(expires_at__lt=timezone.now()).delete()[0]
    if deleted_count > 0:
        logger.info(f'Cleaned up {deleted_count} expired OAuth states')
    return deleted_count


# ==================================
# META OAUTH FLOW
# ==================================

def generate_meta_oauth_url(user, redirect_uri: str) -> dict:
    """
    Generează URL-ul OAuth pentru Meta

    Args:
        user: User object
        redirect_uri: URL de callback

    Returns:
        {
            'url': 'https://facebook.com/...',
            'state': 'generated_state'
        }
    """
    state = generate_state(user, 'meta')

    scopes = ['ads_read', 'business_management', 'leads_retrieval']

    params = {
        'client_id': settings.META_APP_ID,
        'redirect_uri': redirect_uri,
        'scope': ','.join(scopes),
        'response_type': 'code',
        'state': state,
    }

    # Construiește URL-ul manual pentru control complet
    url = f"{META_OAUTH_URL}?client_id={params['client_id']}&redirect_uri={params['redirect_uri']}&scope={params['scope']}&response_type={params['response_type']}&state={params['state']}"

    logger.info(f'Generated Meta OAuth URL for {user.email}')
    return {
        'url': url,
        'state': state
    }


def meta_exchange_code(code: str, redirect_uri: str, user) -> dict:
    """
    Flow complet Meta OAuth:
    1. Exchange code pentru short-lived token
    2. Exchange pentru long-lived token (60 zile)
    3. Obține user info (ID + name)
    4. Salvează în MetaToken

    Args:
        code: Authorization code din callback
        redirect_uri: URL de callback (același ca la start)
        user: User object

    Returns:
        {
            'success': True,
            'user_name': 'John Doe',
            'meta_user_id': '123456',
            'expires_at': datetime
        }
    """
    logger.info(f'🔐 META OAUTH: Starting token exchange for {user.email}')

    try:
        # STEP 1: Exchange code pentru short-lived access token
        logger.info('Step 1: Exchanging code for short-lived token...')
        params = {
            'client_id': settings.META_APP_ID,
            'client_secret': settings.META_APP_SECRET,
            'redirect_uri': redirect_uri,
            'code': code,
        }

        response = requests.get(META_TOKEN_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        short_lived_token = data.get('access_token')
        logger.info('✅ Short-lived token obtained')

        # STEP 2: Exchange pentru long-lived token (60 zile)
        logger.info('Step 2: Exchanging for long-lived token...')
        params = {
            'grant_type': 'fb_exchange_token',
            'client_id': settings.META_APP_ID,
            'client_secret': settings.META_APP_SECRET,
            'fb_exchange_token': short_lived_token,
        }

        response = requests.get(META_TOKEN_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        long_lived_token = data.get('access_token')
        expires_in = data.get('expires_in', 60 * 24 * 60 * 60)  # Default 60 zile
        expiry_date = timezone.now() + timedelta(seconds=expires_in)
        logger.info(f'✅ Long-lived token obtained (expires in {expires_in // 86400} days)')

        # STEP 3: Obține user info (ID + name)
        logger.info('Step 3: Fetching user info...')
        params = {
            'access_token': long_lived_token,
            'fields': 'id,name',
        }

        response = requests.get(META_USERINFO_URL, params=params, timeout=10)
        response.raise_for_status()
        user_info = response.json()

        meta_user_id = user_info.get('id')
        name = user_info.get('name', 'Unknown')
        logger.info(f'✅ User info: {name} (ID: {meta_user_id})')

        # STEP 4: Salvează în MetaToken
        logger.info('Step 4: Saving token to database...')
        scopes = ['ads_read', 'business_management', 'leads_retrieval']

        meta_token, created = MetaToken.objects.update_or_create(
            user=user,
            defaults={
                'token': long_lived_token,
                'scopes': scopes,
                'expiry_date': expiry_date,
                'meta_user_id': meta_user_id,
                'name': name,
            }
        )

        action = 'Created' if created else 'Updated'
        logger.info(f'✅ {action} MetaToken for {user.email}')
        logger.info('=' * 80)

        return {
            'success': True,
            'user_name': name,
            'meta_user_id': meta_user_id,
            'expires_at': expiry_date,
        }

    except requests.exceptions.RequestException as e:
        logger.error(f'❌ Meta OAuth failed: {str(e)}')
        raise Exception(f'Meta OAuth request failed: {str(e)}')
    except Exception as e:
        logger.error(f'❌ Meta OAuth failed: {str(e)}')
        raise


# ==================================
# GOOGLE ADS OAUTH FLOW
# ==================================

def generate_google_ads_oauth_url(user, redirect_uri: str) -> dict:
    """
    Generează URL-ul OAuth pentru Google Ads

    Args:
        user: User object
        redirect_uri: URL de callback

    Returns:
        {
            'url': 'https://accounts.google.com/...',
            'state': 'generated_state'
        }
    """
    state = generate_state(user, 'google_ads')

    scopes = [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/adwords'
    ]

    params = {
        'client_id': settings.GOOGLE_CLIENT_ID,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': ' '.join(scopes),
        'access_type': 'offline',  # Pentru refresh token
        'prompt': 'consent',  # Pentru a primi refresh token mereu
        'state': state,
    }

    # Construiește URL-ul
    from urllib.parse import urlencode
    url = f"{GOOGLE_OAUTH_URL}?{urlencode(params)}"

    logger.info(f'Generated Google Ads OAuth URL for {user.email}')
    return {
        'url': url,
        'state': state
    }


def google_ads_exchange_code(code: str, redirect_uri: str, user) -> dict:
    """
    Flow complet Google Ads OAuth:
    1. Exchange code pentru access + refresh token
    2. Obține user info (openid + name)
    3. Salvează în GoogleToken

    Args:
        code: Authorization code din callback
        redirect_uri: URL de callback
        user: User object

    Returns:
        {
            'success': True,
            'user_name': 'John Doe',
            'user_openid': '1234567890',
            'expires_at': datetime
        }
    """
    logger.info(f'🔐 GOOGLE ADS OAUTH: Starting token exchange for {user.email}')

    try:
        # STEP 1: Exchange code pentru access + refresh token
        logger.info('Step 1: Exchanging code for tokens...')
        payload = {
            'code': code,
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        }

        response = requests.post(GOOGLE_TOKEN_URL, data=payload, timeout=10)
        response.raise_for_status()
        data = response.json()

        access_token = data.get('access_token')
        refresh_token = data.get('refresh_token')
        expires_in = data.get('expires_in', 3600)  # Default 1 oră
        expiry_date = timezone.now() + timedelta(seconds=expires_in)

        if not refresh_token:
            logger.warning('⚠️ No refresh token received - user may have already authorized')

        logger.info(f'✅ Tokens obtained (expires in {expires_in // 60} minutes)')

        # STEP 2: Obține user info (openid + name)
        logger.info('Step 2: Fetching user info...')
        headers = {'Authorization': f'Bearer {access_token}'}
        response = requests.get(GOOGLE_USERINFO_URL, headers=headers, timeout=10)
        response.raise_for_status()
        user_info = response.json()

        user_openid = user_info.get('sub')  # OpenID Connect ID
        name = user_info.get('name', 'Unknown')
        email = user_info.get('email', '')
        logger.info(f'✅ User info: {name} ({email}) (OpenID: {user_openid})')

        # STEP 3: Salvează în GoogleToken
        logger.info('Step 3: Saving token to database...')
        scopes = ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/adwords']

        google_token, created = GoogleToken.objects.update_or_create(
            user=user,
            defaults={
                'access_token': access_token,
                'refresh_token': refresh_token or '',  # Salvează empty string dacă nu există
                'scopes': scopes,
                'expiry_date': expiry_date,
                'user_openid': user_openid,
                'name': name,
            }
        )

        action = 'Created' if created else 'Updated'
        logger.info(f'✅ {action} GoogleToken for {user.email}')
        logger.info('=' * 80)

        return {
            'success': True,
            'user_name': name,
            'user_openid': user_openid,
            'expires_at': expiry_date,
        }

    except requests.exceptions.RequestException as e:
        logger.error(f'❌ Google Ads OAuth failed: {str(e)}')
        raise Exception(f'Google Ads OAuth request failed: {str(e)}')
    except Exception as e:
        logger.error(f'❌ Google Ads OAuth failed: {str(e)}')
        raise


# ==================================
# GA4 OAUTH FLOW
# ==================================

def generate_ga4_oauth_url(user, redirect_uri: str) -> dict:
    """
    Generează URL-ul OAuth pentru GA4

    Args:
        user: User object
        redirect_uri: URL de callback

    Returns:
        {
            'url': 'https://accounts.google.com/...',
            'state': 'generated_state'
        }
    """
    state = generate_state(user, 'ga4')

    scopes = [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/analytics.readonly'
    ]

    params = {
        'client_id': settings.GOOGLE_CLIENT_ID,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': ' '.join(scopes),
        'access_type': 'offline',  # Pentru refresh token
        'prompt': 'consent',  # Pentru a primi refresh token mereu
        'state': state,
    }

    # Construiește URL-ul
    from urllib.parse import urlencode
    url = f"{GOOGLE_OAUTH_URL}?{urlencode(params)}"

    logger.info(f'Generated GA4 OAuth URL for {user.email}')
    return {
        'url': url,
        'state': state
    }


def ga4_exchange_code(code: str, redirect_uri: str, user) -> dict:
    """
    Flow complet GA4 OAuth:
    1. Exchange code pentru access + refresh token
    2. Obține user info (openid + name)
    3. Salvează în GA4Token

    Args:
        code: Authorization code din callback
        redirect_uri: URL de callback
        user: User object

    Returns:
        {
            'success': True,
            'user_name': 'John Doe',
            'user_openid': '1234567890',
            'expires_at': datetime
        }
    """
    logger.info(f'🔐 GA4 OAUTH: Starting token exchange for {user.email}')

    try:
        # STEP 1: Exchange code pentru access + refresh token
        logger.info('Step 1: Exchanging code for tokens...')
        payload = {
            'code': code,
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        }

        response = requests.post(GOOGLE_TOKEN_URL, data=payload, timeout=10)
        response.raise_for_status()
        data = response.json()

        access_token = data.get('access_token')
        refresh_token = data.get('refresh_token')
        expires_in = data.get('expires_in', 3600)  # Default 1 oră
        expiry_date = timezone.now() + timedelta(seconds=expires_in)

        if not refresh_token:
            logger.warning('⚠️ No refresh token received - user may have already authorized')

        logger.info(f'✅ Tokens obtained (expires in {expires_in // 60} minutes)')

        # STEP 2: Obține user info (openid + name)
        logger.info('Step 2: Fetching user info...')
        headers = {'Authorization': f'Bearer {access_token}'}
        response = requests.get(GOOGLE_USERINFO_URL, headers=headers, timeout=10)
        response.raise_for_status()
        user_info = response.json()

        user_openid = user_info.get('sub')  # OpenID Connect ID
        name = user_info.get('name', 'Unknown')
        email = user_info.get('email', '')
        logger.info(f'✅ User info: {name} ({email}) (OpenID: {user_openid})')

        # STEP 3: Salvează în GA4Token
        logger.info('Step 3: Saving token to database...')
        scopes = ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/analytics.readonly']

        ga4_token, created = GA4Token.objects.update_or_create(
            user=user,
            defaults={
                'access_token': access_token,
                'refresh_token': refresh_token or '',  # Salvează empty string dacă nu există
                'scopes': scopes,
                'expiry_date': expiry_date,
                'user_openid': user_openid,
                'name': name,
            }
        )

        action = 'Created' if created else 'Updated'
        logger.info(f'✅ {action} GA4Token for {user.email}')
        logger.info('=' * 80)

        return {
            'success': True,
            'user_name': name,
            'user_openid': user_openid,
            'expires_at': expiry_date,
        }

    except requests.exceptions.RequestException as e:
        logger.error(f'❌ GA4 OAuth failed: {str(e)}')
        raise Exception(f'GA4 OAuth request failed: {str(e)}')
    except Exception as e:
        logger.error(f'❌ GA4 OAuth failed: {str(e)}')
        raise
