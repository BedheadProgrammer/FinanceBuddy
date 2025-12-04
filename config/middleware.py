from django.conf import settings
from django.shortcuts import redirect
from django.urls import reverse


class LoginRequiredMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        static_url = (getattr(settings, "STATIC_URL", "/static/") or "/static/")
        self.allow_prefixes = (
            "/accounts/",
            "/api/auth/login",
            "/api/auth/register",
            "/assets/",
            "/vite.svg",
            static_url.rstrip("/"),
        )
        self.admin_allow = (
            "/admin/login",
            "/admin/logout",
            "/admin/password_reset",
        )

    def __call__(self, request):
        path = request.path
        if path.startswith(self.allow_prefixes) or path.startswith(self.admin_allow):
            return self.get_response(request)
        if not request.user.is_authenticated:
            login_url = reverse("account_login")
            return redirect(f"{login_url}?next={request.get_full_path()}")
        return self.get_response(request)
