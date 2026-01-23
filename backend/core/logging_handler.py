"""
Custom Django database logging handler
"""
import logging
from django.db import transaction


class DatabaseLogHandler(logging.Handler):
    """
    Custom logging handler that writes logs to the database.

    Usage: Add to Django LOGGING configuration
    """

    def emit(self, record):
        """
        Write log record to database
        """
        try:
            # Import here to avoid circular imports at startup
            from core.models import SystemLog

            # Extract exception info if present
            exc_info = ''
            if record.exc_info:
                exc_info = self.format(record)

            # Create log entry (use transaction to avoid issues during request handling)
            with transaction.atomic():
                SystemLog.objects.create(
                    level=record.levelname,
                    logger_name=record.name,
                    message=self.format(record),
                    pathname=record.pathname,
                    lineno=record.lineno,
                    funcname=record.funcName,
                    exc_info=exc_info,
                )
        except Exception:
            # Silently fail - we don't want logging failures to crash the app
            # You could optionally log this to a file or syslog
            self.handleError(record)
