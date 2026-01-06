from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health, name='health'),
    path('internal/meta/status/', views.meta_status, name='meta_status'),
    path('internal/meta/exchange-code/', views.exchange_code, name='exchange_code'),
    path('internal/meta/ad-accounts/', views.meta_ad_accounts, name='meta_ad_accounts'),
    path('internal/meta/insights/', views.meta_insights, name='meta_insights'),
]