"""
Custom Django database logging handler
"""
import logging
from django.db import connection


class DatabaseLogHandler(logging.Handler):
    """
    Custom logging handler that writes logs to the database.

    Usage: Add to Django LOGGING configuration

    NOTE: Silently fails if table doesn't exist (for production safety)
    """

    _table_checked = False
    _table_exists = False

    def emit(self, record):
        """
        Write log record to database
        """
        try:
            # Check if table exists (only once per process)
            if not self._table_checked:
                self._check_table_exists()
                self._table_checked = True

            # Skip if table doesn't exist
            if not self._table_exists:
                return

            # Import here to avoid circular imports at startup
            from core.models import SystemLog

            # Extract exception info if present
            exc_info = ''
            if record.exc_info:
                try:
                    exc_info = self.format(record)
                except Exception:
                    exc_info = str(record.exc_info)

            # Create log entry without transaction to avoid rolling back the request
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
            # This is critical for production stability
            pass

    def _check_table_exists(self):
        """Check if core_systemlog table exists"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_name = 'core_systemlog'
                    )
                """)
                self._table_exists = cursor.fetchone()[0]
        except Exception:
            self._table_exists = False
