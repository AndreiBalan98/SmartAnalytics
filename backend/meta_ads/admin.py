"""Admin configuration for Meta Ads models"""
from django.contrib import admin
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


@admin.register(MetaUser)
class MetaUserAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'created_at')
    search_fields = ('id', 'name', 'email')
    readonly_fields = ('id', 'created_at')


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'owner', 'created_at')
    search_fields = ('id', 'name')
    list_filter = ('created_at',)
    readonly_fields = ('id', 'created_at')


@admin.register(AdAccount)
class AdAccountAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'business', 'currency', 'status_display', 'updated_at')
    search_fields = ('id', 'name')
    list_filter = ('account_status', 'currency', 'created_at')
    readonly_fields = ('id', 'created_at', 'updated_at')
    raw_id_fields = ('business',)


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'ad_account', 'objective', 'status', 'updated_at')
    search_fields = ('id', 'name')
    list_filter = ('status', 'objective', 'buying_type', 'created_at')
    readonly_fields = ('id', 'created_at', 'updated_at')
    raw_id_fields = ('ad_account',)


@admin.register(AdSet)
class AdSetAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'campaign', 'status', 'daily_budget', 'updated_at')
    search_fields = ('id', 'name')
    list_filter = ('status', 'optimization_goal', 'created_at')
    readonly_fields = ('id', 'created_at', 'updated_at')
    raw_id_fields = ('campaign', 'ad_account')


@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'adset', 'campaign', 'status', 'effective_status', 'updated_at')
    search_fields = ('id', 'name')
    list_filter = ('status', 'effective_status', 'created_at')
    readonly_fields = ('id', 'created_at', 'updated_at')
    raw_id_fields = ('adset', 'campaign', 'ad_account')


@admin.register(AdCreative)
class AdCreativeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'ad_account', 'has_image', 'has_video', 'updated_at')
    search_fields = ('id', 'name')
    list_filter = ('created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    raw_id_fields = ('ad_account',)

    def has_image(self, obj):
        return bool(obj.image_url)
    has_image.boolean = True

    def has_video(self, obj):
        return bool(obj.video_url)
    has_video.boolean = True


@admin.register(Insight)
class InsightAdmin(admin.ModelAdmin):
    list_display = ('id', 'level', 'object_id', 'ad_account', 'date_start', 'date_stop', 'created_at')
    search_fields = ('object_id',)
    list_filter = ('level', 'date_start', 'created_at')
    readonly_fields = ('id', 'created_at')
    raw_id_fields = ('ad_account',)


@admin.register(SyncState)
class SyncStateAdmin(admin.ModelAdmin):
    list_display = ('id', 'agency', 'entity_type', 'entity_id', 'status', 'last_synced_at', 'updated_at')
    search_fields = ('entity_id', 'agency__name')
    list_filter = ('entity_type', 'status', 'provider', 'last_synced_at')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('agency',)


@admin.register(AgencyAdAccountAccess)
class AgencyAdAccountAccessAdmin(admin.ModelAdmin):
    list_display = ('id', 'agency', 'ad_account', 'granted_at')
    search_fields = ('agency__name', 'ad_account__name')
    list_filter = ('granted_at',)
    readonly_fields = ('granted_at',)
    raw_id_fields = ('agency', 'ad_account')
