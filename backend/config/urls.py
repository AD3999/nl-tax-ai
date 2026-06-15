from pathlib import Path
from django.conf import settings
from django.contrib import admin
from django.urls import path, include, re_path
from django.http import HttpResponse, Http404
from django.views.static import serve as _media_serve
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from config.serializers import EmailOrUsernameTokenSerializer

# Serve React's index.html for every non-API, non-admin, non-media route so that
# React Router can handle client-side navigation on the deployed build.
_FRONTEND_INDEX = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist" / "index.html"

def spa_index(request):
    if not _FRONTEND_INDEX.exists():
        raise Http404("Frontend not built.")
    return HttpResponse(_FRONTEND_INDEX.read_bytes(), content_type="text/html; charset=utf-8")

urlpatterns = [
    path("admin/", admin.site.urls),
    # JWT auth
    path("api/auth/token/", TokenObtainPairView.as_view(serializer_class=EmailOrUsernameTokenSerializer), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # App routers
    path("api/users/", include("apps.users.urls")),
    path("api/tax/", include("apps.tax.urls")),
    path("api/chat/", include("apps.chat.urls")),
    path("api/calculator/", include("apps.calculator.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/portal/", include("apps.portal.urls")),
    path("api/zzp/",    include("apps.zzp.urls")),
    # Media files — must come before the SPA catch-all.
    # Uses Django's built-in serve view (works in dev and prod; for prod at scale
    # replace FileSystemStorage with S3/Cloudinary and remove this line).
    re_path(r"^media/(?P<path>.*)$", _media_serve, {"document_root": settings.MEDIA_ROOT}),
    # SPA catch-all — excludes api/, admin/, and media/ so those reach their own handlers
    re_path(r"^(?!api/|admin/|media/).*$", spa_index),
]
