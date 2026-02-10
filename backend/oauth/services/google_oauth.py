import requests
import logging
from urllib.parse import urlencode
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from oauth.models import OAuthState, GoogleToken, GoogleUser
from oauth.services.meta_oauth import generate_state, verify_state

logger = logging.getLogger('oauth')

GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_USERINFO_URL = 'https://oauth2.googleapis.com/userinfo'


def generate_google_oauth_url(user, redirect_uri):
    state = generate_state(user, 'google')
    scopes = [
        'openid', 'email', 'profile',
        'https://www.googleapis.com/auth/adwords',
    ]
    params = {
        'client_id': settings.GOOGLE_CLIENT_ID,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': ' '.join(scopes),
        'access_type': 'offline',
        'prompt': 'consent',
        'state': state,
    }
    url = f"{GOOGLE_OAUTH_URL}?{urlencode(params)}"
    logger.info(f'Generated Google OAuth URL for {user.email}')
    return {'url': url, 'state': state}


def google_exchange_code(code, redirect_uri, user):
    logger.info(f'GOOGLE OAUTH: Starting token exchange for {user.email}')

    # Step 1: Exchange code for tokens
    logger.info('Step 1: Exchanging code for tokens...')
    response = requests.post(GOOGLE_TOKEN_URL, data={
        'code': code,
        'client_id': settings.GOOGLE_CLIENT_ID,
        'client_secret': settings.GOOGLE_CLIENT_SECRET,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code',
    }, timeout=10)
    response.raise_for_status()
    data = response.json()

    access_token = data.get('access_token')
    refresh_token = data.get('refresh_token', '')
    expires_in = data.get('expires_in', 3600)
    expiry_date = timezone.now() + timedelta(seconds=expires_in)
    logger.info(f'Tokens obtained (expires in {expires_in // 60} minutes)')

    # Step 2: Fetch user info
    logger.info('Step 2: Fetching user info...')
    response = requests.get(GOOGLE_USERINFO_URL, headers={
        'Authorization': f'Bearer {access_token}',
    }, timeout=10)
    response.raise_for_status()
    user_info = response.json()

    google_user_id = user_info.get('sub')
    name = user_info.get('name', 'Unknown')
    email = user_info.get('email', '')
    logger.info(f'User info: {name} ({email})')

    # Step 3: Save GoogleUser
    GoogleUser.objects.update_or_create(user=user, defaults={
        'google_user_id': google_user_id,
        'name': name,
        'email': email,
    })

    # Step 4: Save GoogleToken
    scopes = ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/adwords']
    GoogleToken.objects.update_or_create(user=user, defaults={
        'access_token': access_token,
        'refresh_token': refresh_token,
        'scopes': scopes,
        'expires_at': expiry_date,
        'google_user_id': google_user_id,
        'name': name,
    })
    logger.info(f'GoogleToken saved for {user.email}')

    return {
        'success': True,
        'user_name': name,
        'user_openid': google_user_id,
        'expires_at': expiry_date,
    }
