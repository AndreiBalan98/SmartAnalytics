"""
Request logging middleware
Logs all incoming requests and their responses
"""
import logging
import time

logger = logging.getLogger('smartanalytics.requests')


class RequestLoggingMiddleware:
    """Middleware to log all HTTP requests and responses"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Start timer
        start_time = time.time()

        # Get user info
        user = 'anonymous'
        if request.user and request.user.is_authenticated:
            user = request.user.email

        # Log incoming request
        logger.info(f'[{user}] {request.method} {request.path}')

        # Process request
        response = self.get_response(request)

        # Calculate duration
        duration = time.time() - start_time
        duration_ms = int(duration * 1000)

        # Log response
        logger.info(
            f'[{user}] {request.method} {request.path} '
            f'-> {response.status_code} ({duration_ms}ms)'
        )

        return response
