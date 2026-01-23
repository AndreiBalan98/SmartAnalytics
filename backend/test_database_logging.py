"""
Test script for database logging functionality
"""
import os
import sys
import django
import logging

# Setup Django environment
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import SystemLog


def test_database_logging():
    """Test that logs are being written to database"""

    print("=" * 80)
    print("TESTING DATABASE LOGGING")
    print("=" * 80)

    # Clear existing test logs
    test_logs = SystemLog.objects.filter(logger_name='test_logger')
    initial_count = test_logs.count()
    print(f"\n1. Initial test logs in database: {initial_count}")

    # Create test logger
    logger = logging.getLogger('test_logger')

    # Write different log levels
    print("\n2. Writing test logs...")
    logger.info("Test INFO log - database logging working!")
    logger.warning("Test WARNING log - potential issue detected")
    logger.error("Test ERROR log - something went wrong")

    try:
        # Trigger an exception to test exc_info logging
        1 / 0
    except ZeroDivisionError:
        logger.error("Test ERROR with exception", exc_info=True)

    # Check database
    print("\n3. Checking database...")
    import time
    time.sleep(0.5)  # Give database time to write

    test_logs = SystemLog.objects.filter(logger_name='test_logger')
    new_count = test_logs.count()

    print(f"\n4. Total test logs in database: {new_count}")
    print(f"   New logs created: {new_count - initial_count}")

    if new_count > initial_count:
        print("\n5. [OK] Database logging is WORKING!")
        print("\n   Recent logs:")
        for log in test_logs.order_by('-created_at')[:4]:
            print(f"   [{log.level}] {log.created_at.strftime('%Y-%m-%d %H:%M:%S')} - {log.message[:60]}")
    else:
        print("\n5. [FAIL] Database logging FAILED - no new logs written")

    # Test other loggers
    print("\n6. Testing other loggers...")
    request_logger = logging.getLogger('smartanalytics.requests')
    request_logger.info("Test request log")

    sync_logger = logging.getLogger('smartanalytics.sync')
    sync_logger.info("Test sync log")

    all_logs = SystemLog.objects.all()
    print(f"\n7. Total logs in database: {all_logs.count()}")
    print(f"   Breakdown by logger:")
    for logger_name in SystemLog.objects.values_list('logger_name', flat=True).distinct():
        count = SystemLog.objects.filter(logger_name=logger_name).count()
        print(f"   - {logger_name}: {count}")

    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)


if __name__ == '__main__':
    test_database_logging()
