from django.urls import path
from . import views

urlpatterns = [
    # Get all integrations status
    path('status/', views.get_integrations_status, name='integrations_status'),
    
    # Meta Ads
    path('meta/connect/', views.connect_meta, name='connect_meta'),
    path('meta/ad-accounts/', views.get_meta_ad_accounts, name='meta_ad_accounts'),
]