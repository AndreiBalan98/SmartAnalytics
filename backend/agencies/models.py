from django.db import models
from django.conf import settings


class Agency(models.Model):
    """
    Represents an advertising agency.
    Each agency is owned by a User with user_type='agency'.
    """

    name = models.CharField(max_length=255)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_agencies',
        limit_choices_to={'user_type': 'agency'}
    )

    # Contact information
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    website = models.URLField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'agencies'
        verbose_name = 'Agency'
        verbose_name_plural = 'Agencies'

    def __str__(self):
        return self.name


class AgencyUser(models.Model):
    """
    Junction table linking Agencies to Client Users.
    Includes permissions for which ad accounts the client can access.
    """

    agency = models.ForeignKey(
        Agency,
        on_delete=models.CASCADE,
        related_name='agency_users'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='agency_memberships',
        limit_choices_to={'user_type': 'client'}
    )

    # JSON field to store permissions
    # Example: {
    #   "meta_accounts": ["act_123456789", "act_987654321"],
    #   "google_accounts": ["123-456-7890"],
    #   "ga4_properties": ["GA4-123456"]
    # }
    permissions = models.JSONField(default=dict, blank=True)

    # Invitation tracking
    invited_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'agency_users'
        verbose_name = 'Agency User'
        verbose_name_plural = 'Agency Users'
        unique_together = [['agency', 'user']]

    def __str__(self):
        return f'{self.agency.name} - {self.user.email}'

    def has_access_to_meta_account(self, account_id):
        """Check if user has access to specific Meta ad account"""
        meta_accounts = self.permissions.get('meta_accounts', [])
        return account_id in meta_accounts

    def has_access_to_google_account(self, account_id):
        """Check if user has access to specific Google Ads account"""
        google_accounts = self.permissions.get('google_accounts', [])
        return account_id in google_accounts

    def has_access_to_ga4_property(self, property_id):
        """Check if user has access to specific GA4 property"""
        ga4_properties = self.permissions.get('ga4_properties', [])
        return property_id in ga4_properties
