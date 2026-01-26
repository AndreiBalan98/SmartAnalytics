#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from meta_ads.models import Insight
import json

print('Checking what Meta API returns in insights...\n')

for level in ['account', 'campaign', 'adset', 'ad']:
    insights = Insight.objects.filter(level=level)[:1]
    if insights.exists():
        insight = insights.first()
        print(f'{level.upper()} level insight:')
        print(f'  object_id in DB: {insight.object_id}')
        print(f'  raw data keys: {list(insight.raw.keys()) if insight.raw else "None"}')
        if insight.raw:
            # Print relevant ID fields
            for key in ['ad_id', 'adset_id', 'campaign_id', 'account_id']:
                if key in insight.raw:
                    print(f'    {key}: {insight.raw[key]}')
        print()
