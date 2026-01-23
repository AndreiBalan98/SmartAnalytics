# Database Logging - SmartAnalytics

## Overview

Toate logurile backend-ului sunt acum stocate în baza de date PostgreSQL în tabela `core_systemlog`.

## Features

✅ **Automatic Logging**
- Toate logurile (INFO, WARNING, ERROR, CRITICAL) sunt scrise automat în database
- Logurile apar atât în consolă cât și în database
- Funcționează pentru toate logger-ele: django, smartanalytics.requests, smartanalytics.sync, etc.

✅ **Database Model: SystemLog**
```python
class SystemLog(models.Model):
    level = models.CharField(max_length=10)  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    logger_name = models.CharField(max_length=255)  # e.g., 'smartanalytics.sync'
    message = models.TextField()  # Log message content
    pathname = models.CharField(max_length=500)  # File path where log originated
    lineno = models.IntegerField()  # Line number in file
    funcname = models.CharField(max_length=255)  # Function name
    exc_info = models.TextField()  # Exception traceback (if any)
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp
```

✅ **Django Admin Interface**
- Accessible at: `/admin/core/systemlog/`
- View, search, and filter logs
- Delete old logs for cleanup
- Cannot edit or create logs manually (read-only + delete)

✅ **REST API Endpoints**
- `GET /api/system/logs/` - Get logs with filtering and pagination
- `DELETE /api/system/logs/clear/?days=30` - Delete logs older than X days

## API Usage

### Get Logs (with filtering)

```bash
# Get all logs (paginated)
GET /api/system/logs/

# Filter by level
GET /api/system/logs/?level=ERROR

# Filter by logger name
GET /api/system/logs/?logger_name=smartanalytics.sync

# Search in message content
GET /api/system/logs/?search=Meta

# Pagination
GET /api/system/logs/?page=2&page_size=100

# Combine filters
GET /api/system/logs/?level=ERROR&logger_name=smartanalytics.sync&page=1&page_size=50
```

**Response Format:**
```json
{
  "logs": [
    {
      "id": 123,
      "level": "INFO",
      "logger_name": "smartanalytics.sync",
      "message": "SYNC COMPLETED: 5 campaigns, 12 ad sets, 25 ads",
      "pathname": "D:\\...\\sync_service.py",
      "lineno": 145,
      "funcname": "sync_structural_data",
      "exc_info": "",
      "created_at": "2026-01-24T00:53:47.610000"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total_pages": 5,
    "total_count": 234
  },
  "filters": {
    "available_loggers": [
      "smartanalytics.sync",
      "smartanalytics.requests",
      "django.request"
    ],
    "levels": ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
  }
}
```

### Delete Old Logs

```bash
# Delete logs older than 30 days (default)
DELETE /api/system/logs/clear/

# Delete logs older than 7 days
DELETE /api/system/logs/clear/?days=7

# Delete logs older than 90 days
DELETE /api/system/logs/clear/?days=90
```

**Response Format:**
```json
{
  "message": "Deleted 1234 logs older than 30 days",
  "deleted_count": 1234,
  "cutoff_date": "2025-12-25T00:53:47.610000"
}
```

## Authentication

Both endpoints require JWT authentication with **agency user** permissions:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://your-backend.onrender.com/api/system/logs/
```

## Configuration

### Logging Settings (backend/config/settings.py)

```python
LOGGING = {
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'database': {
            'class': 'core.logging_handler.DatabaseLogHandler',
            'formatter': 'verbose',
            'level': 'INFO',  # Only log INFO and above to database
        },
    },
    'loggers': {
        'smartanalytics.sync': {
            'handlers': ['console', 'database'],
            'level': 'INFO',
        },
        'smartanalytics.requests': {
            'handlers': ['console', 'database'],
            'level': 'INFO',
        },
        # ... other loggers
    },
}
```

### Custom Logging Handler

Implementation: `backend/core/logging_handler.py`

```python
class DatabaseLogHandler(logging.Handler):
    def emit(self, record):
        """Write log record to database"""
        SystemLog.objects.create(
            level=record.levelname,
            logger_name=record.name,
            message=self.format(record),
            pathname=record.pathname,
            lineno=record.lineno,
            funcname=record.funcName,
            exc_info=exc_info,
        )
```

## Usage Examples

### In Your Code

```python
import logging

logger = logging.getLogger('smartanalytics.sync')

# These will be logged to both console and database
logger.info("Sync started for agency: Test Agency")
logger.warning("Rate limit approaching (90% used)")
logger.error("Failed to sync ad account act_123456")

# Log with exception traceback
try:
    sync_data()
except Exception as e:
    logger.error("Sync failed with exception", exc_info=True)
```

### Testing

Run the test script:
```bash
cd backend
python test_database_logging.py
```

Expected output:
```
================================================================================
TESTING DATABASE LOGGING
================================================================================

1. Initial test logs in database: 0

2. Writing test logs...

3. Checking database...

4. Total test logs in database: 4
   New logs created: 4

5. [OK] Database logging is WORKING!

   Recent logs:
   [ERROR] 2026-01-24 00:53:47 - Test ERROR with exception
   [ERROR] 2026-01-24 00:53:47 - Test ERROR log - something went wrong
   [WARNING] 2026-01-24 00:53:47 - Test WARNING log - potential issue detected
   [INFO] 2026-01-24 00:53:47 - Test INFO log - database logging working!
```

## Maintenance

### Cleanup Old Logs

Set up a scheduled task to delete old logs periodically:

```python
# In a management command or cron job
from core.models import SystemLog
from datetime import datetime, timedelta

# Delete logs older than 30 days
cutoff_date = datetime.now() - timedelta(days=30)
deleted = SystemLog.objects.filter(created_at__lt=cutoff_date).delete()
print(f"Deleted {deleted[0]} old logs")
```

Or use the API endpoint:
```bash
curl -X DELETE -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-backend.onrender.com/api/system/logs/clear/?days=30
```

### Monitor Database Size

Check log count:
```python
from core.models import SystemLog

total = SystemLog.objects.count()
print(f"Total logs: {total}")

# Breakdown by level
for level in ['INFO', 'WARNING', 'ERROR', 'CRITICAL']:
    count = SystemLog.objects.filter(level=level).count()
    print(f"{level}: {count}")
```

## Performance Considerations

1. **Database Writes**: Each log creates a database write. For high-traffic apps, consider:
   - Only logging INFO and above (not DEBUG)
   - Using async database handler
   - Batch writes

2. **Storage**: Logs can grow quickly. Recommendations:
   - Delete logs older than 30-90 days
   - Monitor database size
   - Consider log rotation

3. **Indexes**: The model has indexes on:
   - `level`
   - `logger_name`
   - `created_at`
   - Combined index on `(created_at, level)`

## Files Created

1. `backend/core/models.py` - SystemLog model
2. `backend/core/logging_handler.py` - Custom database handler
3. `backend/core/views.py` - API endpoints
4. `backend/core/urls.py` - URL routing
5. `backend/core/admin.py` - Django admin interface
6. `backend/config/settings.py` - Updated LOGGING configuration
7. `backend/test_database_logging.py` - Test script

## Migration

Migration created: `backend/core/migrations/0001_initial.py`

To apply in other environments:
```bash
python manage.py migrate core
```

## Security

- Only **agency users** can view and delete logs
- Logs are read-only in admin (cannot edit)
- API requires JWT authentication
- Permission checks enforce agency-only access

## Future Enhancements (Optional)

- [ ] Real-time log streaming via WebSocket
- [ ] Log analytics dashboard in frontend
- [ ] Email alerts for CRITICAL errors
- [ ] Export logs to CSV/JSON
- [ ] Async database handler for better performance
- [ ] Log aggregation and statistics
- [ ] Automatic cleanup cron job

---

**Status**: ✅ Implemented and Working
**Date**: 2026-01-24
**Test Results**: All tests passing
