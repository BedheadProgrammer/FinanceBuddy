# config/urls.py
from django.contrib import admin
from django.urls import path, re_path, include
from django.views.static import serve as static_serve
from django.conf import settings
from django.http import FileResponse

def spa_index(_request, unused=None):
    index = settings.BASE_DIR / "frontend" / "dist" / "index.html"
    return FileResponse(open(index, "rb"))

urlpatterns = [
    path("admin/", admin.site.urls),
    path("accounts/", include("allauth.urls")),
    path("api/", include(("api.urls", "api"), namespace="api")),  # quotes is public
    # Vite build assets
    path(
        "assets/<path:path>",
        static_serve,
        {"document_root": settings.BASE_DIR / "frontend" / "dist" / "assets"},
        name="vite-assets",
    ),
    path(
        "vite.svg",
        static_serve,
        {"document_root": settings.BASE_DIR / "frontend" / "dist", "path": "vite.svg"},
        name="vite-svg",
    ),
    # SPA catch-all for authenticated users (middleware will redirect others to login)
    re_path(r"^(?!assets/|vite\.svg$).*$", spa_index),
]
