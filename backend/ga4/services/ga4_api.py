import requests
import logging
import time

logger = logging.getLogger('ga4')

GA4_ADMIN_API_BASE = 'https://analyticsadmin.googleapis.com/v1beta'
GA4_DATA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta'


class GA4APIClient:
    def __init__(self, access_token):
        self.access_token = access_token

    def _headers(self):
        return {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json',
        }

    def _request(self, method, url, json_data=None, params=None, retries=3):
        for attempt in range(retries):
            try:
                response = requests.request(
                    method, url,
                    headers=self._headers(),
                    json=json_data,
                    params=params,
                    timeout=30,
                )

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

    def get_accounts(self):
        """Get all GA4 accounts accessible by the user."""
        url = f'{GA4_ADMIN_API_BASE}/accounts'
        accounts = []
        page_token = None

        while True:
            params = {'pageSize': 200}
            if page_token:
                params['pageToken'] = page_token

            result = self._request('GET', url, params=params)
            for account in result.get('accounts', []):
                # Account name format: "accounts/123456"
                account_id = account.get('name', '').split('/')[-1]
                accounts.append({
                    'id': account_id,
                    'name': account.get('displayName', ''),
                })

            page_token = result.get('nextPageToken')
            if not page_token:
                break

        return accounts

    def get_properties(self, account_id):
        """Get all properties for a GA4 account."""
        url = f'{GA4_ADMIN_API_BASE}/properties'
        properties = []
        page_token = None

        while True:
            params = {
                'filter': f'parent:accounts/{account_id}',
                'pageSize': 200,
            }
            if page_token:
                params['pageToken'] = page_token

            result = self._request('GET', url, params=params)
            for prop in result.get('properties', []):
                # Property name format: "properties/123456"
                property_id = prop.get('name', '').split('/')[-1]
                properties.append({
                    'id': property_id,
                    'name': prop.get('displayName', ''),
                    'timezone': prop.get('timeZone', ''),
                    'currency': prop.get('currencyCode', ''),
                })

            page_token = result.get('nextPageToken')
            if not page_token:
                break

        return properties

    def run_report(self, property_id, start_date, end_date, dimensions=None):
        """Run a GA4 Data API report."""
        url = f'{GA4_DATA_API_BASE}/properties/{property_id}:runReport'

        date_from = start_date.strftime('%Y-%m-%d')
        date_to = end_date.strftime('%Y-%m-%d')

        dim_list = [{'name': 'date'}]
        if dimensions:
            for dim in dimensions:
                dim_list.append({'name': dim})

        body = {
            'dateRanges': [{'startDate': date_from, 'endDate': date_to}],
            'dimensions': dim_list,
            'metrics': [
                {'name': 'sessions'},
                {'name': 'totalUsers'},
                {'name': 'screenPageViews'},
                {'name': 'bounceRate'},
                {'name': 'conversions'},
                {'name': 'eventCount'},
                {'name': 'totalRevenue'},
            ],
            'limit': 10000,
        }

        result = self._request('POST', url, json_data=body)

        rows = []
        dimension_headers = [h.get('name') for h in result.get('dimensionHeaders', [])]
        metric_headers = [h.get('name') for h in result.get('metricHeaders', [])]

        for row in result.get('rows', []):
            dim_values = [v.get('value', '') for v in row.get('dimensionValues', [])]
            metric_values = [v.get('value', '0') for v in row.get('metricValues', [])]

            entry = {}
            for i, header in enumerate(dimension_headers):
                entry[header] = dim_values[i] if i < len(dim_values) else ''
            for i, header in enumerate(metric_headers):
                entry[header] = metric_values[i] if i < len(metric_values) else '0'

            rows.append(entry)

        return rows
