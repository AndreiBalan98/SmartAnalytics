from django.urls import path
from . import views

urlpatterns = [
    # Agency endpoints
    path('accounts/', views.get_ad_accounts, name='meta_accounts'),
    path('sync/structural/', views.trigger_structural_sync, name='structural_sync'),
    path('sync/insights/', views.trigger_insights_sync, name='insights_sync'),

    # Lead Ads - Agency
    path('pages/', views.get_pages, name='meta_pages'),
    path('lead-forms/', views.get_lead_forms, name='meta_lead_forms'),
    path('sync/leads-structural/', views.trigger_leads_structural_sync, name='leads_structural_sync'),
    path('sync/leads/', views.trigger_leads_sync, name='leads_sync'),

    # Client endpoints
    path('client/accounts/', views.client_ad_accounts, name='client_accounts'),
    path('client/campaigns/', views.client_campaigns, name='client_campaigns'),
    path('client/adsets/', views.client_adsets, name='client_adsets'),
    path('client/ads/', views.client_ads, name='client_ads'),
    path('client/insights/', views.client_insights, name='client_insights'),

    # Lead Ads - Client
    path('client/leads/', views.client_leads, name='client_leads'),
]
