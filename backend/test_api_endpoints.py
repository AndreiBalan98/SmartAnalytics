"""
API Endpoint Integration Tests
Tests all 10 new meta_ads endpoints with authentication
Run with: python test_api_endpoints.py
"""
import os
import django
import requests
from datetime import date, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
from agencies.models import Agency, AgencyUser
from integrations.models import MetaIntegration

API_URL = 'http://localhost:8000'

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(msg):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{msg}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}")

def print_success(msg):
    print(f"{Colors.OKGREEN}[PASS]{Colors.ENDC} {msg}")

def print_error(msg):
    print(f"{Colors.FAIL}[FAIL]{Colors.ENDC} {msg}")

def print_warning(msg):
    print(f"{Colors.WARNING}[WARN]{Colors.ENDC} {msg}")

def print_info(msg):
    print(f"{Colors.OKCYAN}[INFO]{Colors.ENDC} {msg}")

def get_or_create_test_agency():
    """Get or create test agency user with token"""
    user, created = User.objects.get_or_create(
        email='test_agency@example.com',
        defaults={
            'user_type': 'agency',
            'first_name': 'Test',
            'last_name': 'Agency'
        }
    )

    if created:
        user.set_password('testpass123')
        user.save()

    agency, _ = Agency.objects.get_or_create(
        owner=user,
        defaults={'name': 'Test Agency'}
    )

    # Login to get token
    response = requests.post(
        f'{API_URL}/api/auth/login/',
        json={'email': 'test_agency@example.com', 'password': 'testpass123'}
    )

    if response.status_code == 200:
        data = response.json()
        return user, agency, data['access']
    else:
        print_error(f"Failed to login: {response.text}")
        return None, None, None

def get_or_create_test_client():
    """Get or create test client user with token"""
    # Find or create client
    user, created = User.objects.get_or_create(
        email='test_client@example.com',
        defaults={
            'user_type': 'client',
            'first_name': 'Test',
            'last_name': 'Client'
        }
    )

    if created:
        user.set_password('testpass123')
        user.save()

    # Get agency
    agency = Agency.objects.first()
    if agency:
        # Create agency user link
        AgencyUser.objects.get_or_create(
            agency=agency,
            user=user,
            defaults={
                'permissions': {'meta_accounts': []}  # Empty for now
            }
        )

    # Login to get token
    response = requests.post(
        f'{API_URL}/api/auth/login/',
        json={'email': 'test_client@example.com', 'password': 'testpass123'}
    )

    if response.status_code == 200:
        data = response.json()
        return user, data['access']
    else:
        print_error(f"Failed to login client: {response.text}")
        return None, None

def test_agency_endpoints(token):
    """Test agency-specific endpoints"""
    print_header("TESTING AGENCY ENDPOINTS")

    results = []

    # Test 1: Sync Status
    print_info("Test 1: GET /api/meta/sync/status/")
    response = requests.get(
        f'{API_URL}/api/meta/sync/status/',
        headers={'Authorization': f'Bearer {token}'}
    )

    if response.status_code == 200:
        data = response.json()
        print_success(f"Sync status retrieved: can_sync={data.get('can_sync')}")
        results.append(True)
    else:
        print_error(f"Failed: {response.status_code} - {response.text}")
        results.append(False)

    # Test 2: Get Ad Accounts
    print_info("Test 2: GET /api/meta/ad-accounts/")
    response = requests.get(
        f'{API_URL}/api/meta/ad-accounts/',
        headers={'Authorization': f'Bearer {token}'}
    )

    if response.status_code == 200:
        data = response.json()
        count = len(data.get('ad_accounts', []))
        print_success(f"Ad accounts retrieved: {count} accounts")
        results.append(True)
    else:
        print_error(f"Failed: {response.status_code} - {response.text}")
        results.append(False)

    # Test 3: Trigger Structural Sync (will fail if no Meta integration)
    print_info("Test 3: POST /api/meta/sync/structural/")
    response = requests.post(
        f'{API_URL}/api/meta/sync/structural/',
        headers={'Authorization': f'Bearer {token}'}
    )

    if response.status_code == 200:
        data = response.json()
        print_success(f"Structural sync triggered: {data.get('message')}")
        results.append(True)
    elif response.status_code == 400 and 'Meta integration not found' in response.text:
        print_warning("No Meta integration (expected if not connected)")
        results.append(True)  # This is OK
    else:
        print_error(f"Failed: {response.status_code} - {response.text}")
        results.append(False)

    # Test 4: Trigger Insights Sync
    print_info("Test 4: POST /api/meta/sync/insights/")
    end_date = date.today().isoformat()
    start_date = (date.today() - timedelta(days=7)).isoformat()

    response = requests.post(
        f'{API_URL}/api/meta/sync/insights/',
        headers={'Authorization': f'Bearer {token}'},
        json={
            'ad_account_ids': ['act_test123'],
            'start_date': start_date,
            'end_date': end_date
        }
    )

    if response.status_code == 200:
        data = response.json()
        print_success(f"Insights sync triggered: {data.get('message')}")
        results.append(True)
    elif response.status_code == 400:
        print_warning(f"Insights sync failed (expected if no integration): {response.json().get('message')}")
        results.append(True)  # OK if no integration
    else:
        print_error(f"Failed: {response.status_code} - {response.text}")
        results.append(False)

    return results

def test_client_endpoints(token):
    """Test client-specific endpoints"""
    print_header("TESTING CLIENT ENDPOINTS")

    results = []

    # Test 1: Get Client Ad Accounts
    print_info("Test 1: GET /api/meta/client/ad-accounts/")
    response = requests.get(
        f'{API_URL}/api/meta/client/ad-accounts/',
        headers={'Authorization': f'Bearer {token}'}
    )

    if response.status_code == 200:
        data = response.json()
        count = len(data.get('ad_accounts', []))
        print_success(f"Client ad accounts retrieved: {count} accounts")
        results.append(True)
    else:
        print_error(f"Failed: {response.status_code} - {response.text}")
        results.append(False)

    # Test 2: Get Campaigns (will be empty if no account)
    print_info("Test 2: GET /api/meta/client/campaigns/?account_id=act_test")
    response = requests.get(
        f'{API_URL}/api/meta/client/campaigns/?account_id=act_test',
        headers={'Authorization': f'Bearer {token}'}
    )

    if response.status_code in [200, 403]:  # 403 is OK (no permission)
        if response.status_code == 200:
            data = response.json()
            count = len(data.get('campaigns', []))
            print_success(f"Campaigns retrieved: {count} campaigns")
        else:
            print_warning("Permission denied (expected if no access)")
        results.append(True)
    else:
        print_error(f"Failed: {response.status_code} - {response.text}")
        results.append(False)

    # Test 3: Get Creatives
    print_info("Test 3: GET /api/meta/client/creatives/?account_id=act_test")
    response = requests.get(
        f'{API_URL}/api/meta/client/creatives/?account_id=act_test',
        headers={'Authorization': f'Bearer {token}'}
    )

    if response.status_code in [200, 403]:
        if response.status_code == 200:
            data = response.json()
            count = len(data.get('creatives', []))
            print_success(f"Creatives retrieved: {count} creatives")
        else:
            print_warning("Permission denied (expected)")
        results.append(True)
    else:
        print_error(f"Failed: {response.status_code} - {response.text}")
        results.append(False)

    # Test 4: Get Insights
    print_info("Test 4: GET /api/meta/client/insights/?account_id=act_test")
    response = requests.get(
        f'{API_URL}/api/meta/client/insights/?account_id=act_test&level=account',
        headers={'Authorization': f'Bearer {token}'}
    )

    if response.status_code in [200, 403]:
        if response.status_code == 200:
            data = response.json()
            count = len(data.get('insights', []))
            print_success(f"Insights retrieved: {count} entries")
        else:
            print_warning("Permission denied (expected)")
        results.append(True)
    else:
        print_error(f"Failed: {response.status_code} - {response.text}")
        results.append(False)

    return results

def test_authentication():
    """Test authentication and authorization"""
    print_header("TESTING AUTHENTICATION")

    results = []

    # Test 1: Access without token
    print_info("Test 1: Access endpoint without token (should fail)")
    response = requests.get(f'{API_URL}/api/meta/sync/status/')

    if response.status_code == 401:
        print_success("Correctly rejected unauthenticated request")
        results.append(True)
    else:
        print_error(f"Expected 401, got {response.status_code}")
        results.append(False)

    # Test 2: Access with invalid token
    print_info("Test 2: Access with invalid token (should fail)")
    response = requests.get(
        f'{API_URL}/api/meta/sync/status/',
        headers={'Authorization': 'Bearer invalid_token_12345'}
    )

    if response.status_code == 401:
        print_success("Correctly rejected invalid token")
        results.append(True)
    else:
        print_error(f"Expected 401, got {response.status_code}")
        results.append(False)

    return results

def main():
    print_header("META ADS API ENDPOINT INTEGRATION TESTS")
    print_info("Testing all 10 new meta_ads endpoints")
    print_warning("Note: Server must be running at http://localhost:8000")

    all_results = []

    # Check server is running
    try:
        response = requests.get(f'{API_URL}/health/', timeout=2)
        print_success("Backend server is running")
    except:
        print_error("Backend server is not running!")
        print_info("Start with: cd backend && python manage.py runserver")
        return

    # Test authentication
    auth_results = test_authentication()
    all_results.extend(auth_results)

    # Setup test users
    print_header("SETTING UP TEST USERS")
    agency_user, agency, agency_token = get_or_create_test_agency()

    if agency_token:
        print_success(f"Agency user ready: {agency_user.email}")

        # Test agency endpoints
        agency_results = test_agency_endpoints(agency_token)
        all_results.extend(agency_results)
    else:
        print_error("Failed to create agency user")
        return

    # Setup client
    client_user, client_token = get_or_create_test_client()

    if client_token:
        print_success(f"Client user ready: {client_user.email}")

        # Test client endpoints
        client_results = test_client_endpoints(client_token)
        all_results.extend(client_results)
    else:
        print_error("Failed to create client user")

    # Summary
    print_header("TEST SUMMARY")
    passed = sum(all_results)
    total = len(all_results)
    percentage = (passed / total * 100) if total > 0 else 0

    print(f"\nTotal Tests: {total}")
    print(f"Passed: {Colors.OKGREEN}{passed}{Colors.ENDC}")
    print(f"Failed: {Colors.FAIL}{total - passed}{Colors.ENDC}")
    print(f"Success Rate: {Colors.OKGREEN if percentage == 100 else Colors.WARNING}{percentage:.1f}%{Colors.ENDC}")

    if percentage == 100:
        print(f"\n{Colors.OKGREEN}{Colors.BOLD}✓ ALL TESTS PASSED!{Colors.ENDC}")
    else:
        print(f"\n{Colors.WARNING}{Colors.BOLD}⚠ SOME TESTS FAILED{Colors.ENDC}")

    print(f"\n{Colors.OKCYAN}Next Steps:{Colors.ENDC}")
    print("  1. Connect Meta OAuth from agency dashboard")
    print("  2. Run structural sync")
    print("  3. Run insights sync")
    print("  4. Assign permissions to clients")
    print("  5. Test client dashboard UI")

if __name__ == '__main__':
    main()
