from django.db import models


class DailyMetric(models.Model):
    """
    Stores daily advertising metrics for campaigns, ad sets, and ads.
    This is the central table for all performance data.
    Supports upsert logic to handle delayed conversion data.
    """

    ENTITY_TYPE_CHOICES = [
        ('campaign', 'Campaign'),
        ('ad_set', 'Ad Set'),
        ('ad', 'Ad'),
        ('account', 'Account'),
    ]

    PLATFORM_CHOICES = [
        ('meta', 'Meta Ads'),
        ('google', 'Google Ads'),
        ('ga4', 'Google Analytics 4'),
    ]

    # References
    agency = models.ForeignKey(
        'agencies.Agency',
        on_delete=models.CASCADE,
        related_name='metrics',
        db_index=True
    )

    # Entity identification
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, db_index=True)
    entity_type = models.CharField(max_length=20, choices=ENTITY_TYPE_CHOICES)
    entity_id = models.CharField(max_length=100, db_index=True)
    account_id = models.CharField(max_length=100, db_index=True)
    account_name = models.CharField(max_length=255, blank=True, default='')

    # Date
    date = models.DateField(db_index=True)

    # Core metrics
    impressions = models.BigIntegerField(default=0)
    clicks = models.BigIntegerField(default=0)
    spend = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default='USD')

    # Conversion metrics
    conversions = models.BigIntegerField(default=0)
    conversion_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Calculated metrics (stored for performance)
    ctr = models.DecimalField(max_digits=10, decimal_places=4, default=0)  # Click-through rate
    cpc = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # Cost per click
    cpm = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # Cost per mille (thousand impressions)
    roas = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Return on ad spend

    # Platform-specific metrics (stored as JSON for flexibility)
    extra_metrics = models.JSONField(default=dict, blank=True)

    # Sync tracking
    synced_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'daily_metrics'
        verbose_name = 'Daily Metric'
        verbose_name_plural = 'Daily Metrics'
        unique_together = [['platform', 'entity_type', 'entity_id', 'date']]
        indexes = [
            models.Index(fields=['agency', 'date']),
            models.Index(fields=['account_id', 'date']),
            models.Index(fields=['platform', 'date']),
            models.Index(fields=['entity_id', 'date']),
        ]
        ordering = ['-date', 'entity_type']

    def __str__(self):
        return f'{self.platform} - {self.entity_type} - {self.entity_id} - {self.date}'

    def calculate_metrics(self):
        """Calculate derived metrics from core data"""
        # CTR: Click-through rate
        if self.impressions > 0:
            self.ctr = (self.clicks / self.impressions) * 100
        else:
            self.ctr = 0

        # CPC: Cost per click
        if self.clicks > 0:
            self.cpc = self.spend / self.clicks
        else:
            self.cpc = 0

        # CPM: Cost per thousand impressions
        if self.impressions > 0:
            self.cpm = (self.spend / self.impressions) * 1000
        else:
            self.cpm = 0

        # ROAS: Return on ad spend
        if self.spend > 0:
            self.roas = self.conversion_value / self.spend
        else:
            self.roas = 0

    def save(self, *args, **kwargs):
        """Override save to auto-calculate metrics"""
        self.calculate_metrics()
        super().save(*args, **kwargs)


class MetricSnapshot(models.Model):
    """
    Stores periodic snapshots of aggregated metrics for faster reporting.
    Pre-computed aggregations for common queries.
    """

    GRANULARITY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]

    agency = models.ForeignKey(
        'agencies.Agency',
        on_delete=models.CASCADE,
        related_name='metric_snapshots'
    )

    platform = models.CharField(max_length=20, choices=DailyMetric.PLATFORM_CHOICES)
    account_id = models.CharField(max_length=100, db_index=True)
    granularity = models.CharField(max_length=20, choices=GRANULARITY_CHOICES)

    # Period
    period_start = models.DateField(db_index=True)
    period_end = models.DateField()

    # Aggregated metrics
    total_impressions = models.BigIntegerField(default=0)
    total_clicks = models.BigIntegerField(default=0)
    total_spend = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_conversions = models.BigIntegerField(default=0)
    total_conversion_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    avg_ctr = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    avg_cpc = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    avg_roas = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'metric_snapshots'
        verbose_name = 'Metric Snapshot'
        verbose_name_plural = 'Metric Snapshots'
        unique_together = [['platform', 'account_id', 'granularity', 'period_start']]
        indexes = [
            models.Index(fields=['agency', 'period_start']),
            models.Index(fields=['account_id', 'period_start']),
        ]

    def __str__(self):
        return f'{self.platform} - {self.account_id} - {self.granularity} - {self.period_start}'
