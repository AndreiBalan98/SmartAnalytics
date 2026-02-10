from django.contrib import admin
from .models import MetaBusiness, MetaAccount, MetaCampaign, MetaAdset, MetaAd, MetaInsight


@admin.register(MetaBusiness)
class MetaBusinessAdmin(admin.ModelAdmin):
    list_display = ['name', 'business_id', 'user', 'created_at']
    search_fields = ['name', 'business_id', 'user__email']


@admin.register(MetaAccount)
class MetaAccountAdmin(admin.ModelAdmin):
    list_display = ['name', 'account_id', 'user', 'status', 'currency']
    list_filter = ['status', 'currency']
    search_fields = ['name', 'account_id', 'user__email']


@admin.register(MetaCampaign)
class MetaCampaignAdmin(admin.ModelAdmin):
    list_display = ['name', 'campaign_id', 'account', 'status', 'objective']
    list_filter = ['status', 'objective']
    search_fields = ['name', 'campaign_id']


@admin.register(MetaAdset)
class MetaAdsetAdmin(admin.ModelAdmin):
    list_display = ['name', 'adset_id', 'campaign', 'status', 'optimization_goal']
    list_filter = ['status']
    search_fields = ['name', 'adset_id']


@admin.register(MetaAd)
class MetaAdAdmin(admin.ModelAdmin):
    list_display = ['name', 'ad_id', 'adset', 'status']
    list_filter = ['status']
    search_fields = ['name', 'ad_id']


@admin.register(MetaInsight)
class MetaInsightAdmin(admin.ModelAdmin):
    list_display = ['date', 'level', 'object_id', 'spend', 'impressions', 'clicks']
    list_filter = ['level', 'date']
    search_fields = ['object_id']
    date_hierarchy = 'date'
