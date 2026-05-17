"""
Development settings for the Rug Spa management system.
"""

from .base import *  # noqa: F401, F403

DEBUG = True

ALLOWED_HOSTS = ['*']

# SQLite for development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',  # noqa: F405
    }
}

# Allow all CORS origins in development
CORS_ALLOW_ALL_ORIGINS = True

# Show emails in console during development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
