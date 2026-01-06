from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings

@api_view(['GET'])
def health(request):
    """Public health check endpoint"""
    return Response({
        'status': 'ok',
        'service': 'meta-ads-backend',
        'mock_mode': settings.MOCK_META
    })