from django.urls import path
from . import views

urlpatterns = [
    # Get all integrations status
    path('status/', views.get_integrations_status, name='integrations_status'),

    # Meta Ads
    path('meta/exchange-code/', views.exchange_meta_code, name='exchange_meta_code'),
    path('meta/ad-accounts/', views.get_meta_ad_accounts, name='meta_ad_accounts'),
    path('meta/insights/', views.get_meta_insights, name='meta_insights'),
    path('meta/sync/', views.sync_meta_data, name='meta_sync'),
]