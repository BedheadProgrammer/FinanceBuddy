# api/views.py
from __future__ import annotations

import json
import os
from typing import Dict, List

from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from BE1.MRKT_WTCH import get_current_prices, POPULAR



@require_GET
def prices(request: HttpRequest) -> JsonResponse:
    """
    Market prices endpoint used by the Dashboard.
    """
    raw = request.GET.get("symbols", "")
    symbols = [s.strip().upper() for s in raw.split(",") if s.strip()] or POPULAR
    data = get_current_prices(symbols)
    return JsonResponse(data)


