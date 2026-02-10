from django.urls import path
from . import views

urlpatterns = [
    # Agency endpoints
    path('accounts/', views.get_accounts, name='google_ads_accounts'),
    path('sync/structural/', views.trigger_structural_sync, name='google_ads_structural_sync'),
    path('sync/insights/', views.trigger_insights_sync, name='google_ads_insights_sync'),

    # Client endpoints
    path('client/accounts/', views.client_accounts, name='google_ads_client_accounts'),
    path('client/campaigns/', views.client_campaigns, name='google_ads_client_campaigns'),
    path('client/ad-groups/', views.client_ad_groups, name='google_ads_client_ad_groups'),
    path('client/ads/', views.client_ads, name='google_ads_client_ads'),
    path('client/insights/', views.client_insights, name='google_ads_client_insights'),
]
