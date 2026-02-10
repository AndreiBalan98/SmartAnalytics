from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/agency/signup/', views.agency_signup, name='agency_signup'),
    path('me/', views.get_current_user, name='current_user'),
    path('me/preferences/', views.update_user_preferences, name='update_preferences'),
    path('clients/create/', views.create_agency_client, name='create_client'),
    path('clients/', views.list_agency_clients, name='list_clients'),
    path('clients/<int:client_id>/permissions/', views.update_client_permissions, name='update_client_permissions'),
    path('clients/<int:client_id>/', views.remove_client, name='remove_client'),
]
