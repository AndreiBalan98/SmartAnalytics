"""API views for Meta Ads sync and client dashboard"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status as http_status
from datetime import date, timedelta
from django.db.models import Sum, Avg, Q

from integrations.models import MetaIntegration
from agencies.models import AgencyUser
from .models import (
    AdAccount,
    Campaign,
    AdSet,
    Ad,
    AdCreative,
    Insight,
    SyncState,
)
from .serializers import (
    AdAccountSerializer,
    CampaignSerializer,
    AdSetSerializer,
    AdSerializer,
    AdCreativeSerializer,
    InsightSerializer,
    SyncStateSerializer,
)
from .services import MetaSyncService


# ===== AGENCY SYNC ENDPOINTS =====

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sync_status(request):
    """Get sync status for agency"""
    # Get agency
    agency = request.user.owned_agencies.first()
    if not agency:
        return Response(
            {'error': 'User is not an agency owner'},
            status=http_status.HTTP_403_FORBIDDEN
        )

    # Get all sync states for this agency
    sync_states = SyncState.objects.filter(agency=agency).order_by('-updated_at')

    # Check if sync is currently running
    running_syncs = sync_states.filter(status='running')
    can_sync = not running_syncs.exists()

    return Response({
        'sync_states': SyncStateSerializer(sync_states, many=True).data,
        'can_sync': can_sync,
        'running_syncs': running_syncs.count(),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_structural_sync(request):
    """Trigger structural sync (user, businesses, ad accounts, campaigns, adsets, ads, creatives)"""
    # Get agency
    agency = request.user.owned_agencies.first()
    if not agency:
        return Response(
            {'error': 'User is not an agency owner'},
            status=http_status.HTTP_403_FORBIDDEN
        )

    # Get Meta integration
    try:
        integration = MetaIntegration.objects.get(agency=agency)
    except MetaIntegration.DoesNotExist:
        return Response(
            {'error': 'Meta integration not found. Please connect Meta first.'},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    # Create sync service
    service = MetaSyncService(agency, integration.access_token)

    try:
        # Check rate limit
        service.check_rate_limit()

        # Trigger sync
        result = service.sync_structural_data()

        return Response({
            'status': 'success',
            'message': 'Structural data synced successfully',
            'result': result,
        })

    except Exception as e:
        service.release_rate_limit()
        return Response(
            {'status': 'error', 'message': str(e)},
            status=http_status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_insights_sync(request):
    """Trigger insights sync for selected ad accounts"""
    # Get agency
    agency = request.user.owned_agencies.first()
    if not agency:
        return Response(
            {'error': 'User is not an agency owner'},
            status=http_status.HTTP_403_FORBIDDEN
        )

    # Get Meta integration
    try:
        integration = MetaIntegration.objects.get(agency=agency)
    except MetaIntegration.DoesNotExist:
        return Response(
            {'error': 'Meta integration not found'},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    # Get parameters
    ad_account_ids = request.data.get('ad_account_ids', [])
    start_date = request.data.get('start_date')
    end_date = request.data.get('end_date')

    # Default date range if not provided
    if not start_date:
        start_date = (date.today() - timedelta(days=30)).isoformat()
    if not end_date:
        end_date = date.today().isoformat()

    if not ad_account_ids:
        return Response(
            {'error': 'No ad accounts selected'},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    # Create sync service
    service = MetaSyncService(agency, integration.access_token)

    try:
        # Check rate limit
        service.check_rate_limit()

        # Trigger insights sync
        result = service.sync_insights(ad_account_ids, start_date, end_date)

        return Response({
            'status': 'success',
            'message': f'Insights synced for {len(ad_account_ids)} account(s)',
            'result': result,
        })

    except Exception as e:
        service.release_rate_limit()
        return Response(
            {'status': 'error', 'message': str(e)},
            status=http_status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_ad_accounts(request):
    """Get all ad accounts available to agency (for selection in insights sync)"""
    # Get agency
    agency = request.user.owned_agencies.first()
    if not agency:
        return Response(
            {'error': 'User is not an agency owner'},
            status=http_status.HTTP_403_FORBIDDEN
        )

    # Get all ad accounts agency has access to
    accounts = AdAccount.objects.filter(
        agency_accesses__agency=agency
    ).order_by('name')

    return Response({
        'ad_accounts': AdAccountSerializer(accounts, many=True).data
    })


# ===== CLIENT DASHBOARD ENDPOINTS =====

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_ad_accounts(request):
    """Get ad accounts client has permission to view"""
    user = request.user

    # Check if user is a client
    if user.user_type != 'client':
        return Response(
            {'error': 'User is not a client'},
            status=http_status.HTTP_403_FORBIDDEN
        )

    # Get agency membership
    try:
        agency_user = AgencyUser.objects.get(user=user)
    except AgencyUser.DoesNotExist:
        return Response(
            {'error': 'User is not associated with any agency'},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    # Get allowed ad accounts from permissions
    allowed_accounts = agency_user.permissions.get('meta_accounts', [])

    if not allowed_accounts:
        return Response({'ad_accounts': []})

    # Get ad account objects
    accounts = AdAccount.objects.filter(id__in=allowed_accounts).order_by('name')

    return Response({
        'ad_accounts': AdAccountSerializer(accounts, many=True).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_campaigns(request):
    """Get campaigns for client (filtered by permissions)"""
    user = request.user
    account_id = request.query_params.get('account_id')

    if not account_id:
        return Response(
            {'error': 'account_id parameter required'},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    # Verify permission
    if not _has_account_permission(user, account_id):
        return Response(
            {'error': 'Permission denied'},
            status=http_status.HTTP_403_FORBIDDEN
        )

    # Get campaigns
    campaigns = Campaign.objects.filter(ad_account_id=account_id).order_by('name')

    return Response({
        'campaigns': CampaignSerializer(campaigns, many=True).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_adsets(request):
    """Get ad sets for client (filtered by permissions)"""
    user = request.user
    campaign_id = request.query_params.get('campaign_id')

    if not campaign_id:
        return Response(
            {'error': 'campaign_id parameter required'},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    # Get campaign and verify permission
    try:
        campaign = Campaign.objects.get(id=campaign_id)
        if not _has_account_permission(user, campaign.ad_account_id):
            return Response(
                {'error': 'Permission denied'},
                status=http_status.HTTP_403_FORBIDDEN
            )
    except Campaign.DoesNotExist:
        return Response(
            {'error': 'Campaign not found'},
            status=http_status.HTTP_404_NOT_FOUND
        )

    # Get ad sets
    adsets = AdSet.objects.filter(campaign_id=campaign_id).order_by('name')

    return Response({
        'adsets': AdSetSerializer(adsets, many=True).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_ads(request):
    """Get ads for client (filtered by permissions)"""
    user = request.user
    adset_id = request.query_params.get('adset_id')

    if not adset_id:
        return Response(
            {'error': 'adset_id parameter required'},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    # Get adset and verify permission
    try:
        adset = AdSet.objects.get(id=adset_id)
        if not _has_account_permission(user, adset.ad_account_id):
            return Response(
                {'error': 'Permission denied'},
                status=http_status.HTTP_403_FORBIDDEN
            )
    except AdSet.DoesNotExist:
        return Response(
            {'error': 'Ad set not found'},
            status=http_status.HTTP_404_NOT_FOUND
        )

    # Get ads
    ads = Ad.objects.filter(adset_id=adset_id).order_by('name')

    return Response({
        'ads': AdSerializer(ads, many=True).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_creatives(request):
    """Get creatives for client (filtered by permissions)"""
    user = request.user
    account_id = request.query_params.get('account_id')

    if not account_id:
        return Response(
            {'error': 'account_id parameter required'},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    # Verify permission
    if not _has_account_permission(user, account_id):
        return Response(
            {'error': 'Permission denied'},
            status=http_status.HTTP_403_FORBIDDEN
        )

    # Get creatives
    creatives = AdCreative.objects.filter(ad_account_id=account_id).order_by('-created_at')

    return Response({
        'creatives': AdCreativeSerializer(creatives, many=True).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_insights(request):
    """Get insights for client (filtered by permissions)"""
    user = request.user
    account_id = request.query_params.get('account_id')
    level = request.query_params.get('level', 'account')
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    if not account_id:
        return Response(
            {'error': 'account_id parameter required'},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    # Verify permission
    if not _has_account_permission(user, account_id):
        return Response(
            {'error': 'Permission denied'},
            status=http_status.HTTP_403_FORBIDDEN
        )

    # Default date range
    if not end_date:
        end_date = date.today()
    else:
        end_date = date.fromisoformat(end_date)

    if not start_date:
        start_date = end_date - timedelta(days=30)
    else:
        start_date = date.fromisoformat(start_date)

    # Get insights
    insights = Insight.objects.filter(
        ad_account_id=account_id,
        level=level,
        date_start__gte=start_date,
        date_stop__lte=end_date
    ).order_by('-date_start')

    return Response({
        'insights': InsightSerializer(insights, many=True).data
    })


# ===== HELPER FUNCTIONS =====

def _has_account_permission(user, account_id):
    """Check if user has permission to access account"""
    if user.user_type != 'client':
        return False

    try:
        agency_user = AgencyUser.objects.get(user=user)
        allowed_accounts = agency_user.permissions.get('meta_accounts', [])
        return account_id in allowed_accounts
    except AgencyUser.DoesNotExist:
        return False
