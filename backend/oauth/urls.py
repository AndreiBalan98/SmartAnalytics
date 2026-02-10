from django.urls import path
from . import views

urlpatterns = [
    path('status/', views.get_oauth_status, name='oauth_status'),
    path('meta/start/', views.oauth_meta_start, name='oauth_meta_start'),
    path('meta/callback/', views.oauth_meta_callback, name='oauth_meta_callback'),
    path('google/start/', views.oauth_google_start, name='oauth_google_start'),
    path('google/callback/', views.oauth_google_callback, name='oauth_google_callback'),
    path('ga4/start/', views.oauth_ga4_start, name='oauth_ga4_start'),
    path('ga4/callback/', views.oauth_ga4_callback, name='oauth_ga4_callback'),
]
