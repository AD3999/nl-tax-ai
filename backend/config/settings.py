"""
Django settings for nl-tax-ai backend.
Reads all secrets from environment variables via django-environ.
"""

import sys
import environ
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Allow importing phase2 modules (project root is one level above backend/)
_PROJECT_ROOT = str(BASE_DIR.parent)
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ["*"]),
)

_env_file = BASE_DIR.parent / ".env"
if _env_file.exists():
    environ.Env.read_env(_env_file)

SECRET_KEY = env("DJANGO_SECRET_KEY", default="dev-secret-key-change-in-production")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env("ALLOWED_HOSTS")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    # Local apps
    "apps.users",
    "apps.tax",
    "apps.chat",
    "apps.calculator",
    "apps.payments",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ── Database ──────────────────────────────────────────────────────────────────

DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default="postgresql://nltaxai:nltaxai@localhost:5432/nltaxai",
    )
}

# ── Auth ──────────────────────────────────────────────────────────────────────

AUTH_USER_MODEL = "users.User"

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

SITE_ID = 1

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ── REST Framework ────────────────────────────────────────────────────────────

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/minute",
        "user": "300/minute",
    },
}

# ── CORS ──────────────────────────────────────────────────────────────────────

CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:5173", "http://localhost:3000"],
)
CORS_ALLOW_CREDENTIALS = True

# ── Celery ────────────────────────────────────────────────────────────────────

CELERY_BROKER_URL = env("REDIS_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = env("REDIS_URL", default="redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "Europe/Amsterdam"

# ── Stripe ────────────────────────────────────────────────────────────────────

STRIPE_SECRET_KEY = env("STRIPE_SECRET_KEY", default="")
STRIPE_WEBHOOK_SECRET = env("STRIPE_WEBHOOK_SECRET", default="")
STRIPE_PRICE_ID = env("STRIPE_PRICE_ID", default="")   # monthly premium price ID
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:5173")

# ── Premium limits ────────────────────────────────────────────────────────────
# Set DISABLE_CHAT_LIMITS=true in .env to remove all limits (e.g., during dev/testing)
DISABLE_CHAT_LIMITS = env.bool("DISABLE_CHAT_LIMITS", default=True)
FREE_DAILY_LIMIT = 9999 if DISABLE_CHAT_LIMITS else 10
ANON_SESSION_LIMIT = 9999 if DISABLE_CHAT_LIMITS else 5

# ── Internationalisation ──────────────────────────────────────────────────────

LANGUAGE_CODE = "nl-nl"
TIME_ZONE = "Europe/Amsterdam"
USE_I18N = True
USE_TZ = True

LANGUAGES = [
    ("nl", "Dutch"),
    ("en", "English"),
    ("fa", "Persian"),
]

# ── Static & Media ────────────────────────────────────────────────────────────

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ── WhiteNoise — serve React build + Django static files ─────────────────────

# Serve the React dist folder (index.html, assets/, favicon) at the URL root.
# WhiteNoise intercepts these before Django's URL router.
WHITENOISE_ROOT = BASE_DIR.parent / "frontend" / "dist"

STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ── AI providers ──────────────────────────────────────────────────────────────

OPENAI_API_KEY = env("OPENAI_API_KEY", default="")
ANTHROPIC_API_KEY = env("ANTHROPIC_API_KEY", default="")

# ── Production security (activated when DEBUG=False) ──────────────────────────

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=False)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
