from django.db import models
from django.utils import timezone


class MetaIntegration(models.Model):
    """
    Stores Meta (Facebook) OAuth access tokens for an agency.
    Supports long-lived tokens (60-day validity).
    """

    agency = models.ForeignKey(
        'agencies.Agency',
        on_delete=models.CASCADE,
        related_name='meta_integrations'
    )

    access_token = models.TextField()
    token_type = models.CharField(max_length=50, default='bearer')
    expires_at = models.DateTimeField(null=True, blank=True)

    # Business Manager info
    business_id = models.CharField(max_length=100, blank=True)
    business_name = models.CharField(max_length=255, blank=True)

    # Token refresh tracking
    last_refreshed_at = models.DateTimeField(null=True, blank=True)

    # Data sync tracking
    last_synced_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'meta_integrations'
        verbose_name = 'Meta Integration'
        verbose_name_plural = 'Meta Integrations'

    def __str__(self):
        return f'Meta - {self.agency.name}'

    def is_token_expired(self):
        """Check if the access token has expired"""
        if not self.expires_at:
            return False
        return timezone.now() >= self.expires_at


class GoogleAdsIntegration(models.Model):
    """
    Stores Google Ads OAuth access tokens for an agency.
    """

    agency = models.ForeignKey(
        'agencies.Agency',
        on_delete=models.CASCADE,
        related_name='google_ads_integrations'
    )

    access_token = models.TextField()
    refresh_token = models.TextField()
    token_type = models.CharField(max_length=50, default='Bearer')
    expires_at = models.DateTimeField(null=True, blank=True)

    # Developer token (required for Google Ads API)
    developer_token = models.CharField(max_length=255, blank=True)

    # Customer ID (Google Ads account)
    customer_id = models.CharField(max_length=50, blank=True)

    # Google account email (from userinfo endpoint)
    account_email = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'google_ads_integrations'
        verbose_name = 'Google Ads Integration'
        verbose_name_plural = 'Google Ads Integrations'

    def __str__(self):
        return f'Google Ads - {self.agency.name}'

    def is_token_expired(self):
        """Check if the access token has expired"""
        if not self.expires_at:
            return False
        return timezone.now() >= self.expires_at


class GA4Integration(models.Model):
    """
    Stores Google Analytics 4 OAuth access tokens for an agency.
    """

    agency = models.ForeignKey(
        'agencies.Agency',
        on_delete=models.CASCADE,
        related_name='ga4_integrations'
    )

    access_token = models.TextField()
    refresh_token = models.TextField()
    token_type = models.CharField(max_length=50, default='Bearer')
    expires_at = models.DateTimeField(null=True, blank=True)

    # GA4 Property ID
    property_id = models.CharField(max_length=100, blank=True)
    property_name = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ga4_integrations'
        verbose_name = 'GA4 Integration'
        verbose_name_plural = 'GA4 Integrations'

    def __str__(self):
        return f'GA4 - {self.agency.name}'

    def is_token_expired(self):
        """Check if the access token has expired"""
        if not self.expires_at:
            return False
        return timezone.now() >= self.expires_at


# ========================================
# NEW OAUTH MODELS - USER-BASED TOKENS
# ========================================

class OAuthState(models.Model):
    """
    Stores OAuth state parameters for verification during callback.
    State is generated when initiating OAuth flow and verified on callback.
    """
    state = models.CharField(max_length=255, unique=True, db_index=True)
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='oauth_states'
    )
    service_type = models.CharField(
        max_length=50,
        choices=[
            ('meta', 'Meta'),
            ('google_ads', 'Google Ads'),
            ('ga4', 'Google Analytics 4'),
        ]
    )
    expires_at = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'oauth_states'
        verbose_name = 'OAuth State'
        verbose_name_plural = 'OAuth States'

    def __str__(self):
        return f'{self.service_type} - {self.user.email} - {self.state[:8]}...'

    def is_expired(self):
        """Check if the state has expired"""
        return timezone.now() >= self.expires_at


class MetaToken(models.Model):
    """
    Stores Meta (Facebook) OAuth tokens for individual users.
    Each user can have one active Meta connection.
    """
    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='meta_token',
        primary_key=True
    )
    token = models.TextField()
    scopes = models.JSONField(default=list)  # ['ads_read', 'business_management', 'leads_retrieval']
    expiry_date = models.DateTimeField(db_index=True)
    meta_user_id = models.CharField(max_length=255, db_index=True)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'meta_tokens'
        verbose_name = 'Meta Token'
        verbose_name_plural = 'Meta Tokens'

    def __str__(self):
        return f'Meta - {self.user.email} - {self.name}'

    def is_token_expired(self):
        """Check if the token has expired"""
        return timezone.now() >= self.expiry_date


class GoogleToken(models.Model):
    """
    Stores Google Ads OAuth tokens for individual users.
    Each user can have one active Google Ads connection.
    """
    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='google_token',
        primary_key=True
    )
    access_token = models.TextField()
    refresh_token = models.TextField()
    scopes = models.JSONField(default=list)  # ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/adwords']
    expiry_date = models.DateTimeField(db_index=True)
    user_openid = models.CharField(max_length=255, db_index=True)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'google_tokens'
        verbose_name = 'Google Token'
        verbose_name_plural = 'Google Tokens'

    def __str__(self):
        return f'Google Ads - {self.user.email} - {self.name}'

    def is_token_expired(self):
        """Check if the access token has expired"""
        return timezone.now() >= self.expiry_date


class GA4Token(models.Model):
    """
    Stores Google Analytics 4 OAuth tokens for individual users.
    Each user can have one active GA4 connection.
    """
    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='ga4_token',
        primary_key=True
    )
    access_token = models.TextField()
    refresh_token = models.TextField()
    scopes = models.JSONField(default=list)  # ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/analytics.readonly']
    expiry_date = models.DateTimeField(db_index=True)
    user_openid = models.CharField(max_length=255, db_index=True)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ga4_tokens'
        verbose_name = 'GA4 Token'
        verbose_name_plural = 'GA4 Tokens'

    def __str__(self):
        return f'GA4 - {self.user.email} - {self.name}'

    def is_token_expired(self):
        """Check if the access token has expired"""
        return timezone.now() >= self.expiry_date
