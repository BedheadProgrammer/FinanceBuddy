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
  path(
    "assets/<path:path>",
    static_serve,
    {
      "document_root": settings.BASE_DIR / "frontend" / "dist",
    },
    name="vite-assets",
  ),
  path(
    "vite.svg",
    static_serve,
    {
      "document_root": settings.BASE_DIR / "frontend" / "dist",
      "path": "vite.svg",
    },
    name="vite-svg",
  ),
  path(
    "api/",
    include(("api.urls", "api"), namespace="api"),
  ),
  path(
    "api/auth/",
    include(("accounts.api_urls", "accounts_api"), namespace="accounts_api"),
  ),
  path(
    "api/euro/",
    include(("eurocalc.urls", "eurocalc"), namespace="eurocalc_api"),
  ),
  path(
    "api/american/",
    include(
      ("eurocalc.urls_american", "eurocalc_american"),
      namespace="american_api",
    ),
  ),
  re_path(r"^(?!assets/|vite\.svg$).*$", spa_index),
]
