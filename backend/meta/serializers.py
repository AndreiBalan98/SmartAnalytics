from rest_framework import serializers
from .models import MetaAccount, MetaCampaign, MetaAdset, MetaAd, MetaInsight


class MetaAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetaAccount
        fields = ['id', 'account_id', 'name', 'status', 'currency', 'timezone_offset_hours_utc']


class MetaCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetaCampaign
        fields = ['id', 'campaign_id', 'name', 'status', 'objective', 'daily_budget']


class MetaAdsetSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetaAdset
        fields = ['id', 'adset_id', 'name', 'status', 'optimization_goal', 'daily_budget']


class MetaAdSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetaAd
        fields = ['id', 'ad_id', 'name', 'status', 'creative']


class MetaInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetaInsight
        fields = ['id', 'date', 'level', 'object_id', 'spend', 'impressions', 'reach',
                  'clicks', 'cpc', 'cpm', 'ctr', 'actions', 'action_values']
