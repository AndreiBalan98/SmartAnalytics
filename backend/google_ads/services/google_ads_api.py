import requests
import logging
import time
from django.conf import settings

logger = logging.getLogger('google_ads')

GOOGLE_ADS_API_VERSION = 'v17'
GOOGLE_ADS_API_BASE = f'https://googleads.googleapis.com/{GOOGLE_ADS_API_VERSION}'


class GoogleAdsAPIClient:
    def __init__(self, access_token, developer_token=None):
        self.access_token = access_token
        self.developer_token = developer_token or getattr(settings, 'GOOGLE_ADS_DEVELOPER_TOKEN', '')

    def _headers(self):
        return {
            'Authorization': f'Bearer {self.access_token}',
            'developer-token': self.developer_token,
            'Content-Type': 'application/json',
        }

    def _request(self, method, url, json_data=None, retries=3):
        for attempt in range(retries):
            try:
                response = requests.request(
                    method, url,
                    headers=self._headers(),
                    json=json_data,
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

    def get_accessible_customers(self):
        """Get list of customer IDs accessible by the authenticated user."""
        url = f'{GOOGLE_ADS_API_BASE}/customers:listAccessibleCustomers'
        result = self._request('GET', url)
        # Returns {"resourceNames": ["customers/1234567890", ...]}
        resource_names = result.get('resourceNames', [])
        return [name.split('/')[-1] for name in resource_names]

    def _search(self, customer_id, query):
        """Execute a GAQL query against a customer account."""
        url = f'{GOOGLE_ADS_API_BASE}/customers/{customer_id}/googleAds:searchStream'
        result = self._request('POST', url, json_data={'query': query})
        # searchStream returns a list of result batches
        rows = []
        if isinstance(result, list):
            for batch in result:
                rows.extend(batch.get('results', []))
        elif isinstance(result, dict):
            rows.extend(result.get('results', []))
        return rows

    def get_customer_info(self, customer_id):
        """Get customer (account) details."""
        query = """
            SELECT
                customer.id,
                customer.descriptive_name,
                customer.currency_code,
                customer.time_zone,
                customer.status,
                customer.manager
            FROM customer
            LIMIT 1
        """
        rows = self._search(customer_id, query)
        if rows:
            return rows[0].get('customer', {})
        return None

    def get_campaigns(self, customer_id):
        """Get all campaigns for a customer."""
        query = """
            SELECT
                campaign.id,
                campaign.name,
                campaign.status,
                campaign.advertising_channel_type,
                campaign_budget.amount_micros
            FROM campaign
            ORDER BY campaign.id
        """
        rows = self._search(customer_id, query)
        campaigns = []
        for row in rows:
            campaign = row.get('campaign', {})
            budget = row.get('campaignBudget', {})
            budget_micros = budget.get('amountMicros', '0')
            budget_amount = str(int(budget_micros) / 1_000_000) if budget_micros else ''
            campaigns.append({
                'id': str(campaign.get('id', '')),
                'name': campaign.get('name', ''),
                'status': campaign.get('status', ''),
                'type': campaign.get('advertisingChannelType', ''),
                'daily_budget': budget_amount,
            })
        return campaigns

    def get_ad_groups(self, customer_id):
        """Get all ad groups for a customer."""
        query = """
            SELECT
                ad_group.id,
                ad_group.name,
                ad_group.status,
                ad_group.campaign
            FROM ad_group
            ORDER BY ad_group.id
        """
        rows = self._search(customer_id, query)
        ad_groups = []
        for row in rows:
            ag = row.get('adGroup', {})
            # campaign resource name: "customers/{id}/campaigns/{id}"
            campaign_resource = ag.get('campaign', '')
            campaign_id = campaign_resource.split('/')[-1] if campaign_resource else ''
            ad_groups.append({
                'id': str(ag.get('id', '')),
                'name': ag.get('name', ''),
                'status': ag.get('status', ''),
                'campaign_id': campaign_id,
            })
        return ad_groups

    def get_ads(self, customer_id):
        """Get all ads for a customer."""
        query = """
            SELECT
                ad_group_ad.ad.id,
                ad_group_ad.ad.name,
                ad_group_ad.ad.type,
                ad_group_ad.status,
                ad_group_ad.ad_group,
                ad_group.campaign
            FROM ad_group_ad
            ORDER BY ad_group_ad.ad.id
        """
        rows = self._search(customer_id, query)
        ads = []
        for row in rows:
            ad_group_ad = row.get('adGroupAd', {})
            ad = ad_group_ad.get('ad', {})
            ad_group = row.get('adGroup', {})
            # ad_group resource name: "customers/{id}/adGroups/{id}"
            ad_group_resource = ad_group_ad.get('adGroup', '')
            ad_group_id = ad_group_resource.split('/')[-1] if ad_group_resource else ''
            campaign_resource = ad_group.get('campaign', '')
            campaign_id = campaign_resource.split('/')[-1] if campaign_resource else ''
            ads.append({
                'id': str(ad.get('id', '')),
                'name': ad.get('name', ''),
                'status': ad_group_ad.get('status', ''),
                'ad_type': ad.get('type', ''),
                'ad_group_id': ad_group_id,
                'campaign_id': campaign_id,
            })
        return ads

    def get_insights(self, customer_id, start_date, end_date, resource_type='customer'):
        """Get performance metrics for a date range.
        resource_type: 'customer', 'campaign', 'ad_group', 'ad_group_ad'
        """
        date_from = start_date.strftime('%Y-%m-%d')
        date_to = end_date.strftime('%Y-%m-%d')

        if resource_type == 'customer':
            query = f"""
                SELECT
                    segments.date,
                    metrics.cost_micros,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.average_cpc,
                    metrics.ctr,
                    metrics.conversions,
                    metrics.conversions_value
                FROM customer
                WHERE segments.date BETWEEN '{date_from}' AND '{date_to}'
                ORDER BY segments.date
            """
        elif resource_type == 'campaign':
            query = f"""
                SELECT
                    segments.date,
                    campaign.id,
                    metrics.cost_micros,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.average_cpc,
                    metrics.ctr,
                    metrics.conversions,
                    metrics.conversions_value
                FROM campaign
                WHERE segments.date BETWEEN '{date_from}' AND '{date_to}'
                ORDER BY segments.date
            """
        elif resource_type == 'ad_group':
            query = f"""
                SELECT
                    segments.date,
                    ad_group.id,
                    metrics.cost_micros,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.average_cpc,
                    metrics.ctr,
                    metrics.conversions,
                    metrics.conversions_value
                FROM ad_group
                WHERE segments.date BETWEEN '{date_from}' AND '{date_to}'
                ORDER BY segments.date
            """
        elif resource_type == 'ad_group_ad':
            query = f"""
                SELECT
                    segments.date,
                    ad_group_ad.ad.id,
                    metrics.cost_micros,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.average_cpc,
                    metrics.ctr,
                    metrics.conversions,
                    metrics.conversions_value
                FROM ad_group_ad
                WHERE segments.date BETWEEN '{date_from}' AND '{date_to}'
                ORDER BY segments.date
            """
        else:
            return []

        rows = self._search(customer_id, query)
        insights = []
        for row in rows:
            segments = row.get('segments', {})
            metrics = row.get('metrics', {})
            cost_micros = int(metrics.get('costMicros', 0))
            impressions = int(metrics.get('impressions', 0))

            # Determine object_id based on resource type
            if resource_type == 'customer':
                object_id = customer_id
            elif resource_type == 'campaign':
                object_id = str(row.get('campaign', {}).get('id', ''))
            elif resource_type == 'ad_group':
                object_id = str(row.get('adGroup', {}).get('id', ''))
            elif resource_type == 'ad_group_ad':
                object_id = str(row.get('adGroupAd', {}).get('ad', {}).get('id', ''))
            else:
                object_id = ''

            # Calculate CPM
            cpm = (cost_micros / impressions * 1000 / 1_000_000) if impressions > 0 else 0

            insights.append({
                'date': segments.get('date', ''),
                'object_id': object_id,
                'spend': cost_micros / 1_000_000,
                'impressions': impressions,
                'clicks': int(metrics.get('clicks', 0)),
                'cpc': int(metrics.get('averageCpc', 0)) / 1_000_000,
                'cpm': cpm,
                'ctr': float(metrics.get('ctr', 0)),
                'conversions': float(metrics.get('conversions', 0)),
                'conversion_value': float(metrics.get('conversionsValue', 0)),
            })
        return insights
