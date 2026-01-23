"""
Test script for system logs API endpoints
"""
import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import logging
from rest_framework.test import APIClient
from users.models import User
from agencies.models import Agency

def test_logs_api():
    """Test the system logs API endpoints"""

    print("=" * 80)
    print("TESTING SYSTEM LOGS API")
    print("=" * 80)

    # Create test user and agency
    print("\n1. Setting up test user...")
    user = User.objects.filter(email='test_agency@example.com').first()
    if not user:
        user = User.objects.create_user(
            email='test_agency@example.com',
            password='testpass123',
            user_type='agency'
        )
        print("   Created new test user")
    else:
        print("   Using existing test user")

    # Ensure agency exists
    agency = Agency.objects.filter(owner=user).first()
    if not agency:
        agency = Agency.objects.create(
            name='Test Agency',
            owner=user
        )
        print("   Created new test agency")

    # Generate some test logs
    print("\n2. Generating test logs...")
    logger = logging.getLogger('smartanalytics.sync')
    logger.info("Test sync started")
    logger.warning("Test warning message")
    logger.error("Test error message")
    print("   Generated 3 test logs")

    # Login to get token
    print("\n3. Getting authentication token...")
    client = APIClient()
    response = client.post('/api/auth/login/', {
        'email': 'test_agency@example.com',
        'password': 'testpass123'
    })

    if response.status_code == 200:
        token = response.data['access']
        print("   [OK] Authenticated successfully")
    else:
        print(f"   [FAIL] Login failed: {response.data}")
        return

    # Set authorization header
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    # Test GET /api/system/logs/
    print("\n4. Testing GET /api/system/logs/...")
    response = client.get('/api/system/logs/')

    if response.status_code == 200:
        data = response.data
        print(f"   [OK] Status: {response.status_code}")
        print(f"   Total logs: {data['pagination']['total_count']}")
        print(f"   Logs returned: {len(data['logs'])}")
        print(f"   Available loggers: {', '.join(data['filters']['available_loggers'][:5])}")

        # Show recent logs
        if data['logs']:
            print("\n   Recent logs:")
            for log in data['logs'][:5]:
                print(f"   [{log['level']}] {log['logger_name']} - {log['message'][:60]}")
    else:
        print(f"   [FAIL] Status: {response.status_code}")
        print(f"   Error: {response.data}")

    # Test filtering by level
    print("\n5. Testing filtering by level (ERROR)...")
    response = client.get('/api/system/logs/?level=ERROR')

    if response.status_code == 200:
        data = response.data
        print(f"   [OK] Found {data['pagination']['total_count']} ERROR logs")
    else:
        print(f"   [FAIL] Status: {response.status_code}")

    # Test filtering by logger
    print("\n6. Testing filtering by logger (smartanalytics.sync)...")
    response = client.get('/api/system/logs/?logger_name=smartanalytics.sync')

    if response.status_code == 200:
        data = response.data
        print(f"   [OK] Found {data['pagination']['total_count']} sync logs")
    else:
        print(f"   [FAIL] Status: {response.status_code}")

    # Test pagination
    print("\n7. Testing pagination (page_size=5)...")
    response = client.get('/api/system/logs/?page_size=5&page=1')

    if response.status_code == 200:
        data = response.data
        print(f"   [OK] Page 1 of {data['pagination']['total_pages']}")
        print(f"   Returned {len(data['logs'])} logs (max 5)")
    else:
        print(f"   [FAIL] Status: {response.status_code}")

    # Test search
    print("\n8. Testing search (search='test')...")
    response = client.get('/api/system/logs/?search=test')

    if response.status_code == 200:
        data = response.data
        print(f"   [OK] Found {data['pagination']['total_count']} logs matching 'test'")
    else:
        print(f"   [FAIL] Status: {response.status_code}")

    print("\n" + "=" * 80)
    print("API TESTS COMPLETE")
    print("=" * 80)

    print("\n[INFO] You can now access logs via:")
    print("  GET /api/system/logs/")
    print("  GET /api/system/logs/?level=ERROR")
    print("  GET /api/system/logs/?logger_name=smartanalytics.sync")
    print("  GET /api/system/logs/?search=keyword")
    print("  DELETE /api/system/logs/clear/?days=30")


if __name__ == '__main__':
    test_logs_api()
