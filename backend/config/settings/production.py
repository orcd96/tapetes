"""
Production settings — DigitalOcean deployment.
"""

from .base import *  # noqa: F401, F403
from decouple import config, Csv

DEBUG = False

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='', cast=Csv())

# PostgreSQL (Managed DB on DigitalOcean or same droplet)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='tapetes'),
        'USER': config('DB_USER', default='tapetes_user'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 60,
        'OPTIONS': {
            'sslmode': config('DB_SSLMODE', default='prefer'),
        },
    }
}

# CORS — restrict to specific frontend origin
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='', cast=Csv())

# Security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Static files (served by nginx)
STATIC_ROOT = BASE_DIR / 'staticfiles'  # noqa: F405

# DigitalOcean Spaces for media files (rug photos)
USE_SPACES = config('USE_SPACES', default=False, cast=bool)
if USE_SPACES:
    AWS_ACCESS_KEY_ID = config('SPACES_KEY')
    AWS_SECRET_ACCESS_KEY = config('SPACES_SECRET')
    AWS_STORAGE_BUCKET_NAME = config('SPACES_BUCKET')
    AWS_S3_ENDPOINT_URL = config('SPACES_ENDPOINT', default='https://nyc3.digitaloceanspaces.com')
    AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
    AWS_DEFAULT_ACL = 'public-read'
    AWS_LOCATION = 'media'
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    MEDIA_URL = f"{AWS_S3_ENDPOINT_URL}/{AWS_STORAGE_BUCKET_NAME}/{AWS_LOCATION}/"
