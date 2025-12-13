from __future__ import annotations

import json
import os
from decimal import Decimal
from typing import Any, Dict, List

from django.db import transaction
from django.http import HttpRequest, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import (
    require_GET,
    require_POST,
    require_http_methods,
)

from .models import Portfolio, Position
from .views import _get_authenticated_user, _get_or_create_default_portfolio

DEFAULT_INITIAL_CASH = Decimal(
    os.environ.get("FB_DEFAULT_PORTFOLIO_CASH", "100000.00")
)


def _serialize_portfolio(portfolio: Portfolio) -> Dict[str, Any]:
    return {
        "id": portfolio.id,
        "name": portfolio.name,
        "currency": portfolio.currency,
        "initial_cash": float(portfolio.initial_cash),
        "cash_balance": float(portfolio.cash_balance),
        "is_default": bool(portfolio.is_default),
        "is_active": bool(portfolio.is_active),
        "created_at": portfolio.created_at.isoformat(),
        "updated_at": portfolio.updated_at.isoformat(),
        "archived_at": portfolio.archived_at.isoformat()
        if portfolio.archived_at
        else None,
    }


@require_GET
def list_portfolios(request: HttpRequest) -> JsonResponse:
    """
    GET /api/portfolios/

    Returns all non-archived portfolios for the authenticated user.
    """
    user, error_response = _get_authenticated_user(request)
    if error_response is not None:
        return error_response

    portfolios = (
        Portfolio.objects.filter(
            user=user,
            is_active=True,
            archived_at__isnull=True,
        )
        .order_by("-is_default", "created_at", "id")
    )

    payload = [_serialize_portfolio(p) for p in portfolios]

    return JsonResponse(
        {"portfolios": payload, "count": len(payload)}, status=200
    )


@csrf_exempt
@require_POST
def create_portfolio(request: HttpRequest) -> JsonResponse:
    """
    POST /api/portfolios/create/

    Body:
      - name: string
      - initial_cash: number
      - currency: optional string (default "USD")
      - set_as_default: optional boolean
    """
    user, error_response = _get_authenticated_user(request)
    if error_response is not None:
        return error_response

    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    name = (data.get("name") or "").strip()
    initial_cash_raw = data.get("initial_cash")
    currency = (data.get("currency") or "USD").upper().strip() or "USD"
    set_as_default = bool(data.get("set_as_default") or False)

    if not name:
        return JsonResponse({"error": "name is required"}, status=400)
    if initial_cash_raw is None:
        return JsonResponse(
            {"error": "initial_cash is required"},
            status=400,
        )

    try:
        initial_cash = Decimal(str(initial_cash_raw))
    except Exception:
        return JsonResponse(
            {"error": "initial_cash must be numeric"},
            status=400,
        )

    if initial_cash <= 0:
        return JsonResponse(
            {"error": "initial_cash must be positive"},
            status=400,
        )

    has_existing = Portfolio.objects.filter(
        user=user,
        is_active=True,
        archived_at__isnull=True,
    ).exists()

    is_default = set_as_default or not has_existing

    with transaction.atomic():
        portfolio = Portfolio.objects.create(
            user=user,
            name=name,
            initial_cash=initial_cash,
            cash_balance=initial_cash,
            currency=currency,
            is_default=is_default,
            is_active=True,
        )

    return JsonResponse(
        {
            "portfolio": _serialize_portfolio(portfolio),
            "message": f'Created portfolio "{portfolio.name}".',
        },
        status=201,
    )


@csrf_exempt
@require_http_methods(["PATCH", "DELETE"])
def portfolio_detail(
    request: HttpRequest, portfolio_id: int
) -> JsonResponse:
    """
    PATCH /api/portfolios/<id>/
      Body: { "name": "New Name" }

    DELETE /api/portfolios/<id>/
      Soft-deletes (archives) the portfolio.
    """
    user, error_response = _get_authenticated_user(request)
    if error_response is not None:
        return error_response

    try:
        portfolio = Portfolio.objects.get(
            id=portfolio_id,
            user=user,
            is_active=True,
        )
    except Portfolio.DoesNotExist:
        return JsonResponse({"error": "Portfolio not found"}, status=404)

    if request.method == "PATCH":
        try:
            data = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON body"}, status=400)

        name = (data.get("name") or "").strip()
        if not name:
            return JsonResponse(
                {"error": "name is required"},
                status=400,
            )

        portfolio.name = name
        portfolio.save(update_fields=["name", "updated_at"])

        return JsonResponse(
            {
                "portfolio": _serialize_portfolio(portfolio),
                "message": "Portfolio renamed.",
            }
        )

    now = timezone.now()
    portfolio.archived_at = now
    portfolio.is_active = False
    portfolio.is_default = False
    portfolio.save(update_fields=["archived_at", "is_active", "is_default"])

    remaining = Portfolio.objects.filter(
        user=user,
        is_active=True,
        archived_at__isnull=True,
    ).order_by("created_at", "id")

    remaining_default = (
        remaining.filter(is_default=True).first()
    )
    if remaining.exists() and remaining_default is None:
        new_default = remaining.first()
        new_default.is_default = True
        new_default.save(update_fields=["is_default"])

    return JsonResponse(
        {
            "portfolio_id": portfolio_id,
            "message": "Portfolio archived.",
        }
    )


@csrf_exempt
@require_POST
def set_default_portfolio(
    request: HttpRequest, portfolio_id: int
) -> JsonResponse:
    """
    POST /api/portfolios/<id>/set_default/
    """
    user, error_response = _get_authenticated_user(request)
    if error_response is not None:
        return error_response

    try:
        portfolio = Portfolio.objects.get(
            id=portfolio_id,
            user=user,
            is_active=True,
            archived_at__isnull=True,
        )
    except Portfolio.DoesNotExist:
        return JsonResponse({"error": "Portfolio not found"}, status=404)

    with transaction.atomic():
        portfolio.is_default = True
        portfolio.save(update_fields=["is_default"])

    return JsonResponse(
        {
            "portfolio": _serialize_portfolio(portfolio),
            "message": f'Set "{portfolio.name}" as default portfolio.',
        }
    )
