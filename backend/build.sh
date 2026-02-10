#!/usr/bin/env bash
# Render Build Script
# Runs during deployment to set up the Django application

# Exit on error
set -o errexit

echo "======================================"
echo "Starting Django Build Process"
echo "======================================"

# Install dependencies
echo "Installing Python packages..."
pip install -r requirements.txt

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --no-input

# Run database migrations
echo "Running database migrations..."
python manage.py migrate

# Create superuser if it doesn't exist (uses env vars)
if [ "$DJANGO_SUPERUSER_EMAIL" ]; then
  echo "Creating superuser..."
  python manage.py createsuperuser --noinput 2>/dev/null || echo "Superuser already exists"
fi

echo "======================================"
echo "Build Complete!"
echo "======================================"
