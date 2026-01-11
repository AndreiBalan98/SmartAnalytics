from django.urls import path, include

urlpatterns = [
    # Authentication & User Management
    path('api/', include('users.urls')),

    # Legacy API (to be migrated)
    path('', include('api.urls')),
]