"""URL routing for Meta Ads API"""
from django.urls import path
from . import views

urlpatterns = [
    # Agency sync endpoints
    path('sync/status/', views.sync_status, name='meta_sync_status'),
    path('sync/structural/', views.trigger_structural_sync, name='meta_sync_structural'),
    path('sync/insights/', views.trigger_insights_sync, name='meta_sync_insights'),
    path('ad-accounts/', views.get_ad_accounts, name='meta_ad_accounts'),

    # Client dashboard endpoints
    path('client/ad-accounts/', views.client_ad_accounts, name='meta_client_ad_accounts'),
    path('client/campaigns/', views.client_campaigns, name='meta_client_campaigns'),
    path('client/adsets/', views.client_adsets, name='meta_client_adsets'),
    path('client/ads/', views.client_ads, name='meta_client_ads'),
    path('client/creatives/', views.client_creatives, name='meta_client_creatives'),
    path('client/insights/', views.client_insights, name='meta_client_insights'),
    path('client/insights/aggregate/', views.client_insights_aggregate, name='meta_client_insights_aggregate'),
]
