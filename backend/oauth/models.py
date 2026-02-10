from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class OAuthState(models.Model):
    state = models.CharField(max_length=128, primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    service_type = models.CharField(max_length=20, choices=[
        ('meta', 'Meta'),
        ('google', 'Google'),
        ('ga4', 'GA4'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'oauth_states'

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f'{self.service_type} state for {self.user.email}'


class MetaToken(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name='meta_token')
    meta_user_id = models.CharField(max_length=64)
    name = models.CharField(max_length=255, blank=True)
    token = models.TextField()
    scopes = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateTimeField()

    class Meta:
        db_table = 'meta_tokens'

    def __str__(self):
        return f'Meta token for {self.user.email}'


class GoogleToken(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name='google_token')
    google_user_id = models.CharField(max_length=64)
    name = models.CharField(max_length=255, blank=True)
    access_token = models.TextField()
    refresh_token = models.TextField(blank=True)
    scopes = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'google_tokens'

    def __str__(self):
        return f'Google token for {self.user.email}'


class GA4Token(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name='ga4_token')
    google_user_id = models.CharField(max_length=64)
    name = models.CharField(max_length=255, blank=True)
    access_token = models.TextField()
    refresh_token = models.TextField(blank=True)
    scopes = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'ga4_tokens'

    def __str__(self):
        return f'GA4 token for {self.user.email}'


class MetaUser(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name='meta_user')
    meta_user_id = models.CharField(max_length=64)
    name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'meta_users'

    def __str__(self):
        return f'{self.name} ({self.meta_user_id})'


class GoogleUser(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name='google_user')
    google_user_id = models.CharField(max_length=64)
    name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'google_users'

    def __str__(self):
        return f'{self.name} ({self.google_user_id})'


class GA4User(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name='ga4_user')
    google_user_id = models.CharField(max_length=64)
    name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ga4_users'

    def __str__(self):
        return f'{self.name} ({self.google_user_id})'
