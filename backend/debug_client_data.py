"""
Debug script to check client permissions and available data.
Run with: python manage.py shell < debug_client_data.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from agencies.models import AgencyUser
from metrics.models import DailyMetric

User = get_user_model()

print("\n" + "=" * 80)
print("CLIENT DATA DIAGNOSTICS")
print("=" * 80)

# 1. Check all client users
print("\n[1] CLIENT USERS:")
clients = User.objects.filter(user_type='client')
print(f"Total clients: {clients.count()}")

for client in clients:
    print(f"\n  User: {client.email} (ID: {client.id})")

    # Check agency membership
    agency_users = AgencyUser.objects.filter(user=client, is_active=True)
    print(f"  Active memberships: {agency_users.count()}")

    for au in agency_users:
        print(f"    Agency: {au.agency.name}")
        print(f"    Permissions: {au.permissions}")
        meta_accounts = au.permissions.get('meta_accounts', [])
        print(f"    Meta Accounts: {meta_accounts}")

# 2. Check DailyMetric data
print("\n[2] DAILY METRICS IN DATABASE:")
total_metrics = DailyMetric.objects.count()
print(f"Total metrics: {total_metrics}")

if total_metrics > 0:
    # Group by account_id
    accounts = DailyMetric.objects.values_list('account_id', flat=True).distinct()
    print(f"Unique accounts: {len(accounts)}")

    for account_id in accounts:
        count = DailyMetric.objects.filter(account_id=account_id).count()
        print(f"  {account_id}: {count} metrics")

        # Show sample
        sample = DailyMetric.objects.filter(account_id=account_id).first()
        if sample:
            print(f"    Sample: date={sample.date}, spend={sample.spend}, platform={sample.platform}")
else:
    print("  WARNING: No metrics found in database!")
    print("  You need to run 'Sync Data' from Agency Dashboard first.")

# 3. Check for permission mismatches
print("\n[3] PERMISSION MISMATCHES:")
clients = User.objects.filter(user_type='client')

for client in clients:
    agency_users = AgencyUser.objects.filter(user=client, is_active=True)

    for au in agency_users:
        meta_accounts = au.permissions.get('meta_accounts', [])

        if not meta_accounts:
            print(f"  {client.email}: NO PERMISSIONS SET")
        else:
            # Check which accounts exist in DB
            available_accounts = set(DailyMetric.objects.values_list('account_id', flat=True).distinct())
            permitted_accounts = set(meta_accounts)

            print(f"\n  {client.email}:")
            print(f"    Permitted accounts: {permitted_accounts}")
            print(f"    Available in DB: {available_accounts}")

            # Check for matches
            matches = permitted_accounts.intersection(available_accounts)
            missing = permitted_accounts.difference(available_accounts)

            if matches:
                print(f"    ✅ Matching accounts: {matches}")

                # Count metrics for matching accounts
                for account_id in matches:
                    count = DailyMetric.objects.filter(account_id=account_id).count()
                    print(f"       {account_id}: {count} metrics")

            if missing:
                print(f"    ❌ Permitted but missing in DB: {missing}")

            if not matches and meta_accounts:
                print(f"    ⚠️ NO DATA MATCH - Client has permissions but no data!")

# 4. Check Meta integration
print("\n[4] META INTEGRATION STATUS:")
from integrations.models import MetaIntegration
from agencies.models import Agency

agencies = Agency.objects.all()
for agency in agencies:
    print(f"\n  Agency: {agency.name}")

    meta = MetaIntegration.objects.filter(agency=agency).first()
    if meta:
        print(f"    Meta connected: YES")
        print(f"    Business name: {meta.business_name}")
        print(f"    Last synced: {meta.last_synced_at}")
    else:
        print(f"    Meta connected: NO")

print("\n" + "=" * 80)
print("DIAGNOSTICS COMPLETE")
print("=" * 80 + "\n")
