from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Agency signup
    path('auth/agency/signup/', views.agency_signup, name='agency_signup'),

    # Client management
    path('clients/create/', views.create_client, name='create_client'),
    path('clients/', views.list_agency_clients, name='list_clients'),
    path('clients/<int:client_id>/permissions/', views.update_client_permissions, name='update_client_permissions'),
    path('clients/<int:client_id>/', views.remove_client, name='remove_client'),

    # User info
    path('me/', views.get_current_user, name='current_user'),
]