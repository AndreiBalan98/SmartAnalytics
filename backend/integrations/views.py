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

    # Mock mode check
    if settings.MOCK_META:
        return Response({
            'data': [
                {
                    'id': 'act_123456789',
                    'name': 'Mock Ad Account 1',
                    'currency': 'USD',
                    'account_status': 1
                },
                {
                    'id': 'act_987654321',
                    'name': 'Mock Ad Account 2',
                    'currency': 'EUR',
                    'account_status': 1
                },
                {
                    'id': 'act_555555555',
                    'name': 'Mock Ad Account 3',
                    'currency': 'RON',
                    'account_status': 1
                }
            ]
        })

    # Real API call
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

    # Mock mode check
    if settings.MOCK_META:
        return Response({
            'account_id': account_id,
            'date_range': 'last_7_days',
            'metrics': {
                'spend': 1250.75,
                'impressions': 45678,
                'clicks': 1234,
                'purchases': 87,
                'revenue': 4350.25,
                'roas': 3.48
            }
        })

    # Real API call
    try:
        insights = meta_service.get_insights(agency, account_id)
        return Response(insights)
    except Exception as e:
        return Response({
            'error': 'Failed to fetch insights',
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)