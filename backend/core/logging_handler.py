import logging
from django.db import connection


class DatabaseLogHandler(logging.Handler):
    _table_checked = False
    _table_exists = False

    def emit(self, record):
        try:
            if not self._table_checked:
                self._check_table_exists()
                self._table_checked = True

            if not self._table_exists:
                return

            from core.models import SystemLog

            exc_info = ''
            if record.exc_info:
                try:
                    exc_info = self.format(record)
                except Exception:
                    exc_info = str(record.exc_info)

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
            pass

    def _check_table_exists(self):
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_name = 'system_log'
                    )
                """)
                self._table_exists = cursor.fetchone()[0]
        except Exception:
            self._table_exists = False
