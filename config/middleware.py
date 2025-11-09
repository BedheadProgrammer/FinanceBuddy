# config/middleware.py
from django.shortcuts import redirect
from django.urls import reverse
from django.conf import settings

class LoginRequiredMiddleware:
    """
    Require authentication for all requests except an allowlist of paths.
    Keeps login as the landing page while allowing public endpoints/assets.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        # Public prefixes (adjust as needed)
        static_url = (getattr(settings, "STATIC_URL", "/static/") or "/static/")
        self.allow_prefixes = tuple([
            "/accounts/",      # allauth (login, signup, etc.)
            "/api/prices",     # public quotes API
            "/api/euro/",      # European options API
            "/api/american/",  # American options API
            "/assets/",        # Vite built assets
            "/vite.svg",       # Vite icon
            static_url.rstrip("/"),
        ])
        self.admin_allow = ("/admin/login", "/admin/logout", "/admin/password_reset")

    def __call__(self, request):
        path = request.path
        if path.startswith(self.allow_prefixes) or path.startswith(self.admin_allow):
            return self.get_response(request)

        if not request.user.is_authenticated:
            login_url = reverse("account_login")  # allauth named route
            return redirect(f"{login_url}?next={request.get_full_path()}")

        return self.get_response(request)
