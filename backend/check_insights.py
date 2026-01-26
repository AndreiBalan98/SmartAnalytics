#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from meta_ads.models import Insight
from django.db.models import Count

print('Insights by level:')
for level_count in Insight.objects.values('level').annotate(count=Count('id')).order_by('level'):
    print(f"  {level_count['level']}: {level_count['count']}")

print('\nSample insights per level:')
for level in ['account', 'campaign', 'adset', 'ad']:
    count = Insight.objects.filter(level=level).count()
    if count > 0:
        sample = Insight.objects.filter(level=level).first()
        print(f"\n{level.upper()} ({count} total):")
        print(f"  object_id: {sample.object_id}")
        print(f"  date_start: {sample.date_start}")
        print(f"  ad_account_id: {sample.ad_account_id}")
    else:
        print(f"\n{level.upper()}: No insights found")
