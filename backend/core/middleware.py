"""
Request logging middleware for comprehensive API logging
"""
import logging
import json
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log all incoming requests and outgoing responses
    """

    def process_request(self, request):
        """Log request details"""
        # Get request body for POST/PUT/PATCH
        body = None
        if request.method in ['POST', 'PUT', 'PATCH'] and request.body:
            try:
                body = json.loads(request.body.decode('utf-8'))
                # Mask sensitive data
                if 'password' in body:
                    body = {**body, 'password': '***MASKED***'}
                if 'password_confirm' in body:
                    body = {**body, 'password_confirm': '***MASKED***'}
            except:
                body = '<binary or invalid JSON>'

        # Check for authentication
        has_auth = 'HTTP_AUTHORIZATION' in request.META
        auth_type = None
        if has_auth:
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                auth_type = 'JWT Bearer'

        logger.info('=' * 80)
        logger.info(f'🌐 INCOMING REQUEST: {request.method} {request.path}')
        logger.info(f'Timestamp: {logger.makeRecord("", 0, "", 0, "", (), None).created}')
        logger.info(f'Method: {request.method}')
        logger.info(f'Path: {request.path}')
        logger.info(f'Query Params: {dict(request.GET)}')
        logger.info(f'Has Auth: {"✅ " + auth_type if has_auth else "❌ No auth"}')
        logger.info(f'Remote IP: {request.META.get("REMOTE_ADDR")}')
        if body:
            logger.info(f'Body: {json.dumps(body, indent=2)}')
        logger.info('=' * 80)

        return None

    def process_response(self, request, response):
        """Log response details"""
        emoji = '✅' if 200 <= response.status_code < 300 else '❌'

        logger.info('=' * 80)
        logger.info(f'{emoji} OUTGOING RESPONSE: {request.method} {request.path} - {response.status_code}')
        logger.info(f'Status: {response.status_code}')

        # Try to get response content
        if hasattr(response, 'content') and response['Content-Type'] == 'application/json':
            try:
                content = json.loads(response.content.decode('utf-8'))
                logger.info(f'Response Data: {json.dumps(content, indent=2)}')
            except:
                pass

        logger.info('=' * 80)

        return response
