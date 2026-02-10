from django.db import models
from django.conf import settings


class GA4Account(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ga4_accounts')
    google_user_id = models.CharField(max_length=64)
    account_id = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ga4_accounts'
        unique_together = [('user', 'account_id')]

    def __str__(self):
        return f'{self.name} ({self.account_id})'


class GA4Property(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ga4_properties')
    google_user_id = models.CharField(max_length=64)
    account = models.ForeignKey(GA4Account, on_delete=models.CASCADE, related_name='properties')
    property_id = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    timezone = models.CharField(max_length=64, blank=True)
    currency = models.CharField(max_length=10, blank=True)

    class Meta:
        db_table = 'ga4_properties'
        unique_together = [('user', 'property_id')]

    def __str__(self):
        return f'{self.name} ({self.property_id})'


class GA4Insight(models.Model):
    date = models.DateField()
    property_id = models.CharField(max_length=64)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ga4_insights')
    google_user_id = models.CharField(max_length=64)
    sessions = models.BigIntegerField(default=0)
    users = models.BigIntegerField(default=0)
    pageviews = models.BigIntegerField(default=0)
    bounce_rate = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    conversions = models.BigIntegerField(default=0)
    events = models.BigIntegerField(default=0)
    revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    source = models.CharField(max_length=255, blank=True, default='')
    medium = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        db_table = 'ga4_insights'
        unique_together = [('date', 'property_id', 'source', 'medium')]

    def __str__(self):
        return f'Property {self.property_id} on {self.date}'
