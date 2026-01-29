import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = os.getenv('DJANGO_DEBUG', 'False') == 'True'

# Allowed hosts - pentru production
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '.onrender.com',  # Pentru orice subdomain Render
]

# Dacă ai un custom domain
RENDER_EXTERNAL_HOSTNAME = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'django.contrib.sessions',  # Required for SessionMiddleware
    'django.contrib.messages',  # Required for MessageMiddleware
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    # New modular apps
    'users',
    'agencies',
    'integrations',
    'campaigns',
    'metrics',
    'core',
    'meta_ads',  # New Meta-aligned models
    # Legacy (will be removed after migration)
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',  # Security headers
    'corsheaders.middleware.CorsMiddleware',  # CORS (must be before CommonMiddleware)
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Static files
    'django.contrib.sessions.middleware.SessionMiddleware',  # Sessions
    'django.middleware.common.CommonMiddleware',  # Common processing
    'django.middleware.csrf.CsrfViewMiddleware',  # CSRF protection
    'django.contrib.auth.middleware.AuthenticationMiddleware',  # Sets request.user
    'django.contrib.messages.middleware.MessageMiddleware',  # Messages framework
    'django.middleware.clickjacking.XFrameOptionsMiddleware',  # Clickjacking protection
    'core.middleware.logging_middleware.RequestLoggingMiddleware',  # Request logging (after auth)
    'api.middleware.APIKeyMiddleware',  # Custom API key middleware
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database - PostgreSQL
# Uses DATABASE_URL from environment (.env file or Render auto-config)
DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        conn_max_age=600,
        conn_health_checks=True,
    )
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# CORS - permite Vercel frontend
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://localhost:3000',
    'https://smart-analytics-alpha.vercel.app',
    'https://conversion-driven.vercel.app',
    'https://app.conversion-driven.com', # Production Vercel URL
]

# Dacă ai frontend URL-ul custom (îl adaugi după ce deploiezi pe Vercel)
FRONTEND_URL = os.getenv('FRONTEND_URL', '')
if FRONTEND_URL and FRONTEND_URL not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS.append(FRONTEND_URL)
    # Add both with and without www
    if not FRONTEND_URL.startswith('http://localhost'):
        www_url = FRONTEND_URL.replace('https://', 'https://www.')
        if www_url not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(www_url)

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False  # Use CORS_ALLOWED_ORIGINS instead
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'UNAUTHENTICATED_USER': None,
    'UNAUTHENTICATED_TOKEN': None,
}

# JWT Settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# Custom settings
INTERNAL_API_KEY = os.getenv('INTERNAL_API_KEY', 'dev-internal-key-123')
META_APP_ID = os.getenv('META_APP_ID', '')
META_APP_SECRET = os.getenv('META_APP_SECRET', '')
META_REDIRECT_URI = os.getenv('META_REDIRECT_URI', '')

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} [{name}] {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',  # Changed from simple to verbose
        },
        'database': {
            'class': 'core.logging_handler.DatabaseLogHandler',
            'formatter': 'verbose',
            'level': 'INFO',  # Only log INFO and above to database
        },
    },
    'root': {
        'handlers': ['console', 'database'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'database'],
            'level': 'INFO',
            'propagate': False,
        },
        'core.middleware': {
            'handlers': ['console', 'database'],
            'level': 'INFO',
            'propagate': False,
        },
        'integrations': {
            'handlers': ['console', 'database'],
            'level': 'INFO',
            'propagate': False,
        },
        'smartanalytics.requests': {
            'handlers': ['console', 'database'],
            'level': 'INFO',
            'propagate': False,
        },
        'smartanalytics.sync': {
            'handlers': ['console', 'database'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
