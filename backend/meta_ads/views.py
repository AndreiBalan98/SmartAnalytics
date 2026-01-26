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

        # STEP 1: Sync structural data for selected accounts FIRST
        # This ensures campaigns/adsets/ads/creatives are up-to-date before insights
        structural_result = service.sync_structural_for_accounts(ad_account_ids)

        # STEP 2: Sync insights
        insights_result = service.sync_insights(ad_account_ids, start_date, end_date)

        return Response({
            'status': 'success',
            'message': f'Structural + Insights synced for {len(ad_account_ids)} account(s)',
            'structural': structural_result,
            'insights': insights_result,
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
    campaign_ids = request.query_params.getlist('campaign_ids')

    if not campaign_ids:
        return Response(
            {'error': 'campaign_ids parameter required'},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    # Verify permissions for all campaigns
    campaigns = Campaign.objects.filter(id__in=campaign_ids)
    if campaigns.count() != len(campaign_ids):
        return Response(
            {'error': 'One or more campaigns not found'},
            status=http_status.HTTP_404_NOT_FOUND
        )

    # Check permissions for each campaign's ad account
    for campaign in campaigns:
        if not _has_account_permission(user, campaign.ad_account_id):
            return Response(
                {'error': 'Permission denied'},
                status=http_status.HTTP_403_FORBIDDEN
            )

    # Get ad sets for all campaigns
    adsets = AdSet.objects.filter(campaign_id__in=campaign_ids).order_by('name')

    return Response({
        'adsets': AdSetSerializer(adsets, many=True).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_ads(request):
    """Get ads for client (filtered by permissions)"""
    user = request.user
    adset_ids = request.query_params.getlist('adset_ids')

    if not adset_ids:
        return Response(
            {'error': 'adset_ids parameter required'},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    # Verify permissions for all ad sets
    adsets = AdSet.objects.filter(id__in=adset_ids)
    if adsets.count() != len(adset_ids):
        return Response(
            {'error': 'One or more ad sets not found'},
            status=http_status.HTTP_404_NOT_FOUND
        )

    # Check permissions for each ad set's ad account
    for adset in adsets:
        if not _has_account_permission(user, adset.ad_account_id):
            return Response(
                {'error': 'Permission denied'},
                status=http_status.HTTP_403_FORBIDDEN
            )

    # Get ads for all ad sets
    ads = Ad.objects.filter(adset_id__in=adset_ids).order_by('name')

    return Response({
        'ads': AdSerializer(ads, many=True).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_creatives(request):
    """Get creatives for client (filtered by permissions)"""
    user = request.user
    ad_ids = request.query_params.getlist('ad_ids')

    if not ad_ids:
        return Response(
            {'error': 'ad_ids parameter required'},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    # Verify permissions for all ads
    ads = Ad.objects.filter(id__in=ad_ids)
    if ads.count() != len(ad_ids):
        return Response(
            {'error': 'One or more ads not found'},
            status=http_status.HTTP_404_NOT_FOUND
        )

    # Check permissions for each ad's ad account
    for ad in ads:
        if not _has_account_permission(user, ad.ad_account_id):
            return Response(
                {'error': 'Permission denied'},
                status=http_status.HTTP_403_FORBIDDEN
            )

    # Get creative IDs from ads (filter out empty/null creative_ids)
    creative_ids = [ad.creative_id for ad in ads if ad.creative_id]

    # Get unique creatives (avoid duplicates if multiple ads use same creative)
    creatives = AdCreative.objects.filter(id__in=creative_ids).distinct().order_by('-created_at')

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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def client_insights_aggregate(request):
    """
    Generate insights for multiple entities (accounts, campaigns, adsets, ads)
    Request body:
    {
        "entities": [
            {"id": "act_123", "type": "account", "name": "Account Name"},
            {"id": "123456", "type": "campaign", "name": "Campaign Name"},
            ...
        ],
        "start_date": "2024-01-01",
        "end_date": "2024-01-31"
    }
    """
    user = request.user

    if user.user_type != 'client':
        return Response(
            {'error': 'Only clients can access this endpoint'},
            status=http_status.HTTP_403_FORBIDDEN
        )

    entities = request.data.get('entities', [])
    start_date_str = request.data.get('start_date')
    end_date_str = request.data.get('end_date')

    if not entities:
        return Response(
            {'error': 'entities parameter required'},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    if not start_date_str or not end_date_str:
        return Response(
            {'error': 'start_date and end_date parameters required'},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    try:
        start_date = date.fromisoformat(start_date_str)
        end_date = date.fromisoformat(end_date_str)
    except ValueError:
        return Response(
            {'error': 'Invalid date format. Use YYYY-MM-DD'},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    # Verify permissions for all entities
    try:
        agency_user = AgencyUser.objects.get(user=user)
        allowed_accounts = agency_user.permissions.get('meta_accounts', [])
    except AgencyUser.DoesNotExist:
        return Response(
            {'error': 'User is not associated with an agency'},
            status=http_status.HTTP_403_FORBIDDEN
        )

    # Process each entity and aggregate insights
    entity_totals = []
    chart_data = {}  # {date: {entity_id_metric: value}}

    for entity in entities:
        entity_id = entity.get('id')
        entity_type = entity.get('type')
        entity_name = entity.get('name', entity_id)

        if not entity_id or not entity_type:
            continue

        # Map frontend type to database level
        level_map = {
            'account': 'account',
            'campaign': 'campaign',
            'adset': 'adset',
            'ad': 'ad'
        }
        level = level_map.get(entity_type)

        if not level:
            continue

        # Query insights for this entity
        insights = Insight.objects.filter(
            level=level,
            object_id=entity_id,
            date_start__gte=start_date,
            date_stop__lte=end_date
        )

        # Verify permission (check account access)
        if insights.exists():
            first_insight = insights.first()
            if first_insight.ad_account_id not in allowed_accounts:
                return Response(
                    {'error': f'Permission denied for entity {entity_id}'},
                    status=http_status.HTTP_403_FORBIDDEN
                )

        # Aggregate totals
        total_spend = 0
        total_impressions = 0
        total_clicks = 0
        total_reach = 0

        for insight in insights:
            metrics = insight.metrics or {}

            # Parse metrics (handle both string and numeric values)
            spend = float(metrics.get('spend', 0) or 0)
            impressions = int(float(metrics.get('impressions', 0) or 0))
            clicks = int(float(metrics.get('clicks', 0) or 0))
            reach = int(float(metrics.get('reach', 0) or 0))

            total_spend += spend
            total_impressions += impressions
            total_clicks += clicks
            total_reach += reach

            # Add to chart data
            date_key = str(insight.date_start)
            if date_key not in chart_data:
                chart_data[date_key] = {'date': date_key}

            chart_data[date_key][f'spend_{entity_id}'] = chart_data[date_key].get(f'spend_{entity_id}', 0) + spend
            chart_data[date_key][f'impressions_{entity_id}'] = chart_data[date_key].get(f'impressions_{entity_id}', 0) + impressions
            chart_data[date_key][f'clicks_{entity_id}'] = chart_data[date_key].get(f'clicks_{entity_id}', 0) + clicks
            chart_data[date_key][f'reach_{entity_id}'] = chart_data[date_key].get(f'reach_{entity_id}', 0) + reach

        # Calculate derived metrics
        ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
        cpc = (total_spend / total_clicks) if total_clicks > 0 else 0
        cpm = (total_spend / total_impressions * 1000) if total_impressions > 0 else 0

        # Add derived metrics to chart data
        for date_key in chart_data:
            if f'impressions_{entity_id}' in chart_data[date_key]:
                impr = chart_data[date_key][f'impressions_{entity_id}']
                clk = chart_data[date_key][f'clicks_{entity_id}']
                spnd = chart_data[date_key][f'spend_{entity_id}']

                chart_data[date_key][f'ctr_{entity_id}'] = (clk / impr * 100) if impr > 0 else 0
                chart_data[date_key][f'cpc_{entity_id}'] = (spnd / clk) if clk > 0 else 0
                chart_data[date_key][f'cpm_{entity_id}'] = (spnd / impr * 1000) if impr > 0 else 0

        entity_totals.append({
            'entityId': entity_id,
            'entityName': entity_name,
            'entityType': entity_type,
            'spend': total_spend,
            'impressions': total_impressions,
            'clicks': total_clicks,
            'reach': total_reach,
            'ctr': ctr,
            'cpc': cpc,
            'cpm': cpm,
        })

    # Sort and extract top performers
    top_spend = sorted(entity_totals, key=lambda x: x['spend'], reverse=True)[:5]
    top_impressions = sorted(entity_totals, key=lambda x: x['impressions'], reverse=True)[:5]
    top_clicks = sorted(entity_totals, key=lambda x: x['clicks'], reverse=True)[:5]
    top_reach = sorted(entity_totals, key=lambda x: x['reach'], reverse=True)[:5]
    top_ctr = sorted(entity_totals, key=lambda x: x['ctr'], reverse=True)[:5]
    top_cpc = sorted(entity_totals, key=lambda x: x['cpc'], reverse=True)[:5]
    top_cpm = sorted(entity_totals, key=lambda x: x['cpm'], reverse=True)[:5]

    # Format top performers
    def format_top(items, value_key):
        return [
            {
                'entityId': item['entityId'],
                'entityName': item['entityName'],
                'entityType': item['entityType'],
                'value': item[value_key]
            }
            for item in items
        ]

    # Convert chart_data dict to sorted list
    chart_data_list = sorted(chart_data.values(), key=lambda x: x['date'])

    return Response({
        'topPerformers': {
            'topSpend': format_top(top_spend, 'spend'),
            'topImpressions': format_top(top_impressions, 'impressions'),
            'topClicks': format_top(top_clicks, 'clicks'),
            'topReach': format_top(top_reach, 'reach'),
            'topCTR': format_top(top_ctr, 'ctr'),
            'topCPC': format_top(top_cpc, 'cpc'),
            'topCPM': format_top(top_cpm, 'cpm'),
        },
        'chartData': chart_data_list
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
