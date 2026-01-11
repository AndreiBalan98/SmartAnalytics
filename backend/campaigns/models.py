from django.db import models


class Campaign(models.Model):
    """
    Represents an advertising campaign from Meta or Google Ads.
    """

    PLATFORM_CHOICES = [
        ('meta', 'Meta Ads'),
        ('google', 'Google Ads'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('deleted', 'Deleted'),
        ('archived', 'Archived'),
    ]

    agency = models.ForeignKey(
        'agencies.Agency',
        on_delete=models.CASCADE,
        related_name='campaigns'
    )

    # External platform identifiers
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    external_id = models.CharField(max_length=100, db_index=True)
    account_id = models.CharField(max_length=100, db_index=True)

    # Campaign details
    name = models.CharField(max_length=500)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    objective = models.CharField(max_length=100, blank=True)

    # Budget
    daily_budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    lifetime_budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default='USD')

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    platform_created_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'campaigns'
        verbose_name = 'Campaign'
        verbose_name_plural = 'Campaigns'
        unique_together = [['platform', 'external_id']]
        indexes = [
            models.Index(fields=['agency', 'platform']),
            models.Index(fields=['account_id']),
        ]

    def __str__(self):
        return f'[{self.platform.upper()}] {self.name}'


class AdSet(models.Model):
    """
    Represents an ad set (Meta) or ad group (Google Ads).
    """

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('deleted', 'Deleted'),
        ('archived', 'Archived'),
    ]

    campaign = models.ForeignKey(
        Campaign,
        on_delete=models.CASCADE,
        related_name='ad_sets'
    )

    # External platform identifiers
    external_id = models.CharField(max_length=100, db_index=True)

    # Ad set details
    name = models.CharField(max_length=500)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    # Budget (optional, can inherit from campaign)
    daily_budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    lifetime_budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Targeting info (stored as JSON for flexibility)
    targeting = models.JSONField(default=dict, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    platform_created_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'ad_sets'
        verbose_name = 'Ad Set'
        verbose_name_plural = 'Ad Sets'
        unique_together = [['campaign', 'external_id']]

    def __str__(self):
        return f'{self.campaign.name} → {self.name}'


class Ad(models.Model):
    """
    Represents an individual ad within an ad set.
    """

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('deleted', 'Deleted'),
        ('archived', 'Archived'),
    ]

    ad_set = models.ForeignKey(
        AdSet,
        on_delete=models.CASCADE,
        related_name='ads'
    )

    # External platform identifiers
    external_id = models.CharField(max_length=100, db_index=True)

    # Ad details
    name = models.CharField(max_length=500)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    # Creative info (stored as JSON)
    creative = models.JSONField(default=dict, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    platform_created_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'ads'
        verbose_name = 'Ad'
        verbose_name_plural = 'Ads'
        unique_together = [['ad_set', 'external_id']]

    def __str__(self):
        return f'{self.ad_set.campaign.name} → {self.ad_set.name} → {self.name}'
