from django.db import models
from django.conf import settings


class GoogleAdsCustomer(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='google_ads_customers')
    google_user_id = models.CharField(max_length=64)
    customer_id = models.CharField(max_length=64)
    name = models.CharField(max_length=255, blank=True)
    descriptive_name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'google_ads_customers'
        unique_together = [('user', 'customer_id')]

    def __str__(self):
        return f'{self.descriptive_name or self.name} ({self.customer_id})'


class GoogleAdsAccount(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='google_ads_accounts')
    google_user_id = models.CharField(max_length=64)
    customer = models.ForeignKey(GoogleAdsCustomer, on_delete=models.SET_NULL, null=True, blank=True, related_name='accounts')
    account_id = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    currency = models.CharField(max_length=10, blank=True)
    timezone = models.CharField(max_length=64, blank=True)
    status = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'google_ads_accounts'
        unique_together = [('user', 'account_id')]

    def __str__(self):
        return f'{self.name} ({self.account_id})'


class GoogleAdsCampaign(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='google_ads_campaigns')
    google_user_id = models.CharField(max_length=64)
    account = models.ForeignKey(GoogleAdsAccount, on_delete=models.CASCADE, related_name='campaigns')
    campaign_id = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=50, blank=True)
    campaign_type = models.CharField(max_length=100, blank=True)
    daily_budget = models.CharField(max_length=32, blank=True)

    class Meta:
        db_table = 'google_ads_campaigns'
        unique_together = [('user', 'campaign_id')]

    def __str__(self):
        return f'{self.name} ({self.campaign_id})'


class GoogleAdsAdGroup(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='google_ads_ad_groups')
    google_user_id = models.CharField(max_length=64)
    account = models.ForeignKey(GoogleAdsAccount, on_delete=models.CASCADE, related_name='ad_groups')
    campaign = models.ForeignKey(GoogleAdsCampaign, on_delete=models.CASCADE, related_name='ad_groups')
    ad_group_id = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'google_ads_ad_groups'
        unique_together = [('user', 'ad_group_id')]

    def __str__(self):
        return f'{self.name} ({self.ad_group_id})'


class GoogleAdsAd(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='google_ads_ads')
    google_user_id = models.CharField(max_length=64)
    account = models.ForeignKey(GoogleAdsAccount, on_delete=models.CASCADE, related_name='ads')
    campaign = models.ForeignKey(GoogleAdsCampaign, on_delete=models.CASCADE, related_name='ads')
    ad_group = models.ForeignKey(GoogleAdsAdGroup, on_delete=models.CASCADE, related_name='ads')
    ad_id = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=50, blank=True)
    ad_type = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'google_ads_ads'
        unique_together = [('user', 'ad_id')]

    def __str__(self):
        return f'{self.name} ({self.ad_id})'


class GoogleAdsInsight(models.Model):
    LEVEL_CHOICES = [
        ('account', 'Account'),
        ('campaign', 'Campaign'),
        ('ad_group', 'Ad Group'),
        ('ad', 'Ad'),
    ]

    date = models.DateField()
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    object_id = models.CharField(max_length=64)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='google_ads_insights')
    google_user_id = models.CharField(max_length=64)
    spend = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    impressions = models.BigIntegerField(default=0)
    clicks = models.BigIntegerField(default=0)
    cpc = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    cpm = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    ctr = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    conversions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    conversion_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        db_table = 'google_ads_insights'
        unique_together = [('date', 'level', 'object_id')]

    def __str__(self):
        return f'{self.level} {self.object_id} on {self.date}'
