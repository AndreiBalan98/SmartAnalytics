import logging
import random
from datetime import datetime, timedelta, date
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from ga4.models import GA4Account, GA4Property, GA4Insight
from users.models import ClientPermissions

logger = logging.getLogger('ga4')


# ========== AGENCY ENDPOINTS ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_properties(request):
    if request.user.user_type != 'agency':
        return Response({'error': 'Only agency users can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)

    # If no properties in DB yet, try to fetch from API
    properties = GA4Property.objects.filter(user=request.user)
    if properties.count() == 0:
        try:
            _fetch_and_store_properties(request.user)
            properties = GA4Property.objects.filter(user=request.user)
        except Exception as e:
            logger.error(f'Failed to fetch GA4 properties: {e}')

    data = [{
        'id': p.id,
        'property_id': p.property_id,
        'name': p.name,
        'timezone': p.timezone,
        'currency': p.currency,
        'account_name': p.account.name if p.account else None,
    } for p in properties]

    return Response({'properties': data})


def _fetch_and_store_properties(user):
    """Fetch GA4 accounts and properties from API and store them."""
    from oauth.models import GA4Token, GA4User
    from oauth.services.ga4_oauth import refresh_ga4_token
    from ga4.services.ga4_api import GA4APIClient

    token = GA4Token.objects.get(user=user)
    refresh_ga4_token(user)
    token.refresh_from_db()

    ga4_user = GA4User.objects.get(user=user)
    client = GA4APIClient(token.access_token)

    accounts = client.get_accounts()
    logger.info(f'Found {len(accounts)} GA4 accounts')

    for acc in accounts:
        account_obj, _ = GA4Account.objects.update_or_create(
            user=user, account_id=acc['id'],
            defaults={
                'google_user_id': ga4_user.google_user_id,
                'name': acc.get('name', ''),
            },
        )

        try:
            properties = client.get_properties(acc['id'])
            for prop in properties:
                GA4Property.objects.update_or_create(
                    user=user, property_id=prop['id'],
                    defaults={
                        'google_user_id': ga4_user.google_user_id,
                        'account': account_obj,
                        'name': prop.get('name', ''),
                        'timezone': prop.get('timezone', ''),
                        'currency': prop.get('currency', ''),
                    },
                )
            logger.info(f'GA4 account {acc["id"]}: {len(properties)} properties')
        except Exception as e:
            logger.warning(f'GA4 account {acc["id"]}: failed to fetch properties - {e}')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_structural_sync(request):
    if request.user.user_type != 'agency':
        return Response({'error': 'Only agency users can trigger sync'}, status=status.HTTP_403_FORBIDDEN)

    from ga4.services.structural_sync import sync_structural
    try:
        results = sync_structural(request.user)
        return Response({'success': True, 'results': results})
    except Exception as e:
        logger.error(f'GA4 structural sync failed: {e}')
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_insights_sync(request):
    if request.user.user_type != 'agency':
        return Response({'error': 'Only agency users can trigger sync'}, status=status.HTTP_403_FORBIDDEN)

    property_ids = request.data.get('property_ids', [])
    start_date_str = request.data.get('start_date')
    end_date_str = request.data.get('end_date')

    if not property_ids or not start_date_str or not end_date_str:
        return Response({'error': 'property_ids, start_date, end_date required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except ValueError:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

    from ga4.services.insights_sync import sync_insights
    try:
        results = sync_insights(request.user, property_ids, start_date, end_date)
        return Response(results)
    except Exception as e:
        logger.error(f'GA4 insights sync failed: {e}')
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========== CLIENT ENDPOINTS ==========

def _get_allowed_ga4_property_ids(user):
    """Get GA4 property IDs that a client user is allowed to see."""
    try:
        perms = user.permissions
        return perms.ga4_properties_ids or []
    except ClientPermissions.DoesNotExist:
        return []


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_properties(request):
    allowed_ids = _get_allowed_ga4_property_ids(request.user)
    if not allowed_ids:
        return Response({'properties': _mock_ga4_properties(), 'is_mock': True})

    properties = GA4Property.objects.filter(property_id__in=allowed_ids).select_related('account')

    data = [{
        'id': p.property_id,
        'property_id': p.property_id,
        'name': p.name,
        'timezone': p.timezone,
        'currency': p.currency,
        'account_name': p.account.name if p.account else None,
    } for p in properties]

    return Response({'properties': data})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def client_insights(request):
    allowed_ids = _get_allowed_ga4_property_ids(request.user)
    if not allowed_ids:
        return Response(_mock_ga4_insights_response(request))

    if request.method == 'POST':
        return _client_insights_aggregate(request, allowed_ids)

    # GET: standard insights query
    property_id = request.GET.get('property_id')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    include_sources = request.GET.get('include_sources', 'false') == 'true'

    qs = GA4Insight.objects.filter(property_id__in=allowed_ids)

    if property_id:
        if property_id not in allowed_ids:
            return Response({'error': 'Access denied to this property'}, status=status.HTTP_403_FORBIDDEN)
        qs = qs.filter(property_id=property_id)

    if not include_sources:
        qs = qs.filter(source='', medium='')

    if start_date:
        qs = qs.filter(date__gte=start_date)
    if end_date:
        qs = qs.filter(date__lte=end_date)

    qs = qs.order_by('date')[:1000]

    data = [{
        'date': i.date.isoformat(),
        'property_id': i.property_id,
        'sessions': i.sessions,
        'users': i.users,
        'pageviews': i.pageviews,
        'bounce_rate': float(i.bounce_rate),
        'conversions': i.conversions,
        'events': i.events,
        'revenue': float(i.revenue),
        'source': i.source,
        'medium': i.medium,
    } for i in qs]

    return Response({'insights': data})


def _client_insights_aggregate(request, allowed_ids):
    """Handle POST aggregate insights for GA4 dashboard charts."""
    from django.db.models import Sum, Avg
    properties = request.data.get('properties', [])
    start_date = request.data.get('start_date')
    end_date = request.data.get('end_date')

    chart_data = []
    summaries = []

    for prop in properties:
        prop_id = prop.get('id')
        prop_name = prop.get('name', '')

        if prop_id not in allowed_ids:
            continue

        qs = GA4Insight.objects.filter(
            property_id=prop_id,
            source='', medium='',
        )
        if start_date:
            qs = qs.filter(date__gte=start_date)
        if end_date:
            qs = qs.filter(date__lte=end_date)

        daily = list(qs.order_by('date').values(
            'date', 'sessions', 'users', 'pageviews', 'bounce_rate',
            'conversions', 'events', 'revenue'
        ))

        for row in daily:
            chart_data.append({
                'date': row['date'].isoformat(),
                'property_id': prop_id,
                'property_name': prop_name,
                'sessions': row['sessions'],
                'users': row['users'],
                'pageviews': row['pageviews'],
                'bounce_rate': float(row['bounce_rate']),
                'conversions': row['conversions'],
                'events': row['events'],
                'revenue': float(row['revenue']),
            })

        agg = qs.aggregate(
            total_sessions=Sum('sessions'),
            total_users=Sum('users'),
            total_pageviews=Sum('pageviews'),
            avg_bounce_rate=Avg('bounce_rate'),
            total_conversions=Sum('conversions'),
            total_events=Sum('events'),
            total_revenue=Sum('revenue'),
        )

        summaries.append({
            'id': prop_id,
            'name': prop_name,
            'sessions': agg['total_sessions'] or 0,
            'users': agg['total_users'] or 0,
            'pageviews': agg['total_pageviews'] or 0,
            'bounce_rate': float(agg['avg_bounce_rate'] or 0),
            'conversions': agg['total_conversions'] or 0,
            'events': agg['total_events'] or 0,
            'revenue': float(agg['total_revenue'] or 0),
        })

    return Response({
        'chartData': chart_data,
        'summaries': summaries,
    })


# ========== MOCK DATA HELPERS ==========

MOCK_GA4_PROPERTY_ID = 'mock-ga4-001'

def _mock_ga4_properties():
    return [{
        'id': MOCK_GA4_PROPERTY_ID,
        'property_id': MOCK_GA4_PROPERTY_ID,
        'name': 'Demo Website',
        'timezone': 'America/New_York',
        'currency': 'USD',
        'account_name': 'Demo Analytics Account',
        'is_mock': True,
    }]


MOCK_SOURCES = [
    ('google', 'organic'),
    ('direct', '(none)'),
    ('facebook.com', 'referral'),
    ('newsletter', 'email'),
    ('google', 'cpc'),
]


def _mock_ga4_insights_response(request):
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
            sessions = random.randint(200, 800)
            users = int(sessions * random.uniform(0.65, 0.85))
            pageviews = int(sessions * random.uniform(1.8, 3.2))
            chart_data.append({
                'date': day.isoformat(),
                'property_id': MOCK_GA4_PROPERTY_ID,
                'property_name': 'Demo Website',
                'sessions': sessions,
                'users': users,
                'pageviews': pageviews,
                'bounce_rate': round(random.uniform(35, 55), 2),
                'conversions': random.randint(5, 30),
                'events': random.randint(500, 2000),
                'revenue': round(random.uniform(50, 300), 2),
                'is_mock': True,
            })
            day += timedelta(days=1)

        total_sessions = sum(r['sessions'] for r in chart_data)
        total_users = sum(r['users'] for r in chart_data)
        total_pageviews = sum(r['pageviews'] for r in chart_data)
        total_conversions = sum(r['conversions'] for r in chart_data)
        total_events = sum(r['events'] for r in chart_data)
        total_revenue = sum(r['revenue'] for r in chart_data)
        n = len(chart_data) or 1
        avg_bounce = sum(r['bounce_rate'] for r in chart_data) / n

        return {
            'chartData': chart_data,
            'summaries': [{
                'id': MOCK_GA4_PROPERTY_ID,
                'name': 'Demo Website',
                'sessions': total_sessions,
                'users': total_users,
                'pageviews': total_pageviews,
                'bounce_rate': round(avg_bounce, 2),
                'conversions': total_conversions,
                'events': total_events,
                'revenue': round(total_revenue, 2),
                'is_mock': True,
            }],
            'is_mock': True,
        }

    # GET request
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    include_sources = request.GET.get('include_sources', 'false') == 'true'
    start = datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else today - timedelta(days=30)
    end = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else today

    insights = []
    day = start
    while day <= end:
        sessions = random.randint(200, 800)
        users = int(sessions * random.uniform(0.65, 0.85))
        pageviews = int(sessions * random.uniform(1.8, 3.2))
        insights.append({
            'date': day.isoformat(),
            'property_id': MOCK_GA4_PROPERTY_ID,
            'sessions': sessions,
            'users': users,
            'pageviews': pageviews,
            'bounce_rate': round(random.uniform(35, 55), 2),
            'conversions': random.randint(5, 30),
            'events': random.randint(500, 2000),
            'revenue': round(random.uniform(50, 300), 2),
            'source': '',
            'medium': '',
            'is_mock': True,
        })

        if include_sources:
            for src, med in MOCK_SOURCES:
                s = random.randint(20, 150)
                insights.append({
                    'date': day.isoformat(),
                    'property_id': MOCK_GA4_PROPERTY_ID,
                    'sessions': s,
                    'users': int(s * random.uniform(0.65, 0.85)),
                    'pageviews': int(s * random.uniform(1.8, 3.2)),
                    'bounce_rate': round(random.uniform(30, 60), 2),
                    'conversions': random.randint(0, 8),
                    'events': random.randint(50, 400),
                    'revenue': round(random.uniform(5, 80), 2),
                    'source': src,
                    'medium': med,
                    'is_mock': True,
                })

        day += timedelta(days=1)

    return {'insights': insights, 'is_mock': True}
