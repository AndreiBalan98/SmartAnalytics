"""
Meta API Testing Views
Development-only endpoints for testing Meta API calls
"""

import requests
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from agencies.models import Agency
from .models import MetaIntegration

logger = logging.getLogger(__name__)

GRAPH_API_VERSION = 'v21.0'
GRAPH_API_BASE = f'https://graph.facebook.com/{GRAPH_API_VERSION}'


def make_meta_request(url, access_token, params=None):
    """
    Helper function to make Meta API requests and capture request/response details
    """
    full_params = {'access_token': access_token}
    if params:
        full_params.update(params)

    request_info = {
        'method': 'GET',
        'url': url,
        'params': {k: v for k, v in full_params.items() if k != 'access_token'},  # Hide token
    }

    try:
        response = requests.get(url, params=full_params)
        response_info = {
            'status_code': response.status_code,
            'headers': dict(response.headers),
            'data': response.json() if response.status_code == 200 else {'error': response.text}
        }

        return {
            'request': request_info,
            'response': response_info,
            'success': response.status_code == 200
        }
    except Exception as e:
        return {
            'request': request_info,
            'response': {
                'error': str(e)
            },
            'success': False
        }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_oauth_users(request):
    """
    Get all Meta OAuth connected users (agencies)
    """
    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)

    # Get all Meta integrations
    integrations = MetaIntegration.objects.select_related('agency', 'agency__owner').all()

    users = []
    for integration in integrations:
        users.append({
            'id': integration.id,
            'agency_id': integration.agency.id,
            'agency_name': integration.agency.name,
            'business_id': integration.business_id,
            'business_name': integration.business_name,
            'created_at': integration.created_at,
            'expires_at': integration.expires_at,
            'last_synced_at': integration.last_synced_at,
        })

    return Response({
        'success': True,
        'users': users
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_user_info(request):
    """
    Get user info from Meta API
    """
    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)

    integration_id = request.data.get('integration_id')
    if not integration_id:
        return Response({
            'error': 'integration_id is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        integration = MetaIntegration.objects.get(id=integration_id)
    except MetaIntegration.DoesNotExist:
        return Response({
            'error': 'Integration not found'
        }, status=status.HTTP_404_NOT_FOUND)

    url = f'{GRAPH_API_BASE}/me'
    result = make_meta_request(url, integration.access_token, {'fields': 'id,name,email'})

    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_businesses(request):
    """
    Get businesses from Meta API
    """
    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)

    integration_id = request.data.get('integration_id')
    if not integration_id:
        return Response({
            'error': 'integration_id is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        integration = MetaIntegration.objects.get(id=integration_id)
    except MetaIntegration.DoesNotExist:
        return Response({
            'error': 'Integration not found'
        }, status=status.HTTP_404_NOT_FOUND)

    url = f'{GRAPH_API_BASE}/me/businesses'
    result = make_meta_request(url, integration.access_token, {'fields': 'id,name,verification_status'})

    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_ad_accounts(request):
    """
    Get ad accounts from Meta API
    """
    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)

    integration_id = request.data.get('integration_id')
    if not integration_id:
        return Response({
            'error': 'integration_id is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        integration = MetaIntegration.objects.get(id=integration_id)
    except MetaIntegration.DoesNotExist:
        return Response({
            'error': 'Integration not found'
        }, status=status.HTTP_404_NOT_FOUND)

    url = f'{GRAPH_API_BASE}/me/adaccounts'
    result = make_meta_request(url, integration.access_token, {
        'fields': 'id,name,account_id,currency,account_status,business_name,timezone_name'
    })

    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_campaigns(request):
    """
    Get campaigns for a specific ad account
    """
    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)

    integration_id = request.data.get('integration_id')
    ad_account_id = request.data.get('ad_account_id')

    if not integration_id or not ad_account_id:
        return Response({
            'error': 'integration_id and ad_account_id are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        integration = MetaIntegration.objects.get(id=integration_id)
    except MetaIntegration.DoesNotExist:
        return Response({
            'error': 'Integration not found'
        }, status=status.HTTP_404_NOT_FOUND)

    url = f'{GRAPH_API_BASE}/{ad_account_id}/campaigns'
    result = make_meta_request(url, integration.access_token, {
        'fields': 'id,name,status,objective,created_time,updated_time,daily_budget,lifetime_budget'
    })

    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_ad_sets(request):
    """
    Get ad sets for a specific campaign
    """
    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)

    integration_id = request.data.get('integration_id')
    campaign_id = request.data.get('campaign_id')

    if not integration_id or not campaign_id:
        return Response({
            'error': 'integration_id and campaign_id are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        integration = MetaIntegration.objects.get(id=integration_id)
    except MetaIntegration.DoesNotExist:
        return Response({
            'error': 'Integration not found'
        }, status=status.HTTP_404_NOT_FOUND)

    url = f'{GRAPH_API_BASE}/{campaign_id}/adsets'
    result = make_meta_request(url, integration.access_token, {
        'fields': 'id,name,status,daily_budget,lifetime_budget,bid_amount,targeting,created_time,updated_time'
    })

    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_ads(request):
    """
    Get ads for a specific ad set
    """
    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)

    integration_id = request.data.get('integration_id')
    ad_set_id = request.data.get('ad_set_id')

    if not integration_id or not ad_set_id:
        return Response({
            'error': 'integration_id and ad_set_id are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        integration = MetaIntegration.objects.get(id=integration_id)
    except MetaIntegration.DoesNotExist:
        return Response({
            'error': 'Integration not found'
        }, status=status.HTTP_404_NOT_FOUND)

    url = f'{GRAPH_API_BASE}/{ad_set_id}/ads'
    result = make_meta_request(url, integration.access_token, {
        'fields': 'id,name,status,creative,created_time,updated_time'
    })

    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_creatives(request):
    """
    Get creative details
    """
    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)

    integration_id = request.data.get('integration_id')
    creative_id = request.data.get('creative_id')

    if not integration_id or not creative_id:
        return Response({
            'error': 'integration_id and creative_id are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        integration = MetaIntegration.objects.get(id=integration_id)
    except MetaIntegration.DoesNotExist:
        return Response({
            'error': 'Integration not found'
        }, status=status.HTTP_404_NOT_FOUND)

    url = f'{GRAPH_API_BASE}/{creative_id}'
    result = make_meta_request(url, integration.access_token, {
        'fields': 'id,name,title,body,image_url,video_id,thumbnail_url,object_story_spec'
    })

    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_insights(request):
    """
    Get insights/metrics for an ad account, campaign, ad set, or ad
    """
    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)

    integration_id = request.data.get('integration_id')
    object_id = request.data.get('object_id')  # Can be ad account, campaign, ad set, or ad
    start_date = request.data.get('start_date')  # YYYY-MM-DD
    end_date = request.data.get('end_date')      # YYYY-MM-DD

    if not integration_id or not object_id:
        return Response({
            'error': 'integration_id and object_id are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        integration = MetaIntegration.objects.get(id=integration_id)
    except MetaIntegration.DoesNotExist:
        return Response({
            'error': 'Integration not found'
        }, status=status.HTTP_404_NOT_FOUND)

    url = f'{GRAPH_API_BASE}/{object_id}/insights'

    params = {
        'fields': 'spend,impressions,clicks,conversions,ctr,cpc,cpm,reach,frequency',
        'level': 'account',
        'time_increment': 1,  # Daily breakdown
    }

    if start_date and end_date:
        params['time_range'] = f'{{"since":"{start_date}","until":"{end_date}"}}'

    result = make_meta_request(url, integration.access_token, params)

    return Response(result)
