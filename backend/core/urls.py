from django.urls import path
from . import views

urlpatterns = [
    path('logs/', views.get_system_logs, name='system-logs'),
    path('logs/clear/', views.clear_old_logs, name='clear-logs'),
]
