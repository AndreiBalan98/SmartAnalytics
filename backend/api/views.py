from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from api.services import meta_service

@api_view(['GET'])
def health(request):
    """Public health check endpoint"""
    return Response({
        'status': 'ok',
        'service': 'meta-ads-backend',
        'mock_mode': settings.MOCK_META
    })


@api_view(['GET'])
def meta_status(request):
    """Check if Meta is connected"""
    if settings.MOCK_META:
        return Response({
            'connected': True,
            'mock': True,
            'account_name': 'Mock Business Manager'
        })
    
    # Check if we have a real token
    token = meta_service.get_access_token()
    if token:
        return Response({
            'connected': True,
            'mock': False
        })
    
    return Response({
        'connected': False,
        'mock': False
    })


@api_view(['POST'])
def exchange_code(request):
    """Exchange OAuth code for access token"""
    code = request.data.get('code')
    redirect_uri = request.data.get('redirect_uri')
    
    if not code or not redirect_uri:
        return Response({
            'error': 'code and redirect_uri required'
        }, status=400)
    
    try:
        result = meta_service.exchange_code_for_token(code, redirect_uri)
        return Response(result)
    except Exception as e:
        return Response({
            'error': 'Failed to exchange code',
            'message': str(e)
        }, status=400)


@api_view(['GET'])
def meta_ad_accounts(request):
    """Get list of ad accounts"""
    if settings.MOCK_META:
        return Response({
            'data': [
                {
                    'id': 'act_123456789',
                    'name': 'Mock Ad Account 1',
                    'currency': 'USD'
                },
                {
                    'id': 'act_987654321',
                    'name': 'Mock Ad Account 2',
                    'currency': 'EUR'
                },
                {
                    'id': 'act_555555555',
                    'name': 'Mock Ad Account 3',
                    'currency': 'RON'
                }
            ]
        })
    
    # Real Meta API call
    try:
        accounts = meta_service.get_ad_accounts()
        return Response({'data': accounts})
    except Exception as e:
        return Response({
            'error': 'Failed to fetch ad accounts',
            'message': str(e)
        }, status=400)


@api_view(['GET'])
def meta_insights(request):
    """Get insights for selected ad account"""
    account_id = request.GET.get('account_id')
    
    if not account_id:
        return Response({'error': 'account_id required'}, status=400)
    
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
    
    # Real Meta API call
    try:
        insights = meta_service.get_insights(account_id)
        return Response(insights)
    except Exception as e:
        return Response({
            'error': 'Failed to fetch insights',
            'message': str(e)
        }, status=400)