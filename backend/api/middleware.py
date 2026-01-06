from django.http import JsonResponse
from django.conf import settings

class APIKeyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only check /internal/* endpoints
        if request.path.startswith('/internal/'):
            api_key = request.headers.get('X-API-KEY')
            if api_key != settings.INTERNAL_API_KEY:
                return JsonResponse({
                    'error': 'Unauthorized',
                    'message': 'Invalid or missing API key'
                }, status=401)
        
        return self.get_response(request)