from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from agencies.models import Agency
from .models import MetaIntegration, GoogleAdsIntegration, GA4Integration
from .services import meta_service


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_integrations_status(request):
    """
    Get all platform integration statuses for the current agency.
    """

    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can access integrations'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        agency = Agency.objects.get(owner=request.user)
    except Agency.DoesNotExist:
        return Response({
            'error': 'No agency found for this user'
        }, status=status.HTTP_404_NOT_FOUND)

    # Check Meta integration
    meta_integration = MetaIntegration.objects.filter(agency=agency).first()
    meta_status = {
        'connected': meta_integration is not None,
        'business_name': meta_integration.business_name if meta_integration else None,
        'last_refreshed': meta_integration.last_refreshed_at if meta_integration else None,
        'expires_at': meta_integration.expires_at if meta_integration else None,
    }

    # Check Google Ads integration
    google_ads_integration = GoogleAdsIntegration.objects.filter(agency=agency).first()
    google_ads_status = {
        'connected': google_ads_integration is not None,
        'customer_id': google_ads_integration.customer_id if google_ads_integration else None,
        'account_email': google_ads_integration.account_email if google_ads_integration else None,
    }

    # Check GA4 integration
    ga4_integration = GA4Integration.objects.filter(agency=agency).first()
    ga4_status = {
        'connected': ga4_integration is not None,
        'property_name': ga4_integration.property_name if ga4_integration else None,
    }

    return Response({
        'agency_id': agency.id,
        'integrations': {
            'meta': meta_status,
            'google_ads': google_ads_status,
            'ga4': ga4_status,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def start_meta_oauth(request):
    """
    Start Meta OAuth flow.
    Redirects to Meta OAuth URL.
    """
    from django.shortcuts import redirect
    from urllib.parse import urlencode

    if request.user.user_type != 'agency':
        return redirect('/agency/dashboard?error=Only+agency+users+can+connect+Meta')

    try:
        agency = Agency.objects.get(owner=request.user)
    except Agency.DoesNotExist:
        return redirect('/agency/dashboard?error=No+agency+found')

    # OAuth flow
    redirect_uri = request.build_absolute_uri('/agency/meta-callback')

    params = {
        'client_id': settings.META_APP_ID,
        'redirect_uri': redirect_uri,
        'scope': 'ads_management,ads_read',
        'response_type': 'code',
    }

    oauth_url = f'https://www.facebook.com/v21.0/dialog/oauth?{urlencode(params)}'
    return redirect(oauth_url)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def exchange_meta_code(request):
    """
    Exchange Meta OAuth code for access token.
    Called from frontend OAuth callback.
    """

    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can connect platforms'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        agency = Agency.objects.get(owner=request.user)
    except Agency.DoesNotExist:
        return Response({
            'error': 'No agency found for this user'
        }, status=status.HTTP_404_NOT_FOUND)

    code = request.data.get('code')
    redirect_uri = request.data.get('redirect_uri')

    if not code or not redirect_uri:
        return Response({
            'error': 'code and redirect_uri are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # OAuth flow
    try:
        result = meta_service.exchange_code_for_token(code, redirect_uri, agency)
        return Response({
            'success': True,
            'message': 'Meta connected successfully',
            'business_name': result.get('business_name'),
        })
    except Exception as e:
        return Response({
            'error': 'Failed to connect Meta',
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def exchange_google_ads_code(request):
    """
    Exchange Google Ads OAuth code for access + refresh tokens.
    Called from frontend OAuth callback.
    """
    import requests as http_requests
    from django.utils import timezone
    from datetime import timedelta

    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can connect platforms'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        agency = Agency.objects.get(owner=request.user)
    except Agency.DoesNotExist:
        return Response({
            'error': 'No agency found for this user'
        }, status=status.HTTP_404_NOT_FOUND)

    code = request.data.get('code')
    redirect_uri = request.data.get('redirect_uri')

    if not code or not redirect_uri:
        return Response({
            'error': 'code and redirect_uri are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Exchange authorization code for tokens
        token_response = http_requests.post(
            'https://oauth2.googleapis.com/token',
            data={
                'code': code,
                'client_id': settings.GOOGLE_CLIENT_ID,
                'client_secret': settings.GOOGLE_CLIENT_SECRET,
                'redirect_uri': redirect_uri,
                'grant_type': 'authorization_code',
            }
        )

        if token_response.status_code != 200:
            raise Exception(f'Token exchange failed: {token_response.text}')

        token_data = token_response.json()

        if 'access_token' not in token_data:
            raise Exception('No access_token in token response')

        # Fetch account email via userinfo endpoint
        account_email = ''
        userinfo_response = http_requests.get(
            'https://oauth2.googleapis.com/userinfo',
            headers={'Authorization': f'Bearer {token_data["access_token"]}'}
        )
        if userinfo_response.status_code == 200:
            account_email = userinfo_response.json().get('email', '')

        # Calculate token expiry
        expires_at = timezone.now() + timedelta(seconds=token_data.get('expires_in', 3600))

        # Save or update integration
        GoogleAdsIntegration.objects.update_or_create(
            agency=agency,
            defaults={
                'access_token': token_data['access_token'],
                'refresh_token': token_data.get('refresh_token', ''),
                'token_type': token_data.get('token_type', 'Bearer'),
                'expires_at': expires_at,
                'account_email': account_email,
            }
        )

        return Response({
            'success': True,
            'message': 'Google Ads connected successfully',
            'account_email': account_email,
        })

    except Exception as e:
        return Response({
            'error': 'Failed to connect Google Ads',
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_meta_ad_accounts(request):
    """
    Get ad accounts from Meta for the current agency.
    """

    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can access ad accounts'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        agency = Agency.objects.get(owner=request.user)
    except Agency.DoesNotExist:
        return Response({
            'error': 'No agency found for this user'
        }, status=status.HTTP_404_NOT_FOUND)

    # Check if Meta is connected
    if not MetaIntegration.objects.filter(agency=agency).exists():
        return Response({
            'error': 'Meta not connected for this agency'
        }, status=status.HTTP_404_NOT_FOUND)

    # API call
    try:
        accounts = meta_service.get_ad_accounts(agency)
        return Response({'data': accounts})
    except Exception as e:
        return Response({
            'error': 'Failed to fetch ad accounts',
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_meta_insights(request):
    """
    Get insights for a specific ad account.
    """

    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can access insights'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        agency = Agency.objects.get(owner=request.user)
    except Agency.DoesNotExist:
        return Response({
            'error': 'No agency found for this user'
        }, status=status.HTTP_404_NOT_FOUND)

    account_id = request.GET.get('account_id')
    if not account_id:
        return Response({
            'error': 'account_id is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # API call
    try:
        insights = meta_service.get_insights(agency, account_id)
        return Response(insights)
    except Exception as e:
        return Response({
            'error': 'Failed to fetch insights',
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_meta_data(request):
    """
    Sync all Meta data (campaigns, ad sets, ads, metrics) for the agency.
    Rate limited to 1 sync per minute.
    """
    from django.utils import timezone
    from datetime import timedelta

    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can sync data'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        agency = Agency.objects.get(owner=request.user)
    except Agency.DoesNotExist:
        return Response({
            'error': 'No agency found for this user'
        }, status=status.HTTP_404_NOT_FOUND)

    # Check if Meta is connected
    try:
        integration = MetaIntegration.objects.get(agency=agency)
    except MetaIntegration.DoesNotExist:
        return Response({
            'error': 'Meta not connected for this agency'
        }, status=status.HTTP_404_NOT_FOUND)

    # Rate limiting: max 1 sync per minute
    if integration.last_synced_at:
        time_since_last_sync = timezone.now() - integration.last_synced_at
        if time_since_last_sync < timedelta(minutes=1):
            seconds_remaining = 60 - time_since_last_sync.total_seconds()
            return Response({
                'error': 'Rate limit exceeded',
                'message': f'Please wait {int(seconds_remaining)} seconds before syncing again',
                'retry_after': int(seconds_remaining)
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

    # Sync
    try:
        # Get days parameter (default 30)
        days = int(request.data.get('days', 30))
        if days < 1 or days > 90:
            days = 30

        # Update last_synced_at before starting (for rate limiting)
        integration.last_synced_at = timezone.now()
        integration.save()

        # Run sync
        result = meta_service.sync_all_data(agency, days=days)

        return Response({
            'success': result['success'],
            'message': 'Sync completed successfully' if result['success'] else 'Sync completed with errors',
            'ad_accounts_synced': result['ad_accounts_synced'],
            'ad_accounts': result.get('ad_accounts', []),
            'campaigns': result['campaigns'],
            'ad_sets': result['ad_sets'],
            'ads': result['ads'],
            'metrics': result['metrics'],
            'errors': result['errors']
        })

    except Exception as e:
        return Response({
            'error': 'Sync failed',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)