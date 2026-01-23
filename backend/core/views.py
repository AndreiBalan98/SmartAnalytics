from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.paginator import Paginator
from .models import SystemLog


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_system_logs(request):
    """
    Get system logs with filtering and pagination

    Query params:
    - level: Filter by log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    - logger_name: Filter by logger name
    - page: Page number (default 1)
    - page_size: Items per page (default 50, max 200)
    - search: Search in message content
    """
    # Check if user is agency owner (only agency can view logs)
    if request.user.user_type != 'agency':
        return Response({'error': 'Only agency users can view system logs'}, status=403)

    # Get query parameters
    level = request.query_params.get('level')
    logger_name = request.query_params.get('logger_name')
    search = request.query_params.get('search')
    page = int(request.query_params.get('page', 1))
    page_size = min(int(request.query_params.get('page_size', 50)), 200)

    # Build query
    logs = SystemLog.objects.all()

    if level:
        logs = logs.filter(level=level.upper())

    if logger_name:
        logs = logs.filter(logger_name=logger_name)

    if search:
        logs = logs.filter(message__icontains=search)

    # Order by most recent
    logs = logs.order_by('-created_at')

    # Paginate
    paginator = Paginator(logs, page_size)
    page_obj = paginator.get_page(page)

    # Serialize data
    logs_data = [
        {
            'id': log.id,
            'level': log.level,
            'logger_name': log.logger_name,
            'message': log.message,
            'pathname': log.pathname,
            'lineno': log.lineno,
            'funcname': log.funcname,
            'exc_info': log.exc_info,
            'created_at': log.created_at.isoformat(),
        }
        for log in page_obj
    ]

    # Get unique logger names for filtering
    unique_loggers = SystemLog.objects.values_list('logger_name', flat=True).distinct()

    return Response({
        'logs': logs_data,
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count,
        },
        'filters': {
            'available_loggers': list(unique_loggers),
            'levels': ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'],
        }
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_old_logs(request):
    """
    Delete logs older than specified days

    Query params:
    - days: Delete logs older than X days (default 30)
    """
    # Check if user is agency owner
    if request.user.user_type != 'agency':
        return Response({'error': 'Only agency users can delete logs'}, status=403)

    from datetime import datetime, timedelta

    days = int(request.query_params.get('days', 30))
    cutoff_date = datetime.now() - timedelta(days=days)

    deleted_count = SystemLog.objects.filter(created_at__lt=cutoff_date).delete()[0]

    return Response({
        'message': f'Deleted {deleted_count} logs older than {days} days',
        'deleted_count': deleted_count,
        'cutoff_date': cutoff_date.isoformat(),
    })
