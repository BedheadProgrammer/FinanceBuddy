from django.views import View
from django.shortcuts import render, redirect
from django.contrib import messages

# Make sure BE1 is a Python package: BE1/__init__.py exists
# MRKT_WTCH must expose get_current_prices(...) and POPULAR
from BE1.MRKT_WTCH import get_current_prices, POPULAR  # adjust if your filename differs

from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render, redirect
from django.contrib import messages
from BE1.MRKT_WTCH import get_current_prices, POPULAR

class HomeView(LoginRequiredMixin, View):
    template_name = "optnstrdr/home.html"

    def get(self, request):
        return render(request, self.template_name, {"results": None})

    def post(self, request):
        symbols = POPULAR if "popular" in request.POST else [
            s.strip() for s in request.POST.get("symbols", "").split(",") if s.strip()
        ]
        try:
            results = get_current_prices(symbols)
        except RuntimeError as e:
            messages.error(request, str(e))
            return redirect("optnstrdr:home")
        return render(request, self.template_name, {"results": results})
