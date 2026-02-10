from django.contrib import admin
from .models import OAuthState, MetaToken, GoogleToken, GA4Token, MetaUser, GoogleUser, GA4User


@admin.register(OAuthState)
class OAuthStateAdmin(admin.ModelAdmin):
    list_display = ['state', 'user', 'service_type', 'created_at', 'expires_at']
    list_filter = ['service_type']
    search_fields = ['user__email']


@admin.register(MetaToken)
class MetaTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'meta_user_id', 'name', 'created_at', 'expiry_date']
    search_fields = ['user__email', 'name']


@admin.register(GoogleToken)
class GoogleTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'google_user_id', 'name', 'created_at', 'expires_at']
    search_fields = ['user__email', 'name']


@admin.register(GA4Token)
class GA4TokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'google_user_id', 'name', 'created_at', 'expires_at']
    search_fields = ['user__email', 'name']


@admin.register(MetaUser)
class MetaUserAdmin(admin.ModelAdmin):
    list_display = ['user', 'meta_user_id', 'name', 'email', 'created_at']
    search_fields = ['user__email', 'name', 'meta_user_id']


@admin.register(GoogleUser)
class GoogleUserAdmin(admin.ModelAdmin):
    list_display = ['user', 'google_user_id', 'name', 'email', 'created_at']
    search_fields = ['user__email', 'name']


@admin.register(GA4User)
class GA4UserAdmin(admin.ModelAdmin):
    list_display = ['user', 'google_user_id', 'name', 'email', 'created_at']
    search_fields = ['user__email', 'name']
