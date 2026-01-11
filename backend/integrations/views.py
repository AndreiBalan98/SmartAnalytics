from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from agencies.models import Agency
from .models import MetaIntegration, GoogleAdsIntegration, GA4Integration


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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def connect_meta(request):
    """
    Store Meta OAuth token for agency.
    Called after OAuth callback.
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

    access_token = request.data.get('access_token')
    if not access_token:
        return Response({
            'error': 'access_token is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Create or update Meta integration
    meta_integration, created = MetaIntegration.objects.update_or_create(
        agency=agency,
        defaults={
            'access_token': access_token,
            'business_name': request.data.get('business_name', ''),
            'business_id': request.data.get('business_id', ''),
        }
    )

    return Response({
        'message': 'Meta connected successfully',
        'created': created
    })


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

    # Get Meta integration
    try:
        meta_integration = MetaIntegration.objects.get(agency=agency)
    except MetaIntegration.DoesNotExist:
        return Response({
            'error': 'Meta not connected for this agency'
        }, status=status.HTTP_404_NOT_FOUND)

    # Fetch ad accounts from Meta API
    from api.services import meta_service
    from django.conf import settings

    if settings.MOCK_META:
        # Return mock data
        return Response({
            'data': [
                {
                    'id': 'act_123456789',
                    'name': 'Mock Ad Account 1',
                    'currency': 'USD'
                },
                {
                    'id': 'act_987654321',
                    'name': 'Mock Ad Account 2',
                    'currency': 'EUR'
                },
                {
                    'id': 'act_555555555',
                    'name': 'Mock Ad Account 3',
                    'currency': 'RON'
                }
            ]
        })

    # Real API call
    try:
        # Temporarily set token for service
        import requests
        GRAPH_API_VERSION = 'v21.0'
        GRAPH_API_BASE = f'https://graph.facebook.com/{GRAPH_API_VERSION}'
        
        url = f'{GRAPH_API_BASE}/me/adaccounts'
        params = {
            'access_token': meta_integration.access_token,
            'fields': 'id,name,currency,account_status'
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        return Response({'data': data.get('data', [])})
    except Exception as e:
        return Response({
            'error': 'Failed to fetch ad accounts',
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)