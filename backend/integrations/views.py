from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from agencies.models import Agency, AgencyUser
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_meta_data(request):
    """
    Trigger a data sync from Meta for the current agency.

    For now this endpoint only fetches the latest ad accounts and a
    high-level insights snapshot without persisting to the reporting
    tables. It is meant to be called from the Agency Dashboard "Sync
    data" button and can be extended later to write into DailyMetric,
    Campaign, etc.
    """

    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can sync Meta data'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        agency = Agency.objects.get(owner=request.user)
    except Agency.DoesNotExist:
        return Response({
            'error': 'No agency found for this user'
        }, status=status.HTTP_404_NOT_FOUND)

    # Ensure Meta is connected
    integration = MetaIntegration.objects.filter(agency=agency).first()
    if not integration:
        return Response({
            'error': 'Meta not connected for this agency'
        }, status=status.HTTP_400_BAD_REQUEST)

    # In mock mode we just return a simple payload – the client dashboards
    # already rely on mock data defined in the frontend.
    if settings.MOCK_META:
        return Response({
            'success': True,
            'mock': True,
            'message': 'Mock Meta sync completed',
            'summary': {
                'accounts_synced': 3,
                'date_range': 'last_7_days',
            }
        })

    # Real API calls – keep it light-weight for now and just fetch
    # all ad accounts and an insights snapshot for each.
    try:
        accounts = meta_service.get_ad_accounts(agency)

        insights_summaries = []
        for account in accounts:
            account_id = account.get('id')
            if not account_id:
                continue

            try:
                insights = meta_service.get_insights(agency, account_id)
                insights_summaries.append({
                    'account_id': account_id,
                    'metrics': insights.get('metrics', {}),
                })
            except Exception:
                # Don't fail the whole sync if a single account errors out
                continue

        return Response({
            'success': True,
            'mock': False,
            'message': 'Meta sync completed',
            'summary': {
                'accounts_synced': len(accounts),
                'insights_synced': len(insights_summaries),
            }
        })
    except Exception as e:
        return Response({
            'error': 'Failed to sync Meta data',
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_client_dashboard_data(request):
    """
    Get dashboard data for a client user.
    Returns metrics for all Meta ad accounts the client has access to.
    """
    from datetime import datetime, timedelta
    from django.utils import timezone

    if request.user.user_type != 'client':
        return Response({
            'error': 'Only client users can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)

    # Get all agency memberships for this client
    memberships = AgencyUser.objects.filter(user=request.user, is_active=True).select_related('agency')
    
    if not memberships.exists():
        return Response({
            'error': 'No active agency memberships found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Collect all allowed Meta account IDs from all memberships
    allowed_account_ids = []
    agencies_with_meta = []
    
    for membership in memberships:
        meta_accounts = membership.permissions.get('meta_accounts', [])
        if meta_accounts:
            allowed_account_ids.extend(meta_accounts)
            # Track which agency has Meta connected for each account
            agencies_with_meta.append({
                'agency': membership.agency,
                'account_ids': meta_accounts
            })

    if not allowed_account_ids:
        return Response({
            'daily_data': [],
            'campaigns': [],
            'message': 'No Meta ad accounts assigned'
        })

    # Remove duplicates
    allowed_account_ids = list(set(allowed_account_ids))

    # Mock account IDs (these should always return mock data)
    MOCK_ACCOUNT_IDS = {'act_123456789', 'act_987654321', 'act_555555555'}
    
    # Determine if we're in mock mode or if all accounts are mock accounts
    is_mock_mode = settings.MOCK_META or all(acc_id in MOCK_ACCOUNT_IDS for acc_id in allowed_account_ids)

    daily_data = []
    campaigns = []

    if is_mock_mode:
        # Return mock data for mock accounts
        mock_daily_data = {
            'act_123456789': [
                {'date': '2026-01-05', 'spend': 145.50, 'impressions': 5420, 'clicks': 234, 'conversions': 12, 'revenue': 580.00},
                {'date': '2026-01-06', 'spend': 158.20, 'impressions': 6120, 'clicks': 267, 'conversions': 15, 'revenue': 690.00},
                {'date': '2026-01-07', 'spend': 142.80, 'impressions': 5890, 'clicks': 245, 'conversions': 11, 'revenue': 520.00},
                {'date': '2026-01-08', 'spend': 167.30, 'impressions': 6540, 'clicks': 289, 'conversions': 18, 'revenue': 820.00},
                {'date': '2026-01-09', 'spend': 155.90, 'impressions': 6230, 'clicks': 271, 'conversions': 14, 'revenue': 710.00},
                {'date': '2026-01-10', 'spend': 172.40, 'impressions': 6890, 'clicks': 302, 'conversions': 19, 'revenue': 890.00},
                {'date': '2026-01-11', 'spend': 163.20, 'impressions': 6450, 'clicks': 285, 'conversions': 16, 'revenue': 760.00},
            ],
            'act_987654321': [
                {'date': '2026-01-05', 'spend': 98.30, 'impressions': 3210, 'clicks': 156, 'conversions': 8, 'revenue': 380.00},
                {'date': '2026-01-06', 'spend': 112.50, 'impressions': 3890, 'clicks': 189, 'conversions': 11, 'revenue': 520.00},
                {'date': '2026-01-07', 'spend': 105.20, 'impressions': 3560, 'clicks': 167, 'conversions': 9, 'revenue': 410.00},
                {'date': '2026-01-08', 'spend': 118.90, 'impressions': 4120, 'clicks': 201, 'conversions': 13, 'revenue': 610.00},
                {'date': '2026-01-09', 'spend': 108.70, 'impressions': 3780, 'clicks': 178, 'conversions': 10, 'revenue': 480.00},
                {'date': '2026-01-10', 'spend': 125.40, 'impressions': 4320, 'clicks': 215, 'conversions': 14, 'revenue': 670.00},
                {'date': '2026-01-11', 'spend': 115.80, 'impressions': 4050, 'clicks': 195, 'conversions': 12, 'revenue': 560.00},
            ],
            'act_555555555': [
                {'date': '2026-01-05', 'spend': 75.20, 'impressions': 2450, 'clicks': 123, 'conversions': 6, 'revenue': 290.00},
                {'date': '2026-01-06', 'spend': 82.10, 'impressions': 2780, 'clicks': 145, 'conversions': 8, 'revenue': 340.00},
                {'date': '2026-01-07', 'spend': 78.50, 'impressions': 2650, 'clicks': 138, 'conversions': 7, 'revenue': 320.00},
                {'date': '2026-01-08', 'spend': 85.30, 'impressions': 2950, 'clicks': 156, 'conversions': 9, 'revenue': 380.00},
                {'date': '2026-01-09', 'spend': 80.90, 'impressions': 2820, 'clicks': 148, 'conversions': 8, 'revenue': 360.00},
                {'date': '2026-01-10', 'spend': 88.20, 'impressions': 3120, 'clicks': 167, 'conversions': 10, 'revenue': 420.00},
                {'date': '2026-01-11', 'spend': 83.60, 'impressions': 2980, 'clicks': 152, 'conversions': 9, 'revenue': 390.00},
            ],
        }
        
        mock_campaigns = {
            'act_123456789': [
                {'id': 1, 'name': 'Summer Sale Campaign', 'account_id': 'act_123456789', 'spend': 485.30, 'impressions': 18450, 'clicks': 823, 'conversions': 42, 'revenue': 1950.00, 'status': 'active'},
                {'id': 2, 'name': 'Brand Awareness Q1', 'account_id': 'act_123456789', 'spend': 312.80, 'impressions': 12340, 'clicks': 534, 'conversions': 28, 'revenue': 1240.00, 'status': 'active'},
            ],
            'act_987654321': [
                {'id': 3, 'name': 'Retargeting Campaign', 'account_id': 'act_987654321', 'spend': 267.20, 'impressions': 9850, 'clicks': 456, 'conversions': 35, 'revenue': 1780.00, 'status': 'active'},
            ],
            'act_555555555': [
                {'id': 4, 'name': 'Holiday Campaign', 'account_id': 'act_555555555', 'spend': 198.50, 'impressions': 7250, 'clicks': 312, 'conversions': 18, 'revenue': 890.00, 'status': 'active'},
            ],
        }

        # Filter mock data for allowed accounts
        for account_id in allowed_account_ids:
            if account_id in mock_daily_data:
                daily_data.extend(mock_daily_data[account_id])
            if account_id in mock_campaigns:
                campaigns.extend(mock_campaigns[account_id])
    else:
        # Fetch real data from Meta API for each account
        for item in agencies_with_meta:
            agency = item['agency']
            account_ids = item['account_ids']
            
            # Check if Meta is connected for this agency
            try:
                integration = MetaIntegration.objects.get(agency=agency)
            except MetaIntegration.DoesNotExist:
                continue  # Skip if Meta not connected for this agency

            for account_id in account_ids:
                # Skip mock accounts even in real mode
                if account_id in MOCK_ACCOUNT_IDS:
                    continue
                
                try:
                    # Fetch insights for this account
                    insights = meta_service.get_insights(agency, account_id, date_preset='last_7d')
                    metrics = insights.get('metrics', {})
                    
                    # Generate daily data from insights (simplified - in production you'd want to store daily breakdown)
                    # For now, we'll create a single aggregated entry
                    today = timezone.now().date()
                    daily_data.append({
                        'date': today.isoformat(),
                        'spend': float(metrics.get('spend', 0)),
                        'impressions': int(metrics.get('impressions', 0)),
                        'clicks': int(metrics.get('clicks', 0)),
                        'conversions': int(metrics.get('purchases', 0)),
                        'revenue': float(metrics.get('revenue', 0)),
                    })
                    
                    # Create a campaign entry (simplified - in production fetch actual campaigns)
                    campaigns.append({
                        'id': hash(account_id) % 1000000,  # Simple ID generation
                        'name': f'Account {account_id[-6:]} Campaign',
                        'account_id': account_id,
                        'spend': float(metrics.get('spend', 0)),
                        'impressions': int(metrics.get('impressions', 0)),
                        'clicks': int(metrics.get('clicks', 0)),
                        'conversions': int(metrics.get('purchases', 0)),
                        'revenue': float(metrics.get('revenue', 0)),
                        'status': 'active',
                    })
                except Exception as e:
                    # Log error but continue with other accounts
                    print(f'Failed to fetch data for account {account_id}: {e}')
                    continue

    return Response({
        'daily_data': daily_data,
        'campaigns': campaigns,
        'mock': is_mock_mode,
        'account_ids': allowed_account_ids,
    })
