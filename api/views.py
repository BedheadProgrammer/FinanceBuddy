# api/views.py
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from BE1.MRKT_WTCH import get_current_prices, POPULAR

@require_GET
def prices(request):
    raw = request.GET.get("symbols", "")
    symbols = [s.strip().upper() for s in raw.split(",") if s.strip()] or POPULAR
    data = get_current_prices(symbols)
    return JsonResponse(data)
