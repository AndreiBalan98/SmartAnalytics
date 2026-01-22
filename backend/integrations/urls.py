from django.urls import path
from . import views, test_views

urlpatterns = [
    # Get all integrations status
    path('status/', views.get_integrations_status, name='integrations_status'),

    # Meta Ads
    path('meta/start/', views.start_meta_oauth, name='start_meta_oauth'),
    path('meta/exchange-code/', views.exchange_meta_code, name='exchange_meta_code'),
    path('meta/ad-accounts/', views.get_meta_ad_accounts, name='meta_ad_accounts'),
    path('meta/insights/', views.get_meta_insights, name='meta_insights'),
    path('meta/sync/', views.sync_meta_data, name='sync_meta_data'),

    # Meta API Testing Endpoints (Development Only)
    path('meta/test/users/', test_views.list_oauth_users, name='test_oauth_users'),
    path('meta/test/user-info/', test_views.test_user_info, name='test_user_info'),
    path('meta/test/businesses/', test_views.test_businesses, name='test_businesses'),
    path('meta/test/ad-accounts/', test_views.test_ad_accounts, name='test_ad_accounts'),
    path('meta/test/campaigns/', test_views.test_campaigns, name='test_campaigns'),
    path('meta/test/ad-sets/', test_views.test_ad_sets, name='test_ad_sets'),
    path('meta/test/ads/', test_views.test_ads, name='test_ads'),
    path('meta/test/creatives/', test_views.test_creatives, name='test_creatives'),
    path('meta/test/insights/', test_views.test_insights, name='test_insights'),
]