import logging
import random
from datetime import datetime, timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from meta.models import MetaAccount, MetaCampaign, MetaAdset, MetaAd, MetaInsight, MetaPage, MetaLeadForm, MetaLead
from users.models import ClientPermissions

logger = logging.getLogger('meta')


# ========== AGENCY ENDPOINTS ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_ad_accounts(request):
    if request.user.user_type != 'agency':
        return Response({'error': 'Only agency users can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)

    accounts = MetaAccount.objects.filter(user=request.user)
    data = [{
        'id': a.id,
        'account_id': a.account_id,
        'name': a.name,
        'status': a.status,
        'currency': a.currency,
        'timezone': a.timezone_offset_hours_utc,
        'business_name': a.business.name if a.business else None,
    } for a in accounts]

    return Response({'accounts': data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_structural_sync(request):
    if request.user.user_type != 'agency':
        return Response({'error': 'Only agency users can trigger sync'}, status=status.HTTP_403_FORBIDDEN)

    account_ids = request.data.get('account_ids', [])
    if not account_ids:
        return Response({'error': 'account_ids required'}, status=status.HTTP_400_BAD_REQUEST)

    from meta.services.structural_sync import sync_structural
    try:
        results = sync_structural(request.user, account_ids)
        return Response({'success': True, 'results': results})
    except Exception as e:
        logger.error(f'Structural sync failed: {e}')
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

    from meta.services.insights_sync import sync_insights
    try:
        results = sync_insights(request.user, account_ids, start_date, end_date)
        return Response(results)
    except Exception as e:
        logger.error(f'Insights sync failed: {e}')
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========== LEAD ADS - AGENCY ENDPOINTS ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pages(request):
    """Get all pages for the agency user."""
    if request.user.user_type != 'agency':
        return Response({'error': 'Only agency users'}, status=status.HTTP_403_FORBIDDEN)
    pages = MetaPage.objects.filter(user=request.user)
    data = [{'page_id': p.page_id, 'name': p.name} for p in pages]
    return Response({'pages': data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_leads_structural_sync(request):
    """Sync leadgen forms for selected pages."""
    if request.user.user_type != 'agency':
        return Response({'error': 'Only agency users'}, status=status.HTTP_403_FORBIDDEN)
    page_ids = request.data.get('page_ids', [])
    if not page_ids:
        return Response({'error': 'page_ids required'}, status=status.HTTP_400_BAD_REQUEST)
    from meta.services.leads_structural_sync import sync_lead_forms
    try:
        results = sync_lead_forms(request.user, page_ids)
        return Response({'success': True, 'results': results})
    except Exception as e:
        logger.error(f'Leads structural sync failed: {e}')
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_lead_forms(request):
    """Get all synced lead forms for the agency user."""
    if request.user.user_type != 'agency':
        return Response({'error': 'Only agency users'}, status=status.HTTP_403_FORBIDDEN)
    forms = MetaLeadForm.objects.filter(user=request.user).select_related('page')
    data = [{
        'form_id': f.form_id,
        'name': f.name,
        'status': f.status,
        'page_id': f.page.page_id,
        'page_name': f.page.name,
    } for f in forms]
    return Response({'forms': data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_leads_sync(request):
    """Sync leads for selected forms."""
    if request.user.user_type != 'agency':
        return Response({'error': 'Only agency users'}, status=status.HTTP_403_FORBIDDEN)
    form_ids = request.data.get('form_ids', [])
    if not form_ids:
        return Response({'error': 'form_ids required'}, status=status.HTTP_400_BAD_REQUEST)
    from meta.services.leads_sync import sync_leads
    try:
        results = sync_leads(request.user, form_ids)
        return Response({'success': True, 'results': results})
    except Exception as e:
        logger.error(f'Leads sync failed: {e}')
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========== CLIENT ENDPOINTS ==========

def _get_allowed_account_ids(user):
    """Get account IDs that a client/agency_client user is allowed to see."""
    try:
        perms = user.permissions
        return perms.meta_accounts_ids or []
    except ClientPermissions.DoesNotExist:
        return []


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_ad_accounts(request):
    allowed_ids = _get_allowed_account_ids(request.user)
    if not allowed_ids:
        return Response({'ad_accounts': []})

    accounts = MetaAccount.objects.filter(account_id__in=allowed_ids)

    def get_status_display(status_code):
        if status_code == 1:
            return 'ACTIVE'
        elif status_code == 2:
            return 'DISABLED'
        elif status_code == 101:
            return 'CLOSED'
        else:
            return 'UNKNOWN'

    data = [{
        'id': a.account_id,
        'account_id': a.account_id,
        'name': a.name,
        'currency': a.currency,
        'timezone': a.timezone_offset_hours_utc,  # This actually contains timezone_name from Meta API
        'account_status': a.status,
        'status_display': get_status_display(a.status),
    } for a in accounts]

    return Response({'ad_accounts': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_campaigns(request):
    allowed_ids = _get_allowed_account_ids(request.user)
    if not allowed_ids:
        return Response({'campaigns': []})

    qs = MetaCampaign.objects.filter(account__account_id__in=allowed_ids).select_related('account')

    # Optional filter by account_id
    account_id = request.GET.get('account_id')
    if account_id and account_id in allowed_ids:
        qs = qs.filter(account__account_id=account_id)

    data = [{
        'id': c.campaign_id,
        'campaign_id': c.campaign_id,
        'ad_account_id': c.account.account_id,
        'name': c.name,
        'status': c.status,
        'objective': c.objective,
        'daily_budget': c.daily_budget,
    } for c in qs]

    return Response({'campaigns': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_adsets(request):
    allowed_ids = _get_allowed_account_ids(request.user)
    if not allowed_ids:
        return Response({'adsets': []})

    qs = MetaAdset.objects.filter(account__account_id__in=allowed_ids).select_related('campaign', 'account')

    # Optional filter by campaign_id(s)
    campaign_ids = request.GET.getlist('campaign_id')
    if campaign_ids:
        qs = qs.filter(campaign__campaign_id__in=campaign_ids)

    data = [{
        'id': a.adset_id,
        'adset_id': a.adset_id,
        'campaign_id': a.campaign.campaign_id,
        'ad_account_id': a.account.account_id,
        'name': a.name,
        'status': a.status,
        'optimization_goal': a.optimization_goal,
        'daily_budget': a.daily_budget,
    } for a in qs]

    return Response({'adsets': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_ads(request):
    allowed_ids = _get_allowed_account_ids(request.user)
    if not allowed_ids:
        return Response({'ads': []})

    qs = MetaAd.objects.filter(account__account_id__in=allowed_ids).select_related('campaign', 'adset', 'account')

    # Optional filter by adset_id(s) or ad_id(s)
    adset_ids = request.GET.getlist('adset_id')
    ad_ids = request.GET.getlist('ad_id')
    if adset_ids:
        qs = qs.filter(adset__adset_id__in=adset_ids)
    if ad_ids:
        qs = qs.filter(ad_id__in=ad_ids)

    data = [{
        'id': a.ad_id,
        'ad_id': a.ad_id,
        'adset_id': a.adset.adset_id,
        'campaign_id': a.campaign.campaign_id,
        'ad_account_id': a.account.account_id,
        'name': a.name,
        'status': a.status,
        'creative': a.creative,
    } for a in qs]

    return Response({'ads': data})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def client_insights(request):
    allowed_ids = _get_allowed_account_ids(request.user)
    if not allowed_ids:
        return Response({'insights': []})

    # POST: aggregate insights for multiple entities
    if request.method == 'POST':
        return _client_insights_aggregate(request, allowed_ids)

    # GET: standard insights query
    account_id = request.GET.get('account_id')
    level = request.GET.get('level')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    qs = MetaInsight.objects.all()

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
            for lvl in ['campaign', 'adset', 'ad']:
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
        'reach': i.reach,
        'clicks': i.clicks,
        'cpc': float(i.cpc),
        'cpm': float(i.cpm),
        'ctr': float(i.ctr),
        'actions': i.actions,
        'action_values': i.action_values,
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

        qs = MetaInsight.objects.filter(
            object_id=entity_id,
            level=entity_type,
        )
        if e_start:
            qs = qs.filter(date__gte=e_start)
        if e_end:
            qs = qs.filter(date__lte=e_end)

        # Daily data for charts
        daily = list(qs.order_by('date').values(
            'date', 'spend', 'impressions', 'reach', 'clicks', 'cpc', 'cpm', 'ctr'
        ))

        for row in daily:
            chart_data.append({
                'date': row['date'].isoformat(),
                'entity_id': entity_id,
                'entity_name': entity_name,
                'entity_type': entity_type,
                'spend': float(row['spend']),
                'impressions': row['impressions'],
                'reach': row['reach'],
                'clicks': row['clicks'],
                'cpc': float(row['cpc']),
                'cpm': float(row['cpm']),
                'ctr': float(row['ctr']),
            })

        # Aggregate for top performers
        agg = qs.aggregate(
            total_spend=Sum('spend'),
            total_impressions=Sum('impressions'),
            total_clicks=Sum('clicks'),
            avg_cpc=Avg('cpc'),
            avg_ctr=Avg('ctr'),
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
        })

    # Sort top performers by spend
    top_performers.sort(key=lambda x: x['spend'], reverse=True)

    return Response({
        'chartData': chart_data,
        'topPerformers': top_performers,
    })


def _get_entity_ids_for_account(account_id, level):
    if level == 'campaign':
        return list(MetaCampaign.objects.filter(account__account_id=account_id).values_list('campaign_id', flat=True))
    elif level == 'adset':
        return list(MetaAdset.objects.filter(account__account_id=account_id).values_list('adset_id', flat=True))
    elif level == 'ad':
        return list(MetaAd.objects.filter(account__account_id=account_id).values_list('ad_id', flat=True))
    return []


def _get_allowed_form_ids(user):
    try:
        perms = user.permissions
        return perms.meta_form_ids or []
    except ClientPermissions.DoesNotExist:
        return []


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_leads(request):
    """Get leads for a client user based on their form permissions."""
    allowed_form_ids = _get_allowed_form_ids(request.user)
    if not allowed_form_ids:
        mock = _mock_leads_data()
        return Response({'leads': mock, 'total': len(mock), 'is_mock': True})

    qs = MetaLead.objects.filter(
        form__form_id__in=allowed_form_ids
    ).select_related('form').order_by('-created_time')

    limit = int(request.GET.get('limit', 100))
    offset = int(request.GET.get('offset', 0))
    total = qs.count()
    qs = qs[offset:offset + limit]

    data = [{
        'id': l.lead_id,
        'lead_id': l.lead_id,
        'created_time': l.created_time.isoformat(),
        'field_data': l.field_data,
        'ad_id': l.ad_id,
        'ad_name': l.ad_name,
        'adset_id': l.adset_id,
        'adset_name': l.adset_name,
        'campaign_id': l.campaign_id,
        'campaign_name': l.campaign_name,
        'form_name': l.form.name,
        'is_organic': l.is_organic,
        'platform': l.platform,
    } for l in qs]

    return Response({'leads': data, 'total': total})


# ========== MOCK DATA HELPERS ==========

def _mock_leads_data():
    random.seed(42)
    now = datetime.now()
    mock_people = [
        {'name': 'Maria Ionescu', 'email': 'maria.ionescu@example.com', 'phone': '+40 721 234 567'},
        {'name': 'Andrei Popescu', 'email': 'andrei.popescu@example.com', 'phone': '+40 732 345 678'},
        {'name': 'Elena Dumitrescu', 'email': 'elena.d@example.com', 'phone': '+40 743 456 789'},
        {'name': 'Stefan Gheorghe', 'email': 'stefan.g@example.com', 'phone': '+40 754 567 890'},
        {'name': 'Ana Radu', 'email': 'ana.radu@example.com', 'phone': '+40 765 678 901'},
    ]
    campaigns = [
        ('mock-camp-1', 'Summer Sale 2025', 'mock-adset-1', 'Retargeting Lookalike'),
        ('mock-camp-2', 'Lead Gen - Services', 'mock-adset-2', 'Interest Targeting'),
        ('mock-camp-1', 'Summer Sale 2025', 'mock-adset-3', 'Broad Audience'),
    ]
    leads = []
    for i, person in enumerate(mock_people):
        camp = campaigns[i % len(campaigns)]
        created = now - timedelta(days=random.randint(0, 13), hours=random.randint(0, 23))
        leads.append({
            'id': f'mock-lead-{i+1}',
            'lead_id': f'mock-lead-{i+1}',
            'created_time': created.isoformat(),
            'field_data': [
                {'name': 'full_name', 'values': [person['name']]},
                {'name': 'email', 'values': [person['email']]},
                {'name': 'phone_number', 'values': [person['phone']]},
            ],
            'ad_id': f'mock-ad-{i+1}',
            'ad_name': f'Ad Variant {chr(65+i)}',
            'adset_id': camp[2],
            'adset_name': camp[3],
            'campaign_id': camp[0],
            'campaign_name': camp[1],
            'form_name': 'Demo Contact Form',
            'is_organic': False,
            'platform': 'fb',
            'is_mock': True,
        })
    return leads
