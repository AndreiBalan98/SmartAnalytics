import logging
from django.conf import settings
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from oauth.models import MetaToken, GoogleToken, GA4Token
from oauth.services.meta_oauth import generate_meta_oauth_url, meta_exchange_code, verify_state
from oauth.services.google_oauth import generate_google_oauth_url, google_exchange_code
from oauth.services.ga4_oauth import generate_ga4_oauth_url, ga4_exchange_code

logger = logging.getLogger('oauth')

FRONTEND_URL = settings.FRONTEND_URL or 'http://localhost:3000'


def _oauth_callback_html(success_type, error_type, **kwargs):
    """Generate HTML that posts message to parent window."""
    if 'error' in kwargs:
        msg_data = f"type: '{error_type}', error: '{kwargs['error']}'"
    else:
        parts = [f"type: '{success_type}'"]
        if 'userName' in kwargs:
            parts.append(f"userName: '{kwargs['userName']}'")
        if 'userId' in kwargs:
            parts.append(f"userId: '{kwargs['userId']}'")
        if 'userOpenId' in kwargs:
            parts.append(f"userOpenId: '{kwargs['userOpenId']}'")
        msg_data = ', '.join(parts)

    html = f"""
    <html><body><script>
    window.opener.postMessage({{{msg_data}}}, '*');
    window.close();
    </script><p>Authentication complete. This window will close automatically.</p></body></html>
    """
    return HttpResponse(html, content_type='text/html')


# ========== META ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def oauth_meta_start(request):
    redirect_uri = request.build_absolute_uri('/api/oauth/meta/callback/')
    result = generate_meta_oauth_url(request.user, redirect_uri)
    return Response({'success': True, 'url': result['url']})


@api_view(['GET'])
@permission_classes([AllowAny])
def oauth_meta_callback(request):
    code = request.GET.get('code')
    state = request.GET.get('state')
    error = request.GET.get('error')

    if error:
        return _oauth_callback_html('', 'META_OAUTH_ERROR', error=error)

    if not code or not state:
        return _oauth_callback_html('', 'META_OAUTH_ERROR', error='Missing code or state')

    user = verify_state(state, 'meta')
    if not user:
        return _oauth_callback_html('', 'META_OAUTH_ERROR', error='Invalid or expired state')

    try:
        redirect_uri = request.build_absolute_uri('/api/oauth/meta/callback/')
        result = meta_exchange_code(code, redirect_uri, user)
        return _oauth_callback_html(
            'META_OAUTH_SUCCESS', 'META_OAUTH_ERROR',
            userName=result['user_name'],
            userId=result['meta_user_id'],
        )
    except Exception as e:
        logger.error(f'Meta OAuth callback failed: {e}')
        return _oauth_callback_html('', 'META_OAUTH_ERROR', error=str(e))


# ========== GOOGLE ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def oauth_google_start(request):
    redirect_uri = request.build_absolute_uri('/api/oauth/google/callback/')
    result = generate_google_oauth_url(request.user, redirect_uri)
    return Response({'success': True, 'url': result['url']})


@api_view(['GET'])
@permission_classes([AllowAny])
def oauth_google_callback(request):
    code = request.GET.get('code')
    state = request.GET.get('state')
    error = request.GET.get('error')

    if error:
        return _oauth_callback_html('', 'GOOGLE_ADS_OAUTH_ERROR', error=error)

    if not code or not state:
        return _oauth_callback_html('', 'GOOGLE_ADS_OAUTH_ERROR', error='Missing code or state')

    user = verify_state(state, 'google')
    if not user:
        return _oauth_callback_html('', 'GOOGLE_ADS_OAUTH_ERROR', error='Invalid or expired state')

    try:
        redirect_uri = request.build_absolute_uri('/api/oauth/google/callback/')
        result = google_exchange_code(code, redirect_uri, user)
        return _oauth_callback_html(
            'GOOGLE_ADS_OAUTH_SUCCESS', 'GOOGLE_ADS_OAUTH_ERROR',
            userName=result['user_name'],
            userOpenId=result['user_openid'],
        )
    except Exception as e:
        logger.error(f'Google OAuth callback failed: {e}')
        return _oauth_callback_html('', 'GOOGLE_ADS_OAUTH_ERROR', error=str(e))


# ========== GA4 ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def oauth_ga4_start(request):
    redirect_uri = request.build_absolute_uri('/api/oauth/ga4/callback/')
    result = generate_ga4_oauth_url(request.user, redirect_uri)
    return Response({'success': True, 'url': result['url']})


@api_view(['GET'])
@permission_classes([AllowAny])
def oauth_ga4_callback(request):
    code = request.GET.get('code')
    state = request.GET.get('state')
    error = request.GET.get('error')

    if error:
        return _oauth_callback_html('', 'GA4_OAUTH_ERROR', error=error)

    if not code or not state:
        return _oauth_callback_html('', 'GA4_OAUTH_ERROR', error='Missing code or state')

    user = verify_state(state, 'ga4')
    if not user:
        return _oauth_callback_html('', 'GA4_OAUTH_ERROR', error='Invalid or expired state')

    try:
        redirect_uri = request.build_absolute_uri('/api/oauth/ga4/callback/')
        result = ga4_exchange_code(code, redirect_uri, user)
        return _oauth_callback_html(
            'GA4_OAUTH_SUCCESS', 'GA4_OAUTH_ERROR',
            userName=result['user_name'],
            userOpenId=result['user_openid'],
        )
    except Exception as e:
        logger.error(f'GA4 OAuth callback failed: {e}')
        return _oauth_callback_html('', 'GA4_OAUTH_ERROR', error=str(e))


# ========== STATUS ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_oauth_status(request):
    user = request.user
    now = __import__('django.utils.timezone', fromlist=['now']).now()

    # Meta
    meta_status = {'connected': False}
    try:
        token = MetaToken.objects.get(user=user)
        meta_status = {
            'connected': True,
            'name': token.name,
            'meta_user_id': token.meta_user_id,
            'expires_at': token.expiry_date.isoformat(),
            'is_expired': token.expiry_date < now,
        }
    except MetaToken.DoesNotExist:
        pass

    # Google
    google_status = {'connected': False}
    try:
        token = GoogleToken.objects.get(user=user)
        google_status = {
            'connected': True,
            'name': token.name,
            'user_openid': token.google_user_id,
            'expires_at': token.expires_at.isoformat(),
            'is_expired': token.expires_at < now,
        }
    except GoogleToken.DoesNotExist:
        pass

    # GA4
    ga4_status = {'connected': False}
    try:
        token = GA4Token.objects.get(user=user)
        ga4_status = {
            'connected': True,
            'name': token.name,
            'user_openid': token.google_user_id,
            'expires_at': token.expires_at.isoformat(),
            'is_expired': token.expires_at < now,
        }
    except GA4Token.DoesNotExist:
        pass

    return Response({
        'user_id': user.id,
        'user_email': user.email,
        'oauth_connections': {
            'meta': meta_status,
            'google_ads': google_status,
            'ga4': ga4_status,
        },
    })
