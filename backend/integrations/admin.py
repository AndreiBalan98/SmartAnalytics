from django.contrib import admin
from .models import (
    MetaIntegration,
    GoogleAdsIntegration,
    GA4Integration,
    OAuthState,
    MetaToken,
    GoogleToken,
    GA4Token,
)


# ==================================
# AGENCY-BASED INTEGRATIONS (EXISTING)
# ==================================

@admin.register(MetaIntegration)
class MetaIntegrationAdmin(admin.ModelAdmin):
    list_display = ('agency', 'business_name', 'business_id', 'expires_at', 'last_synced_at', 'created_at')
    list_filter = ('created_at', 'expires_at')
    search_fields = ('agency__name', 'business_name', 'business_id')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(GoogleAdsIntegration)
class GoogleAdsIntegrationAdmin(admin.ModelAdmin):
    list_display = ('agency', 'account_email', 'customer_id', 'expires_at', 'created_at')
    list_filter = ('created_at', 'expires_at')
    search_fields = ('agency__name', 'account_email', 'customer_id')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(GA4Integration)
class GA4IntegrationAdmin(admin.ModelAdmin):
    list_display = ('agency', 'property_name', 'property_id', 'expires_at', 'created_at')
    list_filter = ('created_at', 'expires_at')
    search_fields = ('agency__name', 'property_name', 'property_id')
    readonly_fields = ('created_at', 'updated_at')


# ==================================
# USER-BASED OAUTH TOKENS (NEW)
# ==================================

@admin.register(OAuthState)
class OAuthStateAdmin(admin.ModelAdmin):
    list_display = ('user', 'service_type', 'state_preview', 'expires_at', 'created_at')
    list_filter = ('service_type', 'created_at', 'expires_at')
    search_fields = ('user__email', 'state')
    readonly_fields = ('created_at',)

    def state_preview(self, obj):
        """Afișează primele 16 caractere din state"""
        return f"{obj.state[:16]}..." if obj.state else ""
    state_preview.short_description = 'State'


@admin.register(MetaToken)
class MetaTokenAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'name', 'meta_user_id', 'expiry_date', 'is_expired', 'created_at')
    list_filter = ('created_at', 'expiry_date')
    search_fields = ('user__email', 'name', 'meta_user_id')
    readonly_fields = ('created_at', 'updated_at')

    def user_email(self, obj):
        """Afișează email-ul user-ului"""
        return obj.user.email
    user_email.short_description = 'User Email'

    def is_expired(self, obj):
        """Afișează dacă token-ul a expirat"""
        return obj.is_token_expired()
    is_expired.boolean = True
    is_expired.short_description = 'Expired'


@admin.register(GoogleToken)
class GoogleTokenAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'name', 'user_openid', 'expiry_date', 'is_expired', 'created_at')
    list_filter = ('created_at', 'expiry_date')
    search_fields = ('user__email', 'name', 'user_openid')
    readonly_fields = ('created_at', 'updated_at')

    def user_email(self, obj):
        """Afișează email-ul user-ului"""
        return obj.user.email
    user_email.short_description = 'User Email'

    def is_expired(self, obj):
        """Afișează dacă token-ul a expirat"""
        return obj.is_token_expired()
    is_expired.boolean = True
    is_expired.short_description = 'Expired'


@admin.register(GA4Token)
class GA4TokenAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'name', 'user_openid', 'expiry_date', 'is_expired', 'created_at')
    list_filter = ('created_at', 'expiry_date')
    search_fields = ('user__email', 'name', 'user_openid')
    readonly_fields = ('created_at', 'updated_at')

    def user_email(self, obj):
        """Afișează email-ul user-ului"""
        return obj.user.email
    user_email.short_description = 'User Email'

    def is_expired(self, obj):
        """Afișează dacă token-ul a expirat"""
        return obj.is_token_expired()
    is_expired.boolean = True
    is_expired.short_description = 'Expired'
