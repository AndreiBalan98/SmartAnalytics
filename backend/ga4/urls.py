from django.urls import path
from . import views

urlpatterns = [
    # Agency endpoints
    path('properties/', views.get_properties, name='ga4_properties'),
    path('sync/structural/', views.trigger_structural_sync, name='ga4_structural_sync'),
    path('sync/insights/', views.trigger_insights_sync, name='ga4_insights_sync'),

    # Client endpoints
    path('client/properties/', views.client_properties, name='ga4_client_properties'),
    path('client/insights/', views.client_insights, name='ga4_client_insights'),
]
