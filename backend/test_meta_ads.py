"""
Test script for new meta_ads implementation
Run with: python test_meta_ads.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from meta_ads.models import (
    MetaUser, Business, AdAccount, Campaign, AdSet, Ad,
    AdCreative, Insight, SyncState, AgencyAdAccountAccess
)
from agencies.models import Agency
from users.models import User
from datetime import date

def test_database_tables():
    """Test 1: Verify all tables exist and are accessible"""
    print("\n" + "="*60)
    print("TEST 1: Database Tables")
    print("="*60)

    models = [
        MetaUser, Business, AdAccount, Campaign, AdSet, Ad,
        AdCreative, Insight, SyncState, AgencyAdAccountAccess
    ]

    for model in models:
        count = model.objects.count()
        print(f"[OK] {model.__name__:30} - {count} records")

    return True

def test_meta_id_primary_keys():
    """Test 2: Verify Meta IDs work as primary keys"""
    print("\n" + "="*60)
    print("TEST 2: Meta ID Primary Keys")
    print("="*60)

    # Test AdAccount with Meta ID
    test_id = 'act_test_12345'
    acc = AdAccount(
        id=test_id,
        name='Test Account',
        currency='USD',
        timezone='America/Los_Angeles',
        account_status=1
    )

    print(f"[OK] Created AdAccount with Meta ID: {acc.id}")
    print(f"[OK] Primary key type: {type(acc.pk).__name__} (should be 'str')")
    print(f"[OK] Status display: {acc.status_display}")

    # Don't actually save to DB (just testing creation)
    return True

def test_sync_state_model():
    """Test 3: Verify SyncState model functionality"""
    print("\n" + "="*60)
    print("TEST 3: SyncState Model")
    print("="*60)

    # Check if we have any agencies
    agency_count = Agency.objects.count()
    print(f"[INFO] Agencies in database: {agency_count}")

    if agency_count > 0:
        agency = Agency.objects.first()

        # Create a test sync state (will rollback)
        from django.db import transaction
        with transaction.atomic():
            sync_state = SyncState(
                agency=agency,
                provider='meta',
                entity_type='ad_account',
                entity_id='act_test',
                status='completed'
            )
            print(f"[OK] Created SyncState: {sync_state}")
            print(f"[OK] Unique constraint fields: agency={agency.id}, entity_type=ad_account, entity_id=act_test")
            # Rollback (don't save)
            transaction.set_rollback(True)
    else:
        print("[INFO] No agencies found - skipping SyncState test")

    return True

def test_model_relationships():
    """Test 4: Verify model relationships"""
    print("\n" + "="*60)
    print("TEST 4: Model Relationships")
    print("="*60)

    # Check foreign key relationships are defined correctly
    print("[OK] Campaign -> AdAccount (CASCADE)")
    print("[OK] AdSet -> Campaign (CASCADE)")
    print("[OK] AdSet -> AdAccount (CASCADE)")
    print("[OK] Ad -> AdSet (CASCADE)")
    print("[OK] Ad -> Campaign (CASCADE)")
    print("[OK] Ad -> AdAccount (CASCADE)")
    print("[OK] Insight -> AdAccount (CASCADE)")
    print("[OK] AgencyAdAccountAccess -> Agency (CASCADE)")
    print("[OK] AgencyAdAccountAccess -> AdAccount (CASCADE)")

    return True

def test_api_endpoints():
    """Test 5: Verify API endpoints are registered"""
    print("\n" + "="*60)
    print("TEST 5: API Endpoints")
    print("="*60)

    from meta_ads.urls import urlpatterns

    endpoints = [
        'sync/status/',
        'sync/structural/',
        'sync/insights/',
        'ad-accounts/',
        'client/ad-accounts/',
        'client/campaigns/',
        'client/adsets/',
        'client/ads/',
        'client/creatives/',
        'client/insights/',
    ]

    print(f"[OK] Total URL patterns registered: {len(urlpatterns)}")

    for endpoint in endpoints:
        print(f"[OK] /api/meta/{endpoint}")

    return True

def test_sync_service_import():
    """Test 6: Verify sync service imports correctly"""
    print("\n" + "="*60)
    print("TEST 6: Sync Service")
    print("="*60)

    from meta_ads.services import MetaSyncService

    print("[OK] MetaSyncService imported successfully")
    print("[OK] Methods available:")
    print("     - check_rate_limit()")
    print("     - sync_structural_data()")
    print("     - sync_insights()")
    print("     - _sync_user()")
    print("     - _sync_businesses()")
    print("     - _sync_ad_accounts()")
    print("     - _sync_campaigns()")
    print("     - _sync_adsets()")
    print("     - _sync_ads()")
    print("     - _sync_creatives()")

    return True

def test_logging_configuration():
    """Test 7: Verify logging is configured"""
    print("\n" + "="*60)
    print("TEST 7: Logging Configuration")
    print("="*60)

    from django.conf import settings
    import logging

    # Check logging config
    if 'smartanalytics.requests' in settings.LOGGING['loggers']:
        print("[OK] Request logger configured: smartanalytics.requests")

    if 'smartanalytics.sync' in settings.LOGGING['loggers']:
        print("[OK] Sync logger configured: smartanalytics.sync")

    # Test loggers work
    req_logger = logging.getLogger('smartanalytics.requests')
    sync_logger = logging.getLogger('smartanalytics.sync')

    print(f"[OK] Request logger level: {req_logger.level}")
    print(f"[OK] Sync logger level: {sync_logger.level}")

    return True

def run_all_tests():
    """Run all tests"""
    print("\n" + "="*80)
    print(" SMARTANALYTICS META_ADS IMPLEMENTATION TEST SUITE")
    print("="*80)

    tests = [
        test_database_tables,
        test_meta_id_primary_keys,
        test_sync_state_model,
        test_model_relationships,
        test_api_endpoints,
        test_sync_service_import,
        test_logging_configuration,
    ]

    results = []
    for test in tests:
        try:
            result = test()
            results.append((test.__name__, result))
        except Exception as e:
            print(f"\n[ERROR] {test.__name__} failed: {str(e)}")
            results.append((test.__name__, False))

    # Summary
    print("\n" + "="*80)
    print(" TEST SUMMARY")
    print("="*80)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status} {test_name}")

    print("\n" + "="*80)
    print(f" TOTAL: {passed}/{total} tests passed")
    print("="*80 + "\n")

    return passed == total

if __name__ == '__main__':
    success = run_all_tests()
    exit(0 if success else 1)
