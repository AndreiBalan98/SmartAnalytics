from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('bigboss/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/oauth/', include('oauth.urls')),
    path('api/meta/', include('meta.urls')),
    path('api/system/', include('core.urls')),
]
