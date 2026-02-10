from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('bigboss/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/oauth/', include('oauth.urls')),
    path('api/meta/', include('meta.urls')),
    path('api/google-ads/', include('google_ads.urls')),
    path('api/ga4/', include('ga4.urls')),
    path('api/system/', include('core.urls')),
]
