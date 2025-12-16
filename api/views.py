from __future__ import annotations
from .models import Portfolio, Position, Trade, CryptoPosition
from .market_data import get_current_prices, POPULAR
from .crypto_market_data import get_crypto_current_prices
from optnstrdr.models import OptionPosition
import json
import os
from typing import Dict, List, Any
from decimal import Decimal

from openai import OpenAI
from dotenv import load_dotenv

from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from django.db import transaction

load_dotenv()
DEFAULT_INITIAL_CASH = Decimal(os.environ.get("FB_DEFAULT_PORTFOLIO_CASH", "100000.00"))
client = OpenAI()


@require_GET
def prices(request: HttpRequest) -> JsonResponse:
    raw = request.GET.get("symbols", "")
    symbols = [s.strip().upper() for s in raw.split(",") if s.strip()] or POPULAR
    data = get_current_prices(symbols)
    return JsonResponse(data)


def _parse_messages(payload: Dict[str, Any]) -> List[Dict[str, str]]:
    raw_messages = payload.get("messages")
    single_message = payload.get("message")

    user_messages: List[Dict[str, str]] = []

    if isinstance(raw_messages, list) and raw_messages:
        for m in raw_messages:
            role = m.get("role")
            content = str(m.get("content") or "").strip()
            if role in ("user", "assistant") and content:
                user_messages.append({"role": role, "content": content})
    elif isinstance(single_message, str) and single_message.strip():
        user_messages.append({"role": "user", "content": single_message.strip()})

    return user_messages


@csrf_exempt
@require_POST
def american_assistant(request: HttpRequest) -> JsonResponse:
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    snapshot = payload.get("snapshot")
    if not isinstance(snapshot, dict):
        return JsonResponse({"error": "Missing or invalid 'snapshot' object"}, status=400)

    messages = _parse_messages(payload)

    system_prompt = (
        "You are FinanceBud, an options-education assistant inside the FinanceBuddy app. "
        "You receive snapshots of American option pricing runs as JSON and explain them to the user. "
        "The snapshot has: inputs (stock price, strike, volatility, time to expiry, rates, dividends, side, symbol, expiry), "
        "pricing outputs (fair_value, intrinsic_value, time_value), and greeks (delta, gamma, theta, vega, rho). "
        "When you structure your response, use real-world names and explain intuition and risk. Keep answers concise."
    )

    snapshot_text = json.dumps(snapshot, separators=(",", ":"), ensure_ascii=False)

    openai_messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]
    openai_messages.append({"role": "system", "content": f"Snapshot JSON: {snapshot_text}"})
    openai_messages.extend(messages)

    try:
        resp = client.chat.completions.create(
            model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            messages=openai_messages,
            temperature=0.3,
            max_tokens=700,
        )
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)

    reply_text = None
    try:
        if resp and resp.choices:
            first = resp.choices[0]
            if first and getattr(first, "message", None) and getattr(first.message, "content", None):
                reply_text = first.message.content
    except Exception:
        reply_text = None

    if not reply_text:
        return JsonResponse({"error": "Assistant returned no text"}, status=500)

    return JsonResponse({"reply": reply_text})


@csrf_exempt
@require_POST
def euro_assistant(request: HttpRequest) -> JsonResponse:
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    snapshot = payload.get("snapshot")
    if not isinstance(snapshot, dict):
        return JsonResponse({"error": "Missing or invalid 'snapshot' object"}, status=400)

    messages = _parse_messages(payload)

    system_prompt = (
        "You are FinanceBud, an options-education assistant inside the FinanceBuddy app. "
        "You receive snapshots of European option pricing runs as JSON and explain them to the user. "
        "The snapshot has two keys: 'inputs' (pricing inputs like S, K, r, q, sigma, T, side, symbol, expiry, d1, d2) "
        "and 'greeks' (fair_value, delta, gamma, theta, vega, rho).  When you structure your response give the real "
        "world names (stock price, strike price, volatility, time to expiration, etc.) not the raw data field names "
        "from the JSON. Explain what the numbers mean in plain English, focusing on intuition and risk. Keep answers "
        "concise and structured with short paragraphs or bullet points."
    )

    snapshot_text = json.dumps(snapshot, separators=(",", ":"), ensure_ascii=False)

    openai_messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]
    openai_messages.append({"role": "system", "content": f"Snapshot JSON: {snapshot_text}"})
    openai_messages.extend(messages)

    try:
        resp = client.chat.completions.create(
            model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            messages=openai_messages,
            temperature=0.3,
            max_tokens=700,
        )
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)

    reply_text = None
    try:
        if resp and resp.choices:
            first = resp.choices[0]
            if first and getattr(first, "message", None) and getattr(first.message, "content", None):
                reply_text = first.message.content
    except Exception:
        reply_text = None

    if not reply_text:
        return JsonResponse({"error": "Assistant returned no text"}, status=500)

    return JsonResponse({"reply": reply_text})


def _get_authenticated_user(request: HttpRequest):
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return None, JsonResponse({"error": "Authentication required"}, status=401)
    return user, None


def _get_or_create_default_portfolio(user) -> Portfolio:
    """
    Return the user's default, active (non-archived) portfolio, creating one if needed.
    """
    base_qs = Portfolio.objects.filter(
        user=user,
        is_active=True,
        archived_at__isnull=True,
    )

    portfolio = base_qs.filter(is_default=True).order_by("created_at", "id").first()

    if portfolio is None:
        portfolio = base_qs.order_by("created_at", "id").first()

    if portfolio is None:
        portfolio = Portfolio.objects.create(
            user=user,
            name="Default Portfolio",
            initial_cash=DEFAULT_INITIAL_CASH,
            cash_balance=DEFAULT_INITIAL_CASH,
            is_default=True,
        )

    return portfolio


@require_GET
def portfolio_summary(request: HttpRequest) -> JsonResponse:
    """
    GET /api/portfolio/summary/

    Query params:
      - portfolio_id (optional): fetch a specific portfolio for this user.
        If omitted, we fall back to that user's default portfolio.
    """
    user, error_response = _get_authenticated_user(request)
    if error_response is not None:
        return error_response

    portfolio_id_raw = request.GET.get("portfolio_id")
    if portfolio_id_raw:
        try:
            portfolio_id = int(portfolio_id_raw)
        except ValueError:
            return JsonResponse({"error": "Invalid portfolio_id"}, status=400)
        try:
            portfolio = Portfolio.objects.get(
                id=portfolio_id,
                user=user,
                is_active=True,
                archived_at__isnull=True,
            )
        except Portfolio.DoesNotExist:
            return JsonResponse({"error": "Portfolio not found"}, status=404)
    else:
        portfolio = _get_or_create_default_portfolio(user)

    positions = Position.objects.filter(portfolio=portfolio)
    symbols = [p.symbol for p in positions]

    market_data: Dict[str, Dict[str, Any]] = {}
    market_error: str | None = None

    if symbols:
        try:
            market_data = get_current_prices(symbols)
        except RuntimeError as exc:
            market_error = str(exc)
            market_data = {}

    positions_payload: List[Dict[str, Any]] = []
    total_positions_value = Decimal("0")

    for pos in positions:
        info = market_data.get(pos.symbol) or {}
        price_val = info.get("price")

        if price_val is None:
            market_price = None
            market_value = None
            unrealized_pnl = None
        else:
            market_price = Decimal(str(price_val))
            market_value = market_price * pos.quantity
            cost_basis = pos.avg_cost * pos.quantity
            unrealized_pnl = market_value - cost_basis
            total_positions_value += market_value

        positions_payload.append(
            {
                "id": pos.id,
                "symbol": pos.symbol,
                "quantity": float(pos.quantity),
                "avg_cost": float(pos.avg_cost),
                "market_price": float(market_price) if market_price is not None else None,
                "market_value": float(market_value) if market_value is not None else None,
                "unrealized_pnl": float(unrealized_pnl) if unrealized_pnl is not None else None,
            }
        )

    options_total_value = Decimal("0")
    option_positions_qs = OptionPosition.objects.filter(portfolio=portfolio).select_related("contract")

    for opt_pos in option_positions_qs:
        qty = opt_pos.quantity
        cost = opt_pos.avg_cost
        mult_int = opt_pos.contract.multiplier or 0
        mult = Decimal(str(mult_int))
        options_total_value += qty * cost * mult

    total_positions_value += options_total_value

    crypto_positions_qs = CryptoPosition.objects.filter(portfolio=portfolio)
    crypto_symbols = [p.symbol for p in crypto_positions_qs]

    crypto_market_data: Dict[str, Dict[str, Any]] = {}
    crypto_market_error: str | None = None
    crypto_positions_value = Decimal("0")
    crypto_unrealized_pl = Decimal("0")

    if crypto_symbols:
        try:
            crypto_market_data = get_crypto_current_prices(crypto_symbols)
        except Exception as exc:
            crypto_market_error = str(exc)
            crypto_market_data = {}

    for cpos in crypto_positions_qs:
        info = crypto_market_data.get(cpos.symbol) or {}
        price_val = info.get("price")
        if price_val is None:
            continue
        market_price = Decimal(str(price_val))
        market_value = market_price * cpos.quantity
        crypto_positions_value += market_value
        crypto_unrealized_pl += cpos.quantity * (market_price - cpos.avg_cost)

    total_equity = portfolio.cash_balance + total_positions_value + crypto_positions_value

    return JsonResponse(
        {
            "portfolio": {
                "id": portfolio.id,
                "name": portfolio.name,
                "currency": portfolio.currency,
                "initial_cash": float(portfolio.initial_cash),
                "cash_balance": float(portfolio.cash_balance),
                "positions_value": float(total_positions_value),
                "crypto_positions_value": float(crypto_positions_value),
                "crypto_unrealized_pl": float(crypto_unrealized_pl),
                "total_equity": float(total_equity),
                "is_default": bool(portfolio.is_default),
                "created_at": portfolio.created_at.isoformat(),
            },
            "positions": positions_payload,
            "market_error": market_error,
            "crypto_market_error": crypto_market_error,
        }
    )


@csrf_exempt
@require_POST
def create_portfolio(request: HttpRequest) -> JsonResponse:
    user, error_response = _get_authenticated_user(request)
    if error_response is not None:
        return error_response

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    name = str(payload.get("name") or "").strip()
    if not name:
        return JsonResponse({"error": "name is required"}, status=400)

    initial_cash_raw = payload.get("initial_cash")
    if initial_cash_raw is None:
        return JsonResponse({"error": "initial_cash is required"}, status=400)
    try:
        initial_cash = Decimal(str(initial_cash_raw))
    except Exception:
        return JsonResponse({"error": "initial_cash must be numeric"}, status=400)
    if initial_cash <= 0:
        return JsonResponse({"error": "initial_cash must be positive"}, status=400)

    currency = str(payload.get("currency") or "USD").strip().upper()
    if len(currency) != 3:
        return JsonResponse({"error": "currency must be a 3-letter code"}, status=400)

    is_default = bool(payload.get("is_default", False))

    with transaction.atomic():
        if is_default:
            Portfolio.objects.filter(
                user=user,
                is_default=True,
                archived_at__isnull=True,
            ).update(is_default=False)

        portfolio = Portfolio.objects.create(
            user=user,
            name=name,
            initial_cash=initial_cash,
            cash_balance=initial_cash,
            currency=currency,
            is_default=is_default,
        )

    return JsonResponse(
        {
            "ok": True,
            "portfolio": {
                "id": portfolio.id,
                "name": portfolio.name,
                "currency": portfolio.currency,
                "initial_cash": float(portfolio.initial_cash),
                "cash_balance": float(portfolio.cash_balance),
                "is_default": bool(portfolio.is_default),
                "created_at": portfolio.created_at.isoformat(),
            },
        },
        status=201,
    )


@csrf_exempt
@require_POST
def execute_trade(request: HttpRequest) -> JsonResponse:
    user, error_response = _get_authenticated_user(request)
    if error_response is not None:
        return error_response

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"ok": False, "error": "Invalid JSON payload"}, status=400)

    symbol = str(payload.get("symbol") or "").strip().upper()
    if not symbol:
        return JsonResponse({"ok": False, "error": "symbol is required"}, status=400)

    side = str(payload.get("side") or "").strip().upper()
    if side not in (Trade.Side.BUY, Trade.Side.SELL):
        return JsonResponse({"ok": False, "error": "side must be BUY or SELL"}, status=400)

    qty_raw = payload.get("quantity")
    if qty_raw is None:
        return JsonResponse({"ok": False, "error": "quantity is required"}, status=400)

    try:
        quantity = Decimal(str(qty_raw))
    except Exception:
        return JsonResponse({"ok": False, "error": "quantity must be numeric"}, status=400)

    if quantity <= 0:
        return JsonResponse({"ok": False, "error": "quantity must be positive"}, status=400)

    order_type = str(payload.get("order_type") or Trade.OrderType.MARKET).strip().upper()
    if order_type not in (Trade.OrderType.MARKET, Trade.OrderType.LIMIT):
        return JsonResponse({"ok": False, "error": "order_type must be MARKET or LIMIT"}, status=400)

    limit_price_raw = payload.get("price")
    fees_raw = payload.get("fees")

    fees = Decimal("0.00")
    if fees_raw is not None:
        try:
            fees = Decimal(str(fees_raw))
        except Exception:
            return JsonResponse({"ok": False, "error": "fees must be numeric"}, status=400)
        if fees < 0:
            return JsonResponse({"ok": False, "error": "fees cannot be negative"}, status=400)

    if order_type == Trade.OrderType.LIMIT:
        if limit_price_raw is None:
            return JsonResponse({"ok": False, "error": "price is required for LIMIT orders"}, status=400)
        try:
            price = Decimal(str(limit_price_raw))
        except Exception:
            return JsonResponse({"ok": False, "error": "price must be numeric"}, status=400)
        if price <= 0:
            return JsonResponse({"ok": False, "error": "price must be positive"}, status=400)
    else:
        market_data = get_current_prices([symbol]).get(symbol) or {}
        price_val = market_data.get("price")
        if price_val is None:
            return JsonResponse(
                {"ok": False, "error": market_data.get("error") or "Could not fetch market price"},
                status=502,
            )
        price = Decimal(str(price_val))
        if price <= 0:
            return JsonResponse({"ok": False, "error": "No valid market price"}, status=502)

    portfolio_id_raw = payload.get("portfolio_id")
    if portfolio_id_raw:
        try:
            portfolio_id = int(portfolio_id_raw)
        except ValueError:
            return JsonResponse({"ok": False, "error": "Invalid portfolio_id"}, status=400)
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id, user=user)
        except Portfolio.DoesNotExist:
            return JsonResponse({"ok": False, "error": "Portfolio not found"}, status=404)
    else:
        portfolio = _get_or_create_default_portfolio(user)

    with transaction.atomic():
        portfolio.refresh_from_db(fields=["cash_balance"])
        position = Position.objects.select_for_update().filter(portfolio=portfolio, symbol=symbol).first()

        if side == Trade.Side.BUY:
            cost = quantity * price + fees
            if portfolio.cash_balance - cost < 0:
                return JsonResponse({"ok": False, "error": "Insufficient cash"}, status=400)

            portfolio.cash_balance -= cost
            portfolio.save(update_fields=["cash_balance"])

            if position is None:
                position = Position.objects.create(
                    portfolio=portfolio,
                    symbol=symbol,
                    quantity=quantity,
                    avg_cost=price,
                )
            else:
                new_qty = position.quantity + quantity
                new_avg = (position.quantity * position.avg_cost + quantity * price) / new_qty
                position.quantity = new_qty
                position.avg_cost = new_avg
                position.save(update_fields=["quantity", "avg_cost", "last_updated"])

            trade = Trade.objects.create(
                portfolio=portfolio,
                symbol=symbol,
                side=side,
                quantity=quantity,
                price=price,
                fees=fees,
                order_type=order_type,
                status=Trade.Status.FILLED,
            )
        else:
            if position is None or position.quantity < quantity:
                return JsonResponse({"ok": False, "error": "Insufficient shares to sell"}, status=400)

            proceeds = quantity * price - fees
            portfolio.cash_balance += proceeds
            portfolio.save(update_fields=["cash_balance"])

            position.quantity -= quantity
            if position.quantity == 0:
                position.delete()
            else:
                position.save(update_fields=["quantity", "last_updated"])

            trade = Trade.objects.create(
                portfolio=portfolio,
                symbol=symbol,
                side=side,
                quantity=quantity,
                price=price,
                fees=fees,
                order_type=order_type,
                status=Trade.Status.FILLED,
            )

    return JsonResponse(
        {
            "ok": True,
            "trade": {
                "id": trade.id,
                "symbol": trade.symbol,
                "side": trade.side,
                "quantity": float(trade.quantity),
                "price": float(trade.price),
                "fees": float(trade.fees),
                "created_at": trade.created_at.isoformat(),
            },
            "portfolio": {
                "id": portfolio.id,
                "cash_balance": float(portfolio.cash_balance),
            },
        },
        status=201,
    )
