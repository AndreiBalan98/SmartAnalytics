from django.db import models
from django.conf import settings


class MetaBusiness(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='meta_businesses')
    meta_user_id = models.CharField(max_length=64)
    business_id = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'meta_businesses'
        unique_together = [('user', 'business_id')]

    def __str__(self):
        return f'{self.name} ({self.business_id})'


class MetaAccount(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='meta_accounts')
    meta_user_id = models.CharField(max_length=64)
    business = models.ForeignKey(MetaBusiness, on_delete=models.SET_NULL, null=True, blank=True, related_name='accounts')
    account_id = models.CharField(max_length=64)
    status = models.IntegerField(default=1)
    name = models.CharField(max_length=255)
    currency = models.CharField(max_length=10, blank=True)
    timezone_offset_hours_utc = models.CharField(max_length=64, blank=True)

    class Meta:
        db_table = 'meta_accounts'
        unique_together = [('user', 'account_id')]

    def __str__(self):
        return f'{self.name} ({self.account_id})'


class MetaCampaign(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='meta_campaigns')
    meta_user_id = models.CharField(max_length=64)
    business = models.ForeignKey(MetaBusiness, on_delete=models.SET_NULL, null=True, blank=True)
    account = models.ForeignKey(MetaAccount, on_delete=models.CASCADE, related_name='campaigns')
    campaign_id = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=50, blank=True)
    objective = models.CharField(max_length=100, blank=True)
    daily_budget = models.CharField(max_length=32, blank=True)
    updated_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'meta_campaigns'
        unique_together = [('user', 'campaign_id')]

    def __str__(self):
        return f'{self.name} ({self.campaign_id})'


class MetaAdset(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='meta_adsets')
    meta_user_id = models.CharField(max_length=64)
    business = models.ForeignKey(MetaBusiness, on_delete=models.SET_NULL, null=True, blank=True)
    account = models.ForeignKey(MetaAccount, on_delete=models.CASCADE, related_name='adsets')
    campaign = models.ForeignKey(MetaCampaign, on_delete=models.CASCADE, related_name='adsets')
    adset_id = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=50, blank=True)
    optimization_goal = models.CharField(max_length=100, blank=True)
    daily_budget = models.CharField(max_length=32, blank=True)
    updated_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'meta_adsets'
        unique_together = [('user', 'adset_id')]

    def __str__(self):
        return f'{self.name} ({self.adset_id})'


class MetaAd(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='meta_ads')
    meta_user_id = models.CharField(max_length=64)
    business = models.ForeignKey(MetaBusiness, on_delete=models.SET_NULL, null=True, blank=True)
    account = models.ForeignKey(MetaAccount, on_delete=models.CASCADE, related_name='ads')
    campaign = models.ForeignKey(MetaCampaign, on_delete=models.CASCADE, related_name='ads')
    adset = models.ForeignKey(MetaAdset, on_delete=models.CASCADE, related_name='ads')
    ad_id = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=50, blank=True)
    creative = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'meta_ads'
        unique_together = [('user', 'ad_id')]

    def __str__(self):
        return f'{self.name} ({self.ad_id})'


class MetaInsight(models.Model):
    LEVEL_CHOICES = [
        ('account', 'Account'),
        ('campaign', 'Campaign'),
        ('adset', 'Adset'),
        ('ad', 'Ad'),
    ]

    date = models.DateField()
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    object_id = models.CharField(max_length=64)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='meta_insights')
    meta_user_id = models.CharField(max_length=64)
    spend = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    impressions = models.BigIntegerField(default=0)
    reach = models.BigIntegerField(default=0)
    clicks = models.BigIntegerField(default=0)
    cpc = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    cpm = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    ctr = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    actions = models.JSONField(default=list, blank=True)
    action_values = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = 'meta_insights'
        unique_together = [('date', 'level', 'object_id')]

    def __str__(self):
        return f'{self.level} {self.object_id} on {self.date}'
