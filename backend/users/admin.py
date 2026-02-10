from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, ClientPermissions


class ClientPermissionsInline(admin.StackedInline):
    model = ClientPermissions
    can_delete = False


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'user_type', 'is_active', 'is_staff', 'date_joined']
    list_filter = ['user_type', 'is_active', 'is_staff']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    inlines = [ClientPermissionsInline]

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'user_type', 'agency_name', 'agency', 'dark_mode')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
        ('Dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'user_type'),
        }),
    )


@admin.register(ClientPermissions)
class ClientPermissionsAdmin(admin.ModelAdmin):
    list_display = ['user', 'meta_accounts_ids', 'google_accounts_ids', 'ga4_properties_ids']
    search_fields = ['user__email']
