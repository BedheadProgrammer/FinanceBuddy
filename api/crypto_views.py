from __future__ import annotations

import json
from decimal import Decimal
from typing import Any, Dict, List, Optional

from django.db import transaction
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .crypto_market_data import (
    get_crypto_current_prices,
    get_crypto_spot,
    list_crypto_assets,
    normalize_crypto_symbol,
)
from .models import CryptoPosition, CryptoTrade, Portfolio
from .views import _get_authenticated_user, _get_or_create_default_portfolio


def _get_portfolio_for_user(user, portfolio_id: Optional[int]) -> Portfolio:
    if portfolio_id is None:
        return _get_or_create_default_portfolio(user)

    return Portfolio.objects.get(
        id=portfolio_id,
        user=user,
        is_active=True,
        archived_at__isnull=True,
    )


@require_GET
def crypto_assets(request: HttpRequest) -> JsonResponse:
    user, error_response = _get_authenticated_user(request)
    if error_response is not None:
        return error_response

    try:
        assets = list_crypto_assets(tradable_only=True, status="active")
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=502)

    payload: List[Dict[str, Any]] = []
    for a in assets:
        if not isinstance(a, dict):
            continue
        payload.append(
            {
                "id": a.get("id"),
                "symbol": a.get("symbol"),
                "name": a.get("name"),
                "status": a.get("status"),
                "tradable": bool(a.get("tradable")),
                "exchange": a.get("exchange"),
                "class": a.get("class"),
            }
        )

    return JsonResponse({"assets": payload})


@require_GET
def crypto_prices(request: HttpRequest) -> JsonResponse:
    user, error_response = _get_authenticated_user(request)
    if error_response is not None:
        return error_response

    raw = request.GET.get("symbols", "") or ""
    symbols = [s.strip() for s in raw.split(",") if s.strip()]

    if not symbols:
        return JsonResponse({"error": "symbols query param is required"}, status=400)

    try:
        data = get_crypto_current_prices(symbols)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=502)

    return JsonResponse(data)


@require_GET
def crypto_positions(request: HttpRequest) -> JsonResponse:
    user, error_response = _get_authenticated_user(request)
    if error_response is not None:
        return error_response

    portfolio_id_raw = request.GET.get("portfolio_id")
    portfolio_id: Optional[int] = None
    if portfolio_id_raw:
        try:
            portfolio_id = int(portfolio_id_raw)
        except ValueError:
            return JsonResponse({"error": "Invalid portfolio_id"}, status=400)

    try:
        portfolio = _get_portfolio_for_user(user, portfolio_id)
    except Portfolio.DoesNotExist:
        return JsonResponse({"error": "Portfolio not found"}, status=404)

    positions_qs = CryptoPosition.objects.filter(portfolio=portfolio).order_by("symbol")

    symbols = [p.symbol for p in positions_qs]
    prices: Dict[str, Dict[str, Any]] = {}
    if symbols:
        try:
            prices = get_crypto_current_prices(symbols)
        except Exception:
            prices = {}

    positions: List[Dict[str, Any]] = []
    for p in positions_qs:
        info = prices.get(p.symbol) or {}
        px = info.get("price")
        market_price = Decimal(str(px)) if px is not None else None
        market_value = (market_price * p.quantity) if market_price is not None else None
        unrealized_pl = (p.quantity * (market_price - p.avg_cost)) if market_price is not None else None

        positions.append(
            {
                "id": p.id,
                "portfolio_id": portfolio.id,
                "symbol": p.symbol,
                "quantity": str(p.quantity),
                "avg_cost": str(p.avg_cost),
                "market_price": str(market_price) if market_price is not None else None,
                "market_value": str(market_value) if market_value is not None else None,
                "unrealized_pl": str(unrealized_pl) if unrealized_pl is not None else None,
                "last_updated": p.last_updated.isoformat(),
            }
        )

    return JsonResponse(
        {
            "portfolio": {"id": portfolio.id, "cash_balance": str(portfolio.cash_balance)},
            "positions": positions,
        }
    )


@require_GET
def crypto_trades(request: HttpRequest) -> JsonResponse:
    user, error_response = _get_authenticated_user(request)
    if error_response is not None:
        return error_response

    portfolio_id_raw = request.GET.get("portfolio_id")
    portfolio_id: Optional[int] = None
    if portfolio_id_raw:
        try:
            portfolio_id = int(portfolio_id_raw)
        except ValueError:
            return JsonResponse({"error": "Invalid portfolio_id"}, status=400)

    try:
        portfolio = _get_portfolio_for_user(user, portfolio_id)
    except Portfolio.DoesNotExist:
        return JsonResponse({"error": "Portfolio not found"}, status=404)

    trades_qs = CryptoTrade.objects.filter(portfolio=portfolio).order_by("-executed_at", "-id")

    trades: List[Dict[str, Any]] = []
    for t in trades_qs:
        trades.append(
            {
                "id": t.id,
                "portfolio_id": portfolio.id,
                "symbol": t.symbol,
                "side": t.side,
                "quantity": str(t.quantity),
                "price": str(t.price),
                "fees": str(t.fees),
                "realized_pl": str(t.realized_pl) if t.realized_pl is not None else None,
                "order_type": t.order_type,
                "status": t.status,
                "executed_at": t.executed_at.isoformat(),
                "created_at": t.created_at.isoformat(),
            }
        )

    return JsonResponse(
        {
            "portfolio": {"id": portfolio.id, "cash_balance": str(portfolio.cash_balance)},
            "trades": trades,
        }
    )


@csrf_exempt
@require_POST
def crypto_trade(request: HttpRequest) -> JsonResponse:
    user, error_response = _get_authenticated_user(request)
    if error_response is not None:
        return error_response

    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    symbol_raw = data.get("symbol")
    side = str(data.get("side") or "").upper().strip()
    quantity_raw = data.get("quantity")
    portfolio_id_raw = data.get("portfolio_id")
    price_raw = data.get("price")
    fees_raw = data.get("fees")
    order_type = str(data.get("order_type") or "MARKET").upper().strip()

    if symbol_raw is None:
        return JsonResponse({"error": "symbol is required"}, status=400)

    try:
        symbol = normalize_crypto_symbol(str(symbol_raw))
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    if side not in {CryptoTrade.Side.BUY, CryptoTrade.Side.SELL}:
        return JsonResponse({"error": "side must be BUY or SELL"}, status=400)

    if quantity_raw is None:
        return JsonResponse({"error": "quantity is required"}, status=400)
    try:
        quantity = Decimal(str(quantity_raw))
    except Exception:
        return JsonResponse({"error": "quantity must be numeric"}, status=400)
    if quantity <= 0:
        return JsonResponse({"error": "quantity must be positive"}, status=400)

    portfolio_id: Optional[int] = None
    if portfolio_id_raw is not None and str(portfolio_id_raw).strip() != "":
        try:
            portfolio_id = int(portfolio_id_raw)
        except Exception:
            return JsonResponse({"error": "portfolio_id must be an integer"}, status=400)

    if order_type not in {CryptoTrade.OrderType.MARKET, CryptoTrade.OrderType.LIMIT}:
        return JsonResponse({"error": "order_type must be MARKET or LIMIT"}, status=400)

    fees = Decimal("0")
    if fees_raw is not None:
        try:
            fees = Decimal(str(fees_raw))
        except Exception:
            return JsonResponse({"error": "fees must be numeric"}, status=400)
        if fees < 0:
            return JsonResponse({"error": "fees cannot be negative"}, status=400)

    if order_type == CryptoTrade.OrderType.LIMIT:
        if price_raw is None:
            return JsonResponse({"error": "price is required for LIMIT orders"}, status=400)
        try:
            price = Decimal(str(price_raw))
        except Exception:
            return JsonResponse({"error": "price must be numeric"}, status=400)
        if price <= 0:
            return JsonResponse({"error": "price must be positive"}, status=400)
    else:
        try:
            spot = get_crypto_spot(symbol)
        except Exception as exc:
            return JsonResponse({"error": f"Could not fetch crypto market price: {exc}"}, status=502)
        price = Decimal(str(spot))
        if price <= 0:
            return JsonResponse({"error": "No valid market price available"}, status=502)

    try:
        portfolio = _get_portfolio_for_user(user, portfolio_id)
    except Portfolio.DoesNotExist:
        return JsonResponse({"error": "Portfolio not found"}, status=404)

    with transaction.atomic():
        portfolio.refresh_from_db(fields=["cash_balance"])

        position = CryptoPosition.objects.select_for_update().filter(
            portfolio=portfolio,
            symbol=symbol,
        ).first()

        if side == CryptoTrade.Side.BUY:
            cost = quantity * price + fees
            if portfolio.cash_balance - cost < 0:
                return JsonResponse({"error": "Insufficient cash to execute this trade"}, status=400)

            portfolio.cash_balance = portfolio.cash_balance - cost
            portfolio.save(update_fields=["cash_balance"])

            if position is None:
                position = CryptoPosition.objects.create(
                    portfolio=portfolio,
                    symbol=symbol,
                    quantity=quantity,
                    avg_cost=price,
                )
            else:
                new_qty = position.quantity + quantity
                if new_qty <= 0:
                    return JsonResponse({"error": "Resulting position quantity would be non-positive"}, status=400)
                new_avg = (position.quantity * position.avg_cost + quantity * price) / new_qty
                position.quantity = new_qty
                position.avg_cost = new_avg
                position.save(update_fields=["quantity", "avg_cost", "last_updated"])

            trade = CryptoTrade.objects.create(
                portfolio=portfolio,
                symbol=symbol,
                side=side,
                quantity=quantity,
                price=price,
                fees=fees,
                order_type=order_type,
                status=CryptoTrade.Status.FILLED,
                realized_pl=None,
            )

        else:
            if position is None:
                return JsonResponse({"error": "Cannot sell a symbol you do not hold"}, status=400)
            if position.quantity < quantity:
                return JsonResponse({"error": "Cannot sell more than current position quantity"}, status=400)

            proceeds = quantity * price - fees
            portfolio.cash_balance = portfolio.cash_balance + proceeds
            portfolio.save(update_fields=["cash_balance"])

            realized_pl = (price - position.avg_cost) * quantity - fees

            new_qty = position.quantity - quantity
            if new_qty == 0:
                position.delete()
                position_payload = None
            else:
                position.quantity = new_qty
                position.save(update_fields=["quantity", "last_updated"])
                position_payload = {
                    "id": position.id,
                    "portfolio_id": portfolio.id,
                    "symbol": position.symbol,
                    "quantity": str(position.quantity),
                    "avg_cost": str(position.avg_cost),
                    "last_updated": position.last_updated.isoformat(),
                }

            trade = CryptoTrade.objects.create(
                portfolio=portfolio,
                symbol=symbol,
                side=side,
                quantity=quantity,
                price=price,
                fees=fees,
                order_type=order_type,
                status=CryptoTrade.Status.FILLED,
                realized_pl=realized_pl,
            )

            return JsonResponse(
                {
                    "trade": {
                        "id": trade.id,
                        "portfolio_id": portfolio.id,
                        "symbol": trade.symbol,
                        "side": trade.side,
                        "quantity": str(trade.quantity),
                        "price": str(trade.price),
                        "fees": str(trade.fees),
                        "realized_pl": str(trade.realized_pl) if trade.realized_pl is not None else None,
                        "order_type": trade.order_type,
                        "status": trade.status,
                        "executed_at": trade.executed_at.isoformat(),
                        "created_at": trade.created_at.isoformat(),
                    },
                    "portfolio": {"id": portfolio.id, "cash_balance": str(portfolio.cash_balance)},
                    "position": position_payload,
                },
                status=201,
            )

        position.refresh_from_db()
        return JsonResponse(
            {
                "trade": {
                    "id": trade.id,
                    "portfolio_id": portfolio.id,
                    "symbol": trade.symbol,
                    "side": trade.side,
                    "quantity": str(trade.quantity),
                    "price": str(trade.price),
                    "fees": str(trade.fees),
                    "realized_pl": str(trade.realized_pl) if trade.realized_pl is not None else None,
                    "order_type": trade.order_type,
                    "status": trade.status,
                    "executed_at": trade.executed_at.isoformat(),
                    "created_at": trade.created_at.isoformat(),
                },
                "portfolio": {"id": portfolio.id, "cash_balance": str(portfolio.cash_balance)},
                "position": {
                    "id": position.id,
                    "portfolio_id": portfolio.id,
                    "symbol": position.symbol,
                    "quantity": str(position.quantity),
                    "avg_cost": str(position.avg_cost),
                    "last_updated": position.last_updated.isoformat(),
                },
            },
            status=201,
        )
