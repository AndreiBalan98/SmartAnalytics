from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db.models import Sum, Avg, Count
from datetime import datetime, timedelta
from agencies.models import Agency, AgencyUser
from metrics.models import DailyMetric
from .serializers import (
    AgencySignupSerializer,
    ClientCreationSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token view that includes user info in response.
    """
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def agency_signup(request):
    """
    Agency signup endpoint.
    Creates a new agency user and automatically creates an Agency entity.
    """
    serializer = AgencySignupSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()

        # Automatically create an Agency for this user
        agency_name = request.data.get('agency_name', f"{user.get_full_name()}'s Agency")
        agency = Agency.objects.create(
            name=agency_name,
            owner=user,
            email=user.email
        )

        return Response({
            'message': 'Agency account created successfully',
            'user': UserSerializer(user).data,
            'agency': {
                'id': agency.id,
                'name': agency.name
            }
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_client(request):
    """
    Endpoint for agencies to create client users.
    Only accessible by agency users.
    Creates a client user and links them to the agency with permissions.
    """

    # Verify user is an agency owner
    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can create clients'
        }, status=status.HTTP_403_FORBIDDEN)

    # Get the agency owned by this user
    try:
        agency = Agency.objects.get(owner=request.user)
    except Agency.DoesNotExist:
        return Response({
            'error': 'No agency found for this user'
        }, status=status.HTTP_404_NOT_FOUND)

    serializer = ClientCreationSerializer(data=request.data)

    if serializer.is_valid():
        client_user = serializer.save()

        # Get permissions from request (optional)
        permissions = request.data.get('permissions', {})

        # Create AgencyUser relationship
        agency_user = AgencyUser.objects.create(
            agency=agency,
            user=client_user,
            permissions=permissions
        )

        response_data = {
            'message': 'Client created successfully',
            'user': UserSerializer(client_user).data,
            'agency_user_id': agency_user.id
        }

        # Include generated password if it was auto-generated
        if hasattr(client_user, '_generated_password'):
            response_data['temporary_password'] = client_user._generated_password
            response_data['note'] = 'Send this temporary password to the client securely'

        return Response(response_data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Get current authenticated user information.
    """
    serializer = UserSerializer(request.user)
    user_data = serializer.data

    # Add agency information if user is agency owner
    if request.user.user_type == 'agency':
        try:
            agency = Agency.objects.get(owner=request.user)
            user_data['agency'] = {
                'id': agency.id,
                'name': agency.name,
                'email': agency.email
            }
        except Agency.DoesNotExist:
            user_data['agency'] = None

    # Add agency memberships if user is a client
    elif request.user.user_type == 'client':
        memberships = AgencyUser.objects.filter(user=request.user, is_active=True)
        user_data['agencies'] = [
            {
                'agency_id': membership.agency.id,
                'agency_name': membership.agency.name,
                'permissions': membership.permissions
            }
            for membership in memberships
        ]

    return Response(user_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_agency_clients(request):
    """
    List all clients for the authenticated agency user.
    """

    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        agency = Agency.objects.get(owner=request.user)
    except Agency.DoesNotExist:
        return Response({
            'error': 'No agency found for this user'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get all clients linked to this agency
    agency_users = AgencyUser.objects.filter(agency=agency).select_related('user')

    clients_data = [
        {
            'id': agency_user.id,
            'user': UserSerializer(agency_user.user).data,
            'permissions': agency_user.permissions,
            'is_active': agency_user.is_active,
            'invited_at': agency_user.invited_at
        }
        for agency_user in agency_users
    ]

    return Response({
        'agency': {
            'id': agency.id,
            'name': agency.name
        },
        'clients': clients_data,
        'total': len(clients_data)
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_client_permissions(request, client_id):
    """
    Update permissions for a specific client.
    Only accessible by agency owner.
    """

    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can update client permissions'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        agency = Agency.objects.get(owner=request.user)
    except Agency.DoesNotExist:
        return Response({
            'error': 'No agency found for this user'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get the AgencyUser relationship
    try:
        agency_user = AgencyUser.objects.get(id=client_id, agency=agency)
    except AgencyUser.DoesNotExist:
        return Response({
            'error': 'Client not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Update permissions
    new_permissions = request.data.get('permissions', {})
    agency_user.permissions = new_permissions
    agency_user.save()

    return Response({
        'message': 'Permissions updated successfully',
        'client_id': agency_user.id,
        'permissions': agency_user.permissions
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_client(request, client_id):
    """
    Remove a client from the agency (soft delete - set is_active=False).
    """

    if request.user.user_type != 'agency':
        return Response({
            'error': 'Only agency users can remove clients'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        agency = Agency.objects.get(owner=request.user)
    except Agency.DoesNotExist:
        return Response({
            'error': 'No agency found for this user'
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        agency_user = AgencyUser.objects.get(id=client_id, agency=agency)
    except AgencyUser.DoesNotExist:
        return Response({
            'error': 'Client not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Soft delete
    agency_user.is_active = False
    agency_user.save()

    return Response({
        'message': 'Client removed successfully'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_client_metrics(request):
    """
    Get metrics for a client user based on their permissions.
    Filters data by allowed ad accounts and date range.
    """

    # Verify user is a client
    if request.user.user_type != 'client':
        return Response({
            'error': 'Only client users can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)

    # Get client's agency membership
    try:
        agency_user = AgencyUser.objects.get(user=request.user, is_active=True)
    except AgencyUser.DoesNotExist:
        return Response({
            'error': 'No active agency membership found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get date range from query params
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')

    # Default to last 30 days if not provided
    if not end_date_str:
        end_date = datetime.now().date()
    else:
        try:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'error': 'Invalid end_date format. Use YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)

    if not start_date_str:
        start_date = end_date - timedelta(days=30)
    else:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'error': 'Invalid start_date format. Use YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)

    # Get allowed Meta ad accounts from permissions
    meta_accounts = agency_user.permissions.get('meta_accounts', [])

    # DEBUG: Log permissions and available metrics
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Client {request.user.email} permissions: {agency_user.permissions}")
    logger.info(f"Meta accounts from permissions: {meta_accounts}")

    # Check what accounts exist in DailyMetric
    available_accounts = DailyMetric.objects.filter(
        platform='meta',
        date__gte=start_date,
        date__lte=end_date
    ).values_list('account_id', flat=True).distinct()
    logger.info(f"Available accounts in DailyMetric: {list(available_accounts)}")

    if not meta_accounts:
        return Response({
            'message': 'No ad accounts assigned to this client',
            'debug': {
                'permissions': agency_user.permissions,
                'available_accounts': list(available_accounts),
            },
            'summary': {
                'total_spend': 0,
                'total_impressions': 0,
                'total_clicks': 0,
                'total_conversions': 0,
                'avg_ctr': 0,
                'avg_cpc': 0,
                'avg_cpm': 0,
            },
            'daily_data': [],
            'account_breakdown': []
        })

    # Query DailyMetric filtered by permissions and date range
    metrics = DailyMetric.objects.filter(
        platform='meta',
        account_id__in=meta_accounts,
        date__gte=start_date,
        date__lte=end_date
    ).order_by('date')

    logger.info(f"Found {metrics.count()} metrics for accounts {meta_accounts} between {start_date} and {end_date}")

    # Aggregate totals
    aggregates = metrics.aggregate(
        total_spend=Sum('spend'),
        total_impressions=Sum('impressions'),
        total_clicks=Sum('clicks'),
        total_conversions=Sum('conversions'),
        avg_ctr=Avg('ctr'),
        avg_cpc=Avg('cpc'),
        avg_cpm=Avg('cpm'),
    )

    # Daily breakdown (aggregate by date across all accounts)
    daily_metrics = {}
    for metric in metrics:
        date_str = metric.date.strftime('%Y-%m-%d')
        if date_str not in daily_metrics:
            daily_metrics[date_str] = {
                'date': date_str,
                'spend': 0,
                'impressions': 0,
                'clicks': 0,
                'conversions': 0,
            }
        daily_metrics[date_str]['spend'] += float(metric.spend)
        daily_metrics[date_str]['impressions'] += metric.impressions
        daily_metrics[date_str]['clicks'] += metric.clicks
        daily_metrics[date_str]['conversions'] += metric.conversions

    # Account breakdown (aggregate by account_id)
    account_metrics = {}
    for metric in metrics:
        account_id = metric.account_id
        if account_id not in account_metrics:
            account_metrics[account_id] = {
                'account_id': account_id,
                'spend': 0,
                'impressions': 0,
                'clicks': 0,
                'conversions': 0,
                'currency': metric.currency,
            }
        account_metrics[account_id]['spend'] += float(metric.spend)
        account_metrics[account_id]['impressions'] += metric.impressions
        account_metrics[account_id]['clicks'] += metric.clicks
        account_metrics[account_id]['conversions'] += metric.conversions

    # Calculate derived metrics for account breakdown
    for account_id, data in account_metrics.items():
        if data['impressions'] > 0:
            data['ctr'] = round((data['clicks'] / data['impressions']) * 100, 2)
            data['cpm'] = round((data['spend'] / data['impressions']) * 1000, 2)
        else:
            data['ctr'] = 0
            data['cpm'] = 0

        if data['clicks'] > 0:
            data['cpc'] = round(data['spend'] / data['clicks'], 2)
        else:
            data['cpc'] = 0

        # Round spend to 2 decimals
        data['spend'] = round(data['spend'], 2)

    return Response({
        'date_range': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
        },
        'summary': {
            'total_spend': round(float(aggregates['total_spend'] or 0), 2),
            'total_impressions': aggregates['total_impressions'] or 0,
            'total_clicks': aggregates['total_clicks'] or 0,
            'total_conversions': aggregates['total_conversions'] or 0,
            'avg_ctr': round(float(aggregates['avg_ctr'] or 0), 2),
            'avg_cpc': round(float(aggregates['avg_cpc'] or 0), 2),
            'avg_cpm': round(float(aggregates['avg_cpm'] or 0), 2),
        },
        'daily_data': sorted(daily_metrics.values(), key=lambda x: x['date']),
        'account_breakdown': list(account_metrics.values()),
        'debug': {
            'meta_accounts_from_permissions': meta_accounts,
            'metrics_count': metrics.count(),
            'date_range_requested': f"{start_date} to {end_date}"
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_client_data(request):
    """
    DEBUG endpoint to check client permissions and available data.
    """
    if request.user.user_type != 'client':
        return Response({'error': 'Only for client users'}, status=403)

    try:
        agency_user = AgencyUser.objects.get(user=request.user, is_active=True)
    except AgencyUser.DoesNotExist:
        return Response({'error': 'No agency membership'}, status=404)

    # Get all available accounts in DailyMetric
    all_accounts = list(DailyMetric.objects.values_list('account_id', flat=True).distinct())

    # Get metrics count per account
    metrics_per_account = {}
    for account_id in all_accounts:
        count = DailyMetric.objects.filter(account_id=account_id).count()
        metrics_per_account[account_id] = count

    return Response({
        'user': {
            'email': request.user.email,
            'user_type': request.user.user_type,
        },
        'agency': {
            'id': agency_user.agency.id,
            'name': agency_user.agency.name,
        },
        'permissions': agency_user.permissions,
        'meta_accounts_from_permissions': agency_user.permissions.get('meta_accounts', []),
        'database_info': {
            'all_accounts_in_daily_metric': all_accounts,
            'metrics_count_per_account': metrics_per_account,
            'total_metrics': DailyMetric.objects.count(),
        }
    })