from django.urls import path, include

urlpatterns = [
    # Authentication & User Management
    path('api/', include('users.urls')),

    # Integrations
    path('api/integrations/', include('integrations.urls')),

    # Meta Ads (new)
    path('api/meta/', include('meta_ads.urls')),

    # Legacy API (to be migrated)
    path('', include('api.urls')),
]