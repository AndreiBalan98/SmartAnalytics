import requests
import logging
import time

logger = logging.getLogger('meta')

GRAPH_API_VERSION = 'v21.0'
GRAPH_API_BASE = f'https://graph.facebook.com/{GRAPH_API_VERSION}'


class MetaAPIClient:
    def __init__(self, access_token, test_mode=False, max_requests_per_hour=200):
        self.access_token = access_token
        self.test_mode = test_mode
        self.max_requests_per_hour = max_requests_per_hour
        self.request_count = 0

    def _request(self, method, endpoint, params=None, retries=3):
        if self.test_mode and self.request_count >= self.max_requests_per_hour:
            raise Exception(f'Rate limit reached: {self.request_count} requests')

        if self.test_mode and self.request_count >= self.max_requests_per_hour * 0.8:
            logger.warning(f'Approaching rate limit: {self.request_count}/{self.max_requests_per_hour}')

        url = f'{GRAPH_API_BASE}/{endpoint}' if not endpoint.startswith('http') else endpoint
        params = params or {}
        params['access_token'] = self.access_token

        for attempt in range(retries):
            try:
                response = requests.request(method, url, params=params, timeout=30)
                self.request_count += 1

                if response.status_code >= 500 and attempt < retries - 1:
                    wait = 2 ** attempt
                    logger.warning(f'Server error {response.status_code}, retrying in {wait}s...')
                    time.sleep(wait)
                    continue

                response.raise_for_status()
                return response.json()

            except requests.exceptions.Timeout:
                if attempt < retries - 1:
                    wait = 2 ** attempt
                    logger.warning(f'Timeout, retrying in {wait}s...')
                    time.sleep(wait)
                    continue
                raise

        raise Exception(f'Request failed after {retries} retries')

    def _paginate(self, endpoint, params=None):
        all_data = []
        result = self._request('GET', endpoint, params)
        all_data.extend(result.get('data', []))

        while result.get('paging', {}).get('next'):
            result = self._request('GET', result['paging']['next'])
            all_data.extend(result.get('data', []))

        return all_data

    def get_user_info(self):
        return self._request('GET', 'me', {'fields': 'id,name,email'})

    def get_businesses(self):
        return self._paginate('me/businesses', {'fields': 'id,name'})

    def get_ad_accounts(self):
        return self._paginate('me/adaccounts', {
            'fields': 'id,name,currency,timezone_name,account_status,business',
        })

    def get_campaigns(self, account_id):
        return self._paginate(f'{account_id}/campaigns', {
            'fields': 'id,name,objective,status,daily_budget,updated_time',
            'limit': 500,
        })

    def get_adsets(self, account_id):
        return self._paginate(f'{account_id}/adsets', {
            'fields': 'id,name,daily_budget,optimization_goal,status,campaign_id,updated_time',
            'limit': 500,
        })

    def get_ads_with_creatives(self, account_id):
        return self._paginate(f'{account_id}/ads', {
            'fields': 'id,name,status,campaign_id,adset_id,creative{id,name,status,body,title,image_url}',
            'limit': 500,
        })

    def get_insights(self, object_id, start_date, end_date):
        import json
        time_range = json.dumps({
            'since': start_date.isoformat(),
            'until': end_date.isoformat(),
        })
        return self._paginate(f'{object_id}/insights', {
            'time_range': time_range,
            'time_increment': 1,
            'fields': 'impressions,clicks,spend,reach,actions,action_values,cpc,cpm,ctr',
            'limit': 500,
        })
