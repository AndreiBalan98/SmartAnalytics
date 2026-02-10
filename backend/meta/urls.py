from django.urls import path
from . import views

urlpatterns = [
    # Agency endpoints
    path('accounts/', views.get_ad_accounts, name='meta_accounts'),
    path('sync/structural/', views.trigger_structural_sync, name='structural_sync'),
    path('sync/insights/', views.trigger_insights_sync, name='insights_sync'),

    # Client endpoints
    path('client/accounts/', views.client_ad_accounts, name='client_accounts'),
    path('client/campaigns/', views.client_campaigns, name='client_campaigns'),
    path('client/adsets/', views.client_adsets, name='client_adsets'),
    path('client/ads/', views.client_ads, name='client_ads'),
    path('client/insights/', views.client_insights, name='client_insights'),
]
