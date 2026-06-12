"""Test settings — extends base settings but removes optional middleware
that may not be installed in the test environment (e.g. whitenoise)."""
from .settings import *  # noqa: F401, F403

# Remove whitenoise from middleware if not installed
try:
    import whitenoise  # noqa: F401
except ImportError:
    MIDDLEWARE = [m for m in MIDDLEWARE if "whitenoise" not in m.lower()]

# Use in-memory SQLite for faster tests
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": "file:memorydb?mode=memory&cache=shared",
        "TEST": {"NAME": "file:memorydb?mode=memory&cache=shared"},
    }
}

# Speed up password hashing in tests
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Silence logging noise in test output
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"null": {"class": "logging.NullHandler"}},
    "root": {"handlers": ["null"]},
}
