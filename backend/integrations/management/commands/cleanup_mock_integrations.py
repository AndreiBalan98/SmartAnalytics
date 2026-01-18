"""
Django management command to clean up mock Meta integrations from database
Usage: python manage.py cleanup_mock_integrations
"""

from django.core.management.base import BaseCommand
from integrations.models import MetaIntegration


class Command(BaseCommand):
    help = 'Delete all mock Meta integrations (tokens starting with "mock_")'

    def handle(self, *args, **options):
        # Find all mock integrations
        mock_integrations = MetaIntegration.objects.filter(
            access_token__startswith='mock_'
        )

        count = mock_integrations.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS('No mock integrations found. Database is clean.'))
            return

        # Display what will be deleted
        self.stdout.write(self.style.WARNING(f'Found {count} mock integration(s):'))
        for integration in mock_integrations:
            self.stdout.write(f'  - Agency: {integration.agency.name} (ID: {integration.agency.id})')
            self.stdout.write(f'    Token: {integration.access_token[:20]}...')
            self.stdout.write(f'    Business: {integration.business_name}')

        # Ask for confirmation
        self.stdout.write('')
        confirm = input('Delete these mock integrations? (yes/no): ')

        if confirm.lower() != 'yes':
            self.stdout.write(self.style.WARNING('Operation cancelled.'))
            return

        # Delete mock integrations
        deleted_count, _ = mock_integrations.delete()

        self.stdout.write(self.style.SUCCESS(f'Successfully deleted {deleted_count} mock integration(s).'))
        self.stdout.write(self.style.SUCCESS('You can now reconnect Meta with real OAuth tokens.'))
