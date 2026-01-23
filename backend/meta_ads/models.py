"""
Meta Ads Models - Database schema aligned with Meta Marketing API
Uses Meta IDs as primary keys for structural models
"""
from django.db import models
from django.utils import timezone


class MetaUser(models.Model):
    """Meta user account (from /me endpoint)"""
    id = models.CharField(max_length=50, primary_key=True)  # Meta user ID
    name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True, null=True)
    raw = models.JSONField(default=dict)  # Full API response
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'meta_ads_metauser'
        verbose_name = 'Meta User'
        verbose_name_plural = 'Meta Users'

    def __str__(self):
        return f"{self.name} ({self.id})"


class Business(models.Model):
    """Meta Business account"""
    id = models.CharField(max_length=50, primary_key=True)  # Meta business ID
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(
        MetaUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='businesses'
    )
    raw = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'meta_ads_business'
        verbose_name = 'Business'
        verbose_name_plural = 'Businesses'

    def __str__(self):
        return self.name


class AdAccount(models.Model):
    """Meta Ad Account"""
    id = models.CharField(max_length=50, primary_key=True)  # e.g., "act_123456"
    business = models.ForeignKey(
        Business,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ad_accounts'
    )
    name = models.CharField(max_length=255)
    currency = models.CharField(max_length=10, blank=True)
    timezone = models.CharField(max_length=100, blank=True)
    account_status = models.IntegerField(default=1)  # 1=ACTIVE, 2=DISABLED, etc.
    raw = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'meta_ads_adaccount'
        verbose_name = 'Ad Account'
        verbose_name_plural = 'Ad Accounts'
        indexes = [
            models.Index(fields=['account_status']),
        ]

    def __str__(self):
        return f"{self.name} ({self.id})"

    @property
    def status_display(self):
        """Human-readable status"""
        status_map = {
            1: 'ACTIVE',
            2: 'DISABLED',
            3: 'UNSETTLED',
            7: 'PENDING_RISK_REVIEW',
            8: 'PENDING_SETTLEMENT',
            9: 'IN_GRACE_PERIOD',
            100: 'PENDING_CLOSURE',
            101: 'CLOSED',
            201: 'ANY_ACTIVE',
            202: 'ANY_CLOSED',
        }
        return status_map.get(self.account_status, 'UNKNOWN')


class Campaign(models.Model):
    """Meta Campaign"""
    id = models.CharField(max_length=50, primary_key=True)  # Meta campaign ID
    ad_account = models.ForeignKey(
        AdAccount,
        on_delete=models.CASCADE,
        related_name='campaigns'
    )
    name = models.CharField(max_length=255)
    objective = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=50, blank=True)  # ACTIVE, PAUSED, DELETED, etc.
    buying_type = models.CharField(max_length=50, blank=True)  # AUCTION, RESERVED
    raw = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'meta_ads_campaign'
        verbose_name = 'Campaign'
        verbose_name_plural = 'Campaigns'
        indexes = [
            models.Index(fields=['ad_account', 'status']),
        ]

    def __str__(self):
        return f"{self.name} ({self.id})"


class AdSet(models.Model):
    """Meta Ad Set"""
    id = models.CharField(max_length=50, primary_key=True)  # Meta adset ID
    campaign = models.ForeignKey(
        Campaign,
        on_delete=models.CASCADE,
        related_name='adsets'
    )
    ad_account = models.ForeignKey(
        AdAccount,
        on_delete=models.CASCADE,
        related_name='adsets'
    )
    name = models.CharField(max_length=255)
    daily_budget = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    lifetime_budget = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    optimization_goal = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=50, blank=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    raw = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'meta_ads_adset'
        verbose_name = 'Ad Set'
        verbose_name_plural = 'Ad Sets'
        indexes = [
            models.Index(fields=['campaign', 'status']),
            models.Index(fields=['ad_account']),
        ]

    def __str__(self):
        return f"{self.name} ({self.id})"


class Ad(models.Model):
    """Meta Ad"""
    id = models.CharField(max_length=50, primary_key=True)  # Meta ad ID
    adset = models.ForeignKey(
        AdSet,
        on_delete=models.CASCADE,
        related_name='ads'
    )
    campaign = models.ForeignKey(
        Campaign,
        on_delete=models.CASCADE,
        related_name='ads'
    )
    ad_account = models.ForeignKey(
        AdAccount,
        on_delete=models.CASCADE,
        related_name='ads'
    )
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=50, blank=True)
    effective_status = models.CharField(max_length=50, blank=True)
    creative_id = models.CharField(max_length=50, blank=True)
    raw = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'meta_ads_ad'
        verbose_name = 'Ad'
        verbose_name_plural = 'Ads'
        indexes = [
            models.Index(fields=['adset', 'status']),
            models.Index(fields=['campaign']),
            models.Index(fields=['ad_account']),
        ]

    def __str__(self):
        return f"{self.name} ({self.id})"


class AdCreative(models.Model):
    """Meta Ad Creative"""
    id = models.CharField(max_length=50, primary_key=True)  # Meta creative ID
    ad_account = models.ForeignKey(
        AdAccount,
        on_delete=models.CASCADE,
        related_name='creatives'
    )
    name = models.CharField(max_length=255, blank=True)
    object_story_spec = models.JSONField(default=dict, blank=True)
    image_url = models.URLField(max_length=500, blank=True)
    video_url = models.URLField(max_length=500, blank=True)
    raw = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'meta_ads_adcreative'
        verbose_name = 'Ad Creative'
        verbose_name_plural = 'Ad Creatives'
        indexes = [
            models.Index(fields=['ad_account']),
        ]

    def __str__(self):
        return f"{self.name or 'Untitled'} ({self.id})"


class Insight(models.Model):
    """
    Meta Insights - APPEND ONLY (no unique constraints)
    Stores metrics at different levels: account, campaign, adset, ad
    """
    LEVEL_CHOICES = [
        ('account', 'Account'),
        ('campaign', 'Campaign'),
        ('adset', 'Ad Set'),
        ('ad', 'Ad'),
    ]

    id = models.AutoField(primary_key=True)  # Internal ID
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    object_id = models.CharField(max_length=50)  # Meta entity ID (campaign_id, adset_id, ad_id, or account_id)
    ad_account = models.ForeignKey(
        AdAccount,
        on_delete=models.CASCADE,
        related_name='insights'
    )
    date_start = models.DateField()
    date_stop = models.DateField()
    metrics = models.JSONField(default=dict)  # All metrics: impressions, clicks, spend, etc.
    raw = models.JSONField(default=dict)  # Full API response
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'meta_ads_insight'
        verbose_name = 'Insight'
        verbose_name_plural = 'Insights'
        indexes = [
            models.Index(fields=['level', 'object_id']),
            models.Index(fields=['date_start', 'date_stop']),
            models.Index(fields=['ad_account']),
            models.Index(fields=['level', 'object_id', 'date_start']),
        ]
        # NO unique constraint - append only

    def __str__(self):
        return f"{self.level} {self.object_id} - {self.date_start} to {self.date_stop}"


class SyncState(models.Model):
    """
    Sync State - SOURCE OF TRUTH for tracking sync progress
    Tracks last sync time for each entity type per agency
    """
    ENTITY_TYPE_CHOICES = [
        ('user', 'User'),
        ('business', 'Business'),
        ('ad_account', 'Ad Account'),
        ('campaign', 'Campaign'),
        ('adset', 'Ad Set'),
        ('ad', 'Ad'),
        ('creative', 'Creative'),
        ('insights', 'Insights'),
    ]

    STATUS_CHOICES = [
        ('idle', 'Idle'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.AutoField(primary_key=True)
    agency = models.ForeignKey(
        'agencies.Agency',
        on_delete=models.CASCADE,
        related_name='sync_states'
    )
    provider = models.CharField(max_length=20, default='meta')
    entity_type = models.CharField(max_length=20, choices=ENTITY_TYPE_CHOICES)
    entity_id = models.CharField(max_length=100)  # Meta entity ID
    last_synced_at = models.DateTimeField(null=True, blank=True)
    last_insight_date = models.DateField(null=True, blank=True)  # Track insights progress
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='idle')
    error_message = models.TextField(blank=True)
    metadata = models.JSONField(default=dict)  # Additional info (counts, errors, etc.)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'meta_ads_syncstate'
        verbose_name = 'Sync State'
        verbose_name_plural = 'Sync States'
        unique_together = [['agency', 'provider', 'entity_type', 'entity_id']]
        indexes = [
            models.Index(fields=['agency']),
            models.Index(fields=['entity_type']),
            models.Index(fields=['status']),
            models.Index(fields=['agency', 'entity_type']),
        ]

    def __str__(self):
        return f"{self.agency.name} - {self.entity_type} {self.entity_id} ({self.status})"


class AgencyAdAccountAccess(models.Model):
    """
    Links agencies to ad accounts they manage (multi-tenancy)
    This is the through-table for access control
    """
    agency = models.ForeignKey(
        'agencies.Agency',
        on_delete=models.CASCADE,
        related_name='ad_account_accesses'
    )
    ad_account = models.ForeignKey(
        AdAccount,
        on_delete=models.CASCADE,
        related_name='agency_accesses'
    )
    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'meta_ads_agencyadaccountaccess'
        verbose_name = 'Agency Ad Account Access'
        verbose_name_plural = 'Agency Ad Account Accesses'
        unique_together = [['agency', 'ad_account']]
        indexes = [
            models.Index(fields=['agency']),
            models.Index(fields=['ad_account']),
        ]

    def __str__(self):
        return f"{self.agency.name} → {self.ad_account.name}"
