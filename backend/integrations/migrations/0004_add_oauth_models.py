# Generated manually for OAuth models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('integrations', '0003_add_account_email_to_google_ads_integration'),
    ]

    operations = [
        # OAuth State model
        migrations.CreateModel(
            name='OAuthState',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('state', models.CharField(db_index=True, max_length=255, unique=True)),
                ('service_type', models.CharField(choices=[('meta', 'Meta'), ('google_ads', 'Google Ads'), ('ga4', 'Google Analytics 4')], max_length=50)),
                ('expires_at', models.DateTimeField(db_index=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='oauth_states', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'OAuth State',
                'verbose_name_plural': 'OAuth States',
                'db_table': 'oauth_states',
            },
        ),
        # Meta Token model
        migrations.CreateModel(
            name='MetaToken',
            fields=[
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='meta_token', serialize=False, to=settings.AUTH_USER_MODEL)),
                ('token', models.TextField()),
                ('scopes', models.JSONField(default=list)),
                ('expiry_date', models.DateTimeField(db_index=True)),
                ('meta_user_id', models.CharField(db_index=True, max_length=255)),
                ('name', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Meta Token',
                'verbose_name_plural': 'Meta Tokens',
                'db_table': 'meta_tokens',
            },
        ),
        # Google Token model
        migrations.CreateModel(
            name='GoogleToken',
            fields=[
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='google_token', serialize=False, to=settings.AUTH_USER_MODEL)),
                ('access_token', models.TextField()),
                ('refresh_token', models.TextField()),
                ('scopes', models.JSONField(default=list)),
                ('expiry_date', models.DateTimeField(db_index=True)),
                ('user_openid', models.CharField(db_index=True, max_length=255)),
                ('name', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Google Token',
                'verbose_name_plural': 'Google Tokens',
                'db_table': 'google_tokens',
            },
        ),
        # GA4 Token model
        migrations.CreateModel(
            name='GA4Token',
            fields=[
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='ga4_token', serialize=False, to=settings.AUTH_USER_MODEL)),
                ('access_token', models.TextField()),
                ('refresh_token', models.TextField()),
                ('scopes', models.JSONField(default=list)),
                ('expiry_date', models.DateTimeField(db_index=True)),
                ('user_openid', models.CharField(db_index=True, max_length=255)),
                ('name', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'GA4 Token',
                'verbose_name_plural': 'GA4 Tokens',
                'db_table': 'ga4_tokens',
            },
        ),
    ]
