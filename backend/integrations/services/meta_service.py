"""
Meta Ads API service layer
Handles OAuth and API calls to Meta Graph API
"""

import requests
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from integrations.models import MetaIntegration

GRAPH_API_VERSION = 'v21.0'
GRAPH_API_BASE = f'https://graph.facebook.com/{GRAPH_API_VERSION}'


def exchange_code_for_token(code: str, redirect_uri: str, agency) -> dict:
    """
    Exchange authorization code for long-lived access token
    and save it for the agency
    """
    url = f'{GRAPH_API_BASE}/oauth/access_token'
    params = {
        'client_id': settings.META_APP_ID,
        'client_secret': settings.META_APP_SECRET,
        'redirect_uri': redirect_uri,
        'code': code,
    }
    
    response = requests.get(url, params=params)
    response.raise_for_status()
    
    data = response.json()
    access_token = data['access_token']
    
    # Get business info
    business_info = get_business_info(access_token)
    
    # Calculate expiration (Meta tokens are typically 60 days for long-lived)
    expires_at = timezone.now() + timedelta(days=60)
    
    # Create or update Meta integration for this agency
    integration, created = MetaIntegration.objects.update_or_create(
        agency=agency,
        defaults={
            'access_token': access_token,
            'token_type': data.get('token_type', 'bearer'),
            'expires_at': expires_at,
            'business_id': business_info.get('id', ''),
            'business_name': business_info.get('name', ''),
            'last_refreshed_at': timezone.now(),
        }
    )
    
    return {
        'success': True,
        'created': created,
        'business_name': business_info.get('name', ''),
    }


def get_business_info(access_token: str) -> dict:
    """
    Get basic business/user info from Meta
    """
    try:
        url = f'{GRAPH_API_BASE}/me'
        params = {
            'access_token': access_token,
            'fields': 'id,name',
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        return response.json()
    except Exception as e:
        print(f'Failed to get business info: {e}')
        return {}


def get_ad_accounts(agency) -> list:
    """
    Fetch ad accounts from Meta Graph API for the agency
    """
    try:
        integration = MetaIntegration.objects.get(agency=agency)
    except MetaIntegration.DoesNotExist:
        return []
    
    url = f'{GRAPH_API_BASE}/me/adaccounts'
    params = {
        'access_token': integration.access_token,
        'fields': 'id,name,currency,account_status',
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        return data.get('data', [])
    except Exception as e:
        print(f'Failed to fetch ad accounts: {e}')
        return []


def get_insights(agency, account_id: str, date_preset: str = 'last_7d') -> dict:
    """
    Fetch insights for a specific ad account
    """
    try:
        integration = MetaIntegration.objects.get(agency=agency)
    except MetaIntegration.DoesNotExist:
        raise ValueError('Meta integration not found for this agency')
    
    # Remove 'act_' prefix if present
    if account_id.startswith('act_'):
        account_id = account_id
    
    url = f'{GRAPH_API_BASE}/{account_id}/insights'
    params = {
        'access_token': integration.access_token,
        'date_preset': date_preset,
        'fields': 'spend,impressions,clicks,actions,action_values',
        'level': 'account',
        'time_increment': 1,
    }
    
    response = requests.get(url, params=params)
    response.raise_for_status()
    
    data = response.json()
    
    # Process insights
    insights = data.get('data', [])
    
    total_spend = 0
    total_impressions = 0
    total_clicks = 0
    total_purchases = 0
    total_revenue = 0
    
    for day in insights:
        total_spend += float(day.get('spend', 0))
        total_impressions += int(day.get('impressions', 0))
        total_clicks += int(day.get('clicks', 0))
        
        # Extract purchases and revenue
        actions = day.get('actions', [])
        for action in actions:
            if action.get('action_type') == 'offsite_conversion.fb_pixel_purchase':
                total_purchases += int(action.get('value', 0))
        
        action_values = day.get('action_values', [])
        for action_value in action_values:
            if action_value.get('action_type') == 'offsite_conversion.fb_pixel_purchase':
                total_revenue += float(action_value.get('value', 0))
    
    roas = (total_revenue / total_spend) if total_spend > 0 else 0
    
    return {
        'account_id': account_id,
        'date_range': date_preset,
        'metrics': {
            'spend': round(total_spend, 2),
            'impressions': total_impressions,
            'clicks': total_clicks,
            'purchases': total_purchases,
            'revenue': round(total_revenue, 2),
            'roas': round(roas, 2),
        }
    }