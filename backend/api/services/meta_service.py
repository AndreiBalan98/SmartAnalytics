import requests
from django.conf import settings
from api.models import MetaIntegration

GRAPH_API_VERSION = 'v21.0'
GRAPH_API_BASE = f'https://graph.facebook.com/{GRAPH_API_VERSION}'


def exchange_code_for_token(code: str, redirect_uri: str) -> dict:
    """
    Exchange authorization code for long-lived access token
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
    
    # Save or update token in database
    integration, created = MetaIntegration.objects.get_or_create(id=1)
    integration.access_token = data['access_token']
    integration.token_type = data.get('token_type', 'bearer')
    integration.save()
    
    return {
        'success': True,
        'created': created
    }


def get_access_token() -> str | None:
    """Get stored access token"""
    try:
        integration = MetaIntegration.objects.get(id=1)
        return integration.access_token
    except MetaIntegration.DoesNotExist:
        return None


def get_ad_accounts() -> list:
    """
    Fetch ad accounts from Meta Graph API
    """
    token = get_access_token()
    if not token:
        return []
    
    url = f'{GRAPH_API_BASE}/me/adaccounts'
    params = {
        'access_token': token,
        'fields': 'id,name,currency,account_status'
    }
    
    response = requests.get(url, params=params)
    response.raise_for_status()
    
    data = response.json()
    return data.get('data', [])


def get_insights(account_id: str, date_preset: str = 'last_7d') -> dict:
    """
    Fetch insights for a specific ad account
    """
    token = get_access_token()
    if not token:
        raise ValueError('No access token available')
    
    # Remove 'act_' prefix if present (Meta API accepts both formats)
    if account_id.startswith('act_'):
        account_id = account_id
    
    url = f'{GRAPH_API_BASE}/{account_id}/insights'
    params = {
        'access_token': token,
        'date_preset': date_preset,
        'fields': 'spend,impressions,clicks,actions,action_values',
        'level': 'account',
        'time_increment': 1
    }
    
    response = requests.get(url, params=params)
    response.raise_for_status()
    
    data = response.json()
    
    # Normalize metrics
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
        
        # Extract purchases and revenue from actions
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
            'roas': round(roas, 2)
        }
    }