from django.contrib import admin
from .models import SystemLog


@admin.register(SystemLog)
class SystemLogAdmin(admin.ModelAdmin):
    """Admin interface for system logs"""

    list_display = ['created_at', 'level', 'logger_name', 'short_message', 'funcname']
    list_filter = ['level', 'logger_name', 'created_at']
    search_fields = ['message', 'logger_name', 'funcname']
    readonly_fields = [
        'level', 'logger_name', 'message', 'pathname',
        'lineno', 'funcname', 'exc_info', 'created_at'
    ]
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

    def short_message(self, obj):
        """Display first 100 characters of message"""
        return obj.message[:100] + ('...' if len(obj.message) > 100 else '')
    short_message.short_description = 'Message'

    def has_add_permission(self, request):
        """Prevent manual creation of logs"""
        return False

    def has_change_permission(self, request, obj=None):
        """Prevent editing logs"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Allow deletion for cleanup"""
        return True
