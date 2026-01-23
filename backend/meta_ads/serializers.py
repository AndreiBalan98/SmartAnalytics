"""Serializers for Meta Ads models"""
from rest_framework import serializers
from .models import (
    MetaUser,
    Business,
    AdAccount,
    Campaign,
    AdSet,
    Ad,
    AdCreative,
    Insight,
    SyncState,
    AgencyAdAccountAccess,
)


class MetaUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetaUser
        fields = ['id', 'name', 'email', 'created_at']


class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = ['id', 'name', 'created_at']


class AdAccountSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(read_only=True)

    class Meta:
        model = AdAccount
        fields = [
            'id', 'name', 'currency', 'timezone', 'account_status',
            'status_display', 'created_at', 'updated_at'
        ]


class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = [
            'id', 'ad_account', 'name', 'objective', 'status',
            'buying_type', 'created_at', 'updated_at'
        ]


class AdSetSerializer(serializers.ModelSerializer):
    campaign_name = serializers.CharField(source='campaign.name', read_only=True)

    class Meta:
        model = AdSet
        fields = [
            'id', 'campaign', 'campaign_name', 'ad_account', 'name',
            'daily_budget', 'lifetime_budget', 'optimization_goal',
            'status', 'start_time', 'end_time', 'created_at', 'updated_at'
        ]


class AdSerializer(serializers.ModelSerializer):
    adset_name = serializers.CharField(source='adset.name', read_only=True)
    campaign_name = serializers.CharField(source='campaign.name', read_only=True)

    class Meta:
        model = Ad
        fields = [
            'id', 'adset', 'adset_name', 'campaign', 'campaign_name',
            'ad_account', 'name', 'status', 'effective_status',
            'creative_id', 'created_at', 'updated_at'
        ]


class AdCreativeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdCreative
        fields = [
            'id', 'ad_account', 'name', 'object_story_spec',
            'image_url', 'video_url', 'created_at', 'updated_at'
        ]


class InsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insight
        fields = [
            'id', 'level', 'object_id', 'ad_account', 'date_start',
            'date_stop', 'metrics', 'created_at'
        ]


class SyncStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyncState
        fields = [
            'id', 'entity_type', 'entity_id', 'last_synced_at',
            'last_insight_date', 'status', 'error_message',
            'metadata', 'created_at', 'updated_at'
        ]


class AgencyAdAccountAccessSerializer(serializers.ModelSerializer):
    ad_account_name = serializers.CharField(source='ad_account.name', read_only=True)

    class Meta:
        model = AgencyAdAccountAccess
        fields = ['id', 'ad_account', 'ad_account_name', 'granted_at']
