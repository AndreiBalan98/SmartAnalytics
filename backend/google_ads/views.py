import logging
import random
from datetime import datetime, timedelta, date
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from google_ads.models import GoogleAdsAccount, GoogleAdsCampaign, GoogleAdsAdGroup, GoogleAdsAd, GoogleAdsInsight
from users.models import ClientPermissions

logger = logging.getLogger('google_ads')


# ========== AGENCY ENDPOINTS ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_accounts(request):
    if request.user.user_type != 'agency':
        return Response({'error': 'Only agency users can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)

    # If no accounts in DB yet, try to fetch from API
    accounts = GoogleAdsAccount.objects.filter(user=request.user)
    if accounts.count() == 0:
        try:
            _fetch_and_store_accounts(request.user)
            accounts = GoogleAdsAccount.objects.filter(user=request.user)
        except Exception as e:
            logger.error(f'Failed to fetch Google Ads accounts: {e}')

    data = [{
        'id': a.id,
        'account_id': a.account_id,
        'name': a.name,
        'status': a.status,
        'currency': a.currency,
        'timezone': a.timezone,
        'customer_name': a.customer.descriptive_name if a.customer else None,
    } for a in accounts]

    return Response({'accounts': data})


def _fetch_and_store_accounts(user):
    """Fetch accessible customers from Google Ads API and store them."""
    from oauth.models import GoogleToken, GoogleUser
    from oauth.services.google_oauth import refresh_google_token
    from google_ads.models import GoogleAdsCustomer
    from google_ads.services.google_ads_api import GoogleAdsAPIClient

    token = GoogleToken.objects.get(user=user)
    refresh_google_token(user)
    token.refresh_from_db()

    google_user = GoogleUser.objects.get(user=user)
    client = GoogleAdsAPIClient(token.access_token)

    customer_ids = client.get_accessible_customers()
    logger.info(f'Found {len(customer_ids)} accessible customers')

    for customer_id in customer_ids:
        try:
            info = client.get_customer_info(customer_id)
            if not info:
                continue

            is_manager = info.get('manager', False)

            # Store as customer (MCC)
            customer_obj, _ = GoogleAdsCustomer.objects.update_or_create(
                user=user, customer_id=customer_id,
                defaults={
                    'google_user_id': google_user.google_user_id,
                    'name': info.get('descriptiveName', ''),
                    'descriptive_name': info.get('descriptiveName', ''),
                },
            )

            # If not a manager account, also store as an ad account
            if not is_manager:
                GoogleAdsAccount.objects.update_or_create(
                    user=user, account_id=customer_id,
                    defaults={
                        'google_user_id': google_user.google_user_id,
                        'customer': customer_obj,
                        'name': info.get('descriptiveName', ''),
                        'currency': info.get('currencyCode', ''),
                        'timezone': info.get('timeZone', ''),
                        'status': info.get('status', ''),
                    },
                )
        except Exception as e:
            logger.warning(f'Could not fetch info for customer {customer_id}: {e}')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_structural_sync(request):
    if request.user.user_type != 'agency':
        return Response({'error': 'Only agency users can trigger sync'}, status=status.HTTP_403_FORBIDDEN)

    account_ids = request.data.get('account_ids', [])
    if not account_ids:
        return Response({'error': 'account_ids required'}, status=status.HTTP_400_BAD_REQUEST)

    from google_ads.services.structural_sync import sync_structural
    try:
        results = sync_structural(request.user, account_ids)
        return Response({'success': True, 'results': results})
    except Exception as e:
        logger.error(f'Google Ads structural sync failed: {e}')
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_insights_sync(request):
    if request.user.user_type != 'agency':
        return Response({'error': 'Only agency users can trigger sync'}, status=status.HTTP_403_FORBIDDEN)

    account_ids = request.data.get('account_ids', [])
    start_date_str = request.data.get('start_date')
    end_date_str = request.data.get('end_date')

    if not account_ids or not start_date_str or not end_date_str:
        return Response({'error': 'account_ids, start_date, end_date required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except ValueError:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

    from google_ads.services.insights_sync import sync_insights
    try:
        results = sync_insights(request.user, account_ids, start_date, end_date)
        return Response(results)
    except Exception as e:
        logger.error(f'Google Ads insights sync failed: {e}')
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========== CLIENT ENDPOINTS ==========

def _get_allowed_google_account_ids(user):
    """Get Google Ads account IDs that a client user is allowed to see."""
    try:
        perms = user.permissions
        return perms.google_accounts_ids or []
    except ClientPermissions.DoesNotExist:
        return []


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_accounts(request):
    allowed_ids = _get_allowed_google_account_ids(request.user)
    if not allowed_ids:
        return Response({'ad_accounts': _mock_google_accounts(), 'is_mock': True})

    accounts = GoogleAdsAccount.objects.filter(account_id__in=allowed_ids)

    data = [{
        'id': a.account_id,
        'account_id': a.account_id,
        'name': a.name,
        'currency': a.currency,
        'timezone': a.timezone,
        'account_status': a.status,
        'status_display': a.status if a.status else 'UNKNOWN',
    } for a in accounts]

    return Response({'ad_accounts': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_campaigns(request):
    allowed_ids = _get_allowed_google_account_ids(request.user)
    if not allowed_ids:
        return Response({'campaigns': []})

    qs = GoogleAdsCampaign.objects.filter(account__account_id__in=allowed_ids).select_related('account')

    account_id = request.GET.get('account_id')
    if account_id and account_id in allowed_ids:
        qs = qs.filter(account__account_id=account_id)

    data = [{
        'id': c.campaign_id,
        'campaign_id': c.campaign_id,
        'ad_account_id': c.account.account_id,
        'name': c.name,
        'status': c.status,
        'campaign_type': c.campaign_type,
        'daily_budget': c.daily_budget,
    } for c in qs]

    return Response({'campaigns': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_ad_groups(request):
    allowed_ids = _get_allowed_google_account_ids(request.user)
    if not allowed_ids:
        return Response({'ad_groups': []})

    qs = GoogleAdsAdGroup.objects.filter(account__account_id__in=allowed_ids).select_related('campaign', 'account')

    campaign_ids = request.GET.getlist('campaign_id')
    if campaign_ids:
        qs = qs.filter(campaign__campaign_id__in=campaign_ids)

    data = [{
        'id': ag.ad_group_id,
        'ad_group_id': ag.ad_group_id,
        'campaign_id': ag.campaign.campaign_id,
        'ad_account_id': ag.account.account_id,
        'name': ag.name,
        'status': ag.status,
    } for ag in qs]

    return Response({'ad_groups': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_ads(request):
    allowed_ids = _get_allowed_google_account_ids(request.user)
    if not allowed_ids:
        return Response({'ads': []})

    qs = GoogleAdsAd.objects.filter(account__account_id__in=allowed_ids).select_related('campaign', 'ad_group', 'account')

    ad_group_ids = request.GET.getlist('ad_group_id')
    ad_ids = request.GET.getlist('ad_id')
    if ad_group_ids:
        qs = qs.filter(ad_group__ad_group_id__in=ad_group_ids)
    if ad_ids:
        qs = qs.filter(ad_id__in=ad_ids)

    data = [{
        'id': a.ad_id,
        'ad_id': a.ad_id,
        'ad_group_id': a.ad_group.ad_group_id,
        'campaign_id': a.campaign.campaign_id,
        'ad_account_id': a.account.account_id,
        'name': a.name,
        'status': a.status,
        'ad_type': a.ad_type,
    } for a in qs]

    return Response({'ads': data})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def client_insights(request):
    allowed_ids = _get_allowed_google_account_ids(request.user)
    if not allowed_ids:
        return Response(_mock_google_insights_response(request))

    if request.method == 'POST':
        return _client_insights_aggregate(request, allowed_ids)

    # GET: standard insights query
    account_id = request.GET.get('account_id')
    level = request.GET.get('level')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    qs = GoogleAdsInsight.objects.all()

    if account_id:
        if account_id not in allowed_ids:
            return Response({'error': 'Access denied to this account'}, status=status.HTTP_403_FORBIDDEN)
        if level == 'account':
            qs = qs.filter(object_id=account_id)
        else:
            entity_ids = _get_entity_ids_for_account(account_id, level)
            qs = qs.filter(object_id__in=entity_ids)
    else:
        all_entity_ids = set(allowed_ids)
        for aid in allowed_ids:
            for lvl in ['campaign', 'ad_group', 'ad']:
                all_entity_ids.update(_get_entity_ids_for_account(aid, lvl))
        qs = qs.filter(object_id__in=all_entity_ids)

    if level:
        qs = qs.filter(level=level)
    if start_date:
        qs = qs.filter(date__gte=start_date)
    if end_date:
        qs = qs.filter(date__lte=end_date)

    qs = qs.order_by('date')[:1000]

    data = [{
        'date': i.date.isoformat(),
        'level': i.level,
        'object_id': i.object_id,
        'spend': float(i.spend),
        'impressions': i.impressions,
        'clicks': i.clicks,
        'cpc': float(i.cpc),
        'cpm': float(i.cpm),
        'ctr': float(i.ctr),
        'conversions': float(i.conversions),
        'conversion_value': float(i.conversion_value),
    } for i in qs]

    return Response({'insights': data})


def _client_insights_aggregate(request, allowed_ids):
    """Handle POST aggregate insights for dashboard charts."""
    from django.db.models import Sum, Avg
    entities = request.data.get('entities', [])
    start_date = request.data.get('start_date')
    end_date = request.data.get('end_date')

    chart_data = []
    top_performers = []

    for entity in entities:
        entity_id = entity.get('id')
        entity_name = entity.get('name', '')
        entity_type = entity.get('type', 'campaign')
        e_start = entity.get('start_date', start_date)
        e_end = entity.get('end_date', end_date)

        qs = GoogleAdsInsight.objects.filter(
            object_id=entity_id,
            level=entity_type,
        )
        if e_start:
            qs = qs.filter(date__gte=e_start)
        if e_end:
            qs = qs.filter(date__lte=e_end)

        daily = list(qs.order_by('date').values(
            'date', 'spend', 'impressions', 'clicks', 'cpc', 'cpm', 'ctr',
            'conversions', 'conversion_value'
        ))

        for row in daily:
            chart_data.append({
                'date': row['date'].isoformat(),
                'entity_id': entity_id,
                'entity_name': entity_name,
                'entity_type': entity_type,
                'spend': float(row['spend']),
                'impressions': row['impressions'],
                'clicks': row['clicks'],
                'cpc': float(row['cpc']),
                'cpm': float(row['cpm']),
                'ctr': float(row['ctr']),
                'conversions': float(row['conversions']),
                'conversion_value': float(row['conversion_value']),
            })

        agg = qs.aggregate(
            total_spend=Sum('spend'),
            total_impressions=Sum('impressions'),
            total_clicks=Sum('clicks'),
            avg_cpc=Avg('cpc'),
            avg_ctr=Avg('ctr'),
            total_conversions=Sum('conversions'),
        )

        top_performers.append({
            'id': entity_id,
            'name': entity_name,
            'type': entity_type,
            'spend': float(agg['total_spend'] or 0),
            'impressions': agg['total_impressions'] or 0,
            'clicks': agg['total_clicks'] or 0,
            'cpc': float(agg['avg_cpc'] or 0),
            'ctr': float(agg['avg_ctr'] or 0),
            'conversions': float(agg['total_conversions'] or 0),
        })

    top_performers.sort(key=lambda x: x['spend'], reverse=True)

    return Response({
        'chartData': chart_data,
        'topPerformers': top_performers,
    })


def _get_entity_ids_for_account(account_id, level):
    if level == 'campaign':
        return list(GoogleAdsCampaign.objects.filter(account__account_id=account_id).values_list('campaign_id', flat=True))
    elif level == 'ad_group':
        return list(GoogleAdsAdGroup.objects.filter(account__account_id=account_id).values_list('ad_group_id', flat=True))
    elif level == 'ad':
        return list(GoogleAdsAd.objects.filter(account__account_id=account_id).values_list('ad_id', flat=True))
    return []


# ========== MOCK DATA HELPERS ==========

MOCK_GOOGLE_ACCOUNT_ID = 'mock-gads-001'

def _mock_google_accounts():
    return [{
        'id': MOCK_GOOGLE_ACCOUNT_ID,
        'account_id': MOCK_GOOGLE_ACCOUNT_ID,
        'name': 'Demo Google Ads Account',
        'currency': 'USD',
        'timezone': 'America/New_York',
        'account_status': 'ENABLED',
        'status_display': 'ENABLED',
        'is_mock': True,
    }]


def _mock_google_insights_response(request):
    """Return mock insights for both GET and POST requests."""
    random.seed(42)
    today = date.today()

    if request.method == 'POST':
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        start = datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else today - timedelta(days=30)
        end = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else today

        chart_data = []
        day = start
        while day <= end:
            base_spend = random.uniform(40, 120)
            impressions = random.randint(3000, 12000)
            clicks = random.randint(80, 400)
            conversions = random.uniform(2, 15)
            chart_data.append({
                'date': day.isoformat(),
                'entity_id': MOCK_GOOGLE_ACCOUNT_ID,
                'entity_name': 'Demo Google Ads Account',
                'entity_type': 'account',
                'spend': round(base_spend, 2),
                'impressions': impressions,
                'clicks': clicks,
                'cpc': round(base_spend / max(clicks, 1), 2),
                'cpm': round(base_spend / max(impressions, 1) * 1000, 2),
                'ctr': round(clicks / max(impressions, 1) * 100, 2),
                'conversions': round(conversions, 1),
                'conversion_value': round(conversions * random.uniform(20, 60), 2),
                'is_mock': True,
            })
            day += timedelta(days=1)

        total_spend = sum(r['spend'] for r in chart_data)
        total_impressions = sum(r['impressions'] for r in chart_data)
        total_clicks = sum(r['clicks'] for r in chart_data)
        total_conversions = sum(r['conversions'] for r in chart_data)

        return {
            'chartData': chart_data,
            'topPerformers': [{
                'id': MOCK_GOOGLE_ACCOUNT_ID,
                'name': 'Demo Google Ads Account',
                'type': 'account',
                'spend': round(total_spend, 2),
                'impressions': total_impressions,
                'clicks': total_clicks,
                'cpc': round(total_spend / max(total_clicks, 1), 2),
                'ctr': round(total_clicks / max(total_impressions, 1) * 100, 2),
                'conversions': round(total_conversions, 1),
                'is_mock': True,
            }],
            'is_mock': True,
        }

    # GET request
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    start = datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else today - timedelta(days=30)
    end = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else today

    insights = []
    day = start
    while day <= end:
        base_spend = random.uniform(40, 120)
        impressions = random.randint(3000, 12000)
        clicks = random.randint(80, 400)
        conversions = random.uniform(2, 15)
        insights.append({
            'date': day.isoformat(),
            'level': 'account',
            'object_id': MOCK_GOOGLE_ACCOUNT_ID,
            'spend': round(base_spend, 2),
            'impressions': impressions,
            'clicks': clicks,
            'cpc': round(base_spend / max(clicks, 1), 2),
            'cpm': round(base_spend / max(impressions, 1) * 1000, 2),
            'ctr': round(clicks / max(impressions, 1) * 100, 2),
            'conversions': round(conversions, 1),
            'conversion_value': round(conversions * random.uniform(20, 60), 2),
            'is_mock': True,
        })
        day += timedelta(days=1)

    return {'insights': insights, 'is_mock': True}
