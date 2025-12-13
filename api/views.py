from __future__ import annotations
from .models import Portfolio, Position, Trade
from .market_data import get_current_prices, POPULAR
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


@csrf_exempt
@require_POST
def american_assistant(request: HttpRequest) -> JsonResponse:
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    snapshot = payload.get("snapshot")
    if not isinstance(snapshot, dict):
        return JsonResponse(
            {
                "error": "snapshot with inputs and american_result is required",
            },
            status=400,
        )

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
    else:
        return JsonResponse({"error": "message or messages is required"}, status=400)

    system_prompt = (
        "You are FinanceBud, an options-education assistant inside the FinanceBuddy app. "
        "You receive snapshots of American option pricing runs as JSON and explain them to the user. "
        "The snapshot has two keys: 'inputs' (pricing inputs like S, K, r, q, sigma, T, side, symbol, "
        "as_of, expiry, d1, d2) and 'american_result' (american_price, european_price, "
        "early_exercise_premium, critical_price).  When you structure your response give the real world "
        "names (stock price, strike price, volatility, time to expiration, etc.) not the raw data field "
        "names from the JSON. Explain what the numbers mean in plain English, focusing on intuition, risk, "
        "and exercise logic. Keep answers concise and structured with short paragraphs or bullet points."
    )

    snapshot_text = json.dumps(snapshot, separators=(",", ":"), ensure_ascii=False)

    messages: List[Dict[str, str]] = [
        {"role": "system", "content": system_prompt},
        {
            "role": "system",
            "content": f"Here is the latest pricing snapshot JSON: {snapshot_text}",
        },
    ]
    messages.extend(user_messages)

    try:
        resp = client.responses.create(
            model=os.getenv("OPENAI_ASSISTANT_MODEL", "gpt-5-nano"),
            input=messages,
        )
    except Exception as e:
        return JsonResponse(
            {"error": "OpenAI request failed", "detail": str(e)},
            status=500,
        )

    reply_text = getattr(resp, "output_text", None)
    if not reply_text and getattr(resp, "output", None):
        try:
            first = resp.output[0]
            if first and getattr(first, "content", None):
                reply_text = first.content[0].text
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
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    snapshot = payload.get("snapshot")
    if not isinstance(snapshot, dict):
        return JsonResponse(
            {
                "error": "snapshot with inputs and greeks is required",
            },
            status=400,
        )

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
    else:
        return JsonResponse({"error": "message or messages is required"}, status=400)

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

    messages: List[Dict[str, str]] = [
        {"role": "system", "content": system_prompt},
        {
            "role": "system",
            "content": f"Here is the latest pricing snapshot JSON: {snapshot_text}",
        },
    ]
    messages.extend(user_messages)

    try:
        resp = client.responses.create(
            model=os.getenv("OPENAI_ASSISTANT_MODEL", "gpt-5-nano"),
            input=messages,
        )
    except Exception as e:
        return JsonResponse(
            {"error": "OpenAI request failed", "detail": str(e)},
            status=500,
        )

    reply_text = getattr(resp, "output_text", None)
    if not reply_text and getattr(resp, "output", None):
        try:
            first = resp.output[0]
            if first and getattr(first, "content", None):
                reply_text = first.content[0].text
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

    portfolio = (
        base_qs.filter(is_default=True)
        .order_by("created_at", "id")
        .first()
    )

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
            portfolio = Portfolio.objects.get(id=portfolio_id, user=user)
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
    option_positions_qs = (
        OptionPosition.objects.filter(portfolio=portfolio)
        .select_related("contract")
    )

    for opt_pos in option_positions_qs:
        qty = opt_pos.quantity  # Decimal
        cost = opt_pos.avg_cost  # Decimal
        mult_int = opt_pos.contract.multiplier or 0
        mult = Decimal(str(mult_int))
        options_total_value += qty * cost * mult

    total_positions_value += options_total_value

    total_equity = portfolio.cash_balance + total_positions_value

    return JsonResponse(
        {
            "portfolio": {
                "id": portfolio.id,
                "name": portfolio.name,
                "initial_cash": float(portfolio.initial_cash),
                "cash_balance": float(portfolio.cash_balance),
                "positions_value": float(total_positions_value),
                "total_equity": float(total_equity),
                "is_default": bool(portfolio.is_default),
                "created_at": portfolio.created_at.isoformat(),
            },
            "positions": positions_payload,
            "market_error": market_error,
        }
    )


@csrf_exempt
@require_POST
def create_portfolio(request: HttpRequest) -> JsonResponse:
    user, error_response = _get_authenticated_user(request)
    if error_response is not None:
        return error_response

    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    name = str(data.get("name") or "").strip()
    initial_cash_raw = data.get("initial_cash")

    if not name:
        return JsonResponse({"error": "name is required"}, status=400)

    try:
        initial_cash = Decimal(str(initial_cash_raw))
    except Exception:
        return JsonResponse({"error": "initial_cash must be numeric"}, status=400)

    portfolio = Portfolio.objects.create(
        user=user,
        name=name,
        initial_cash=initial_cash,
        cash_balance=initial_cash,
        is_default=False,
    )

    return JsonResponse(
        {
            "id": portfolio.id,
            "name": portfolio.name,
            "initial_cash": float(portfolio.initial_cash),
            "cash_balance": float(portfolio.cash_balance),
            "is_default": portfolio.is_default,
            "created_at": portfolio.created_at.isoformat(),
        },
        status=201,
    )


@csrf_exempt
@require_POST
def set_default_portfolio(request: HttpRequest) -> JsonResponse:
    user, error_response = _get_authenticated_user(request)
    if error_response is not None:
        return error_response

    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    portfolio_id = data.get("portfolio_id")
    if portfolio_id is None:
        return JsonResponse({"error": "portfolio_id is required"}, status=400)

    try:
        portfolio = Portfolio.objects.get(id=portfolio_id, user=user)
    except Portfolio.DoesNotExist:
        return JsonResponse({"error": "Portfolio not found"}, status=404)

    with transaction.atomic():
        Portfolio.objects.filter(user=user, is_default=True).update(is_default=False)
        portfolio.is_default = True
        portfolio.save(update_fields=["is_default"])

    return JsonResponse({"status": "ok"})


@csrf_exempt
@require_POST
def delete_portfolio(request: HttpRequest) -> JsonResponse:
    user, error_response = _get_authenticated_user(request)
    if error_response is not None:
        return error_response

    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    portfolio_id = data.get("portfolio_id")
    if portfolio_id is None:
        return JsonResponse({"error": "portfolio_id is required"}, status=400)

    try:
        portfolio = Portfolio.objects.get(id=portfolio_id, user=user)
    except Portfolio.DoesNotExist:
        return JsonResponse({"error": "Portfolio not found"}, status=404)

    if portfolio.is_default:
        return JsonResponse(
            {"error": "Cannot delete the default portfolio"}, status=400
        )

    portfolio.is_active = False
    portfolio.archived_at = portfolio.archived_at or portfolio.created_at
    portfolio.save(update_fields=["is_active", "archived_at"])

    return JsonResponse({"status": "ok"})


@csrf_exempt
@require_POST
def execute_trade(request: HttpRequest) -> JsonResponse:
    user, error_response = _get_authenticated_user(request)
    if error_response is not None:
        return error_response

    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    symbol = str(data.get("symbol") or "").upper().strip()
    side = str(data.get("side") or "").upper().strip()
    quantity_raw = data.get("quantity")
    portfolio_id = data.get("portfolio_id")
    price_raw = data.get("price")
    fees_raw = data.get("fees")

    if not symbol:
        return JsonResponse({"error": "symbol is required"}, status=400)
    if side not in {Trade.Side.BUY, Trade.Side.SELL}:
        return JsonResponse({"error": "side must be BUY or SELL"}, status=400)
    if quantity_raw is None:
        return JsonResponse({"error": "quantity is required"}, status=400)

    try:
        quantity = Decimal(str(quantity_raw))
    except Exception:
        return JsonResponse({"error": "quantity must be numeric"}, status=400)
    if quantity <= 0:
        return JsonResponse({"error": "quantity must be positive"}, status=400)

    if portfolio_id is not None:
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id, user=user)
        except Portfolio.DoesNotExist:
            return JsonResponse({"error": "Portfolio not found"}, status=404)
    else:
        portfolio = _get_or_create_default_portfolio(user)

    if price_raw is not None:
        try:
            price = Decimal(str(price_raw))
        except Exception:
            return JsonResponse({"error": "price must be numeric"}, status=400)
    else:
        try:
            quotes = get_current_prices([symbol])
        except RuntimeError as e:
            return JsonResponse(
                {"error": f"Could not fetch market price: {e}"},
                status=502,
            )
        info = quotes.get(symbol) or {}
        price_val = info.get("price")
        if price_val is None:
            return JsonResponse(
                {"error": f"No price available for {symbol}"},
                status=502,
            )
        price = Decimal(str(price_val))

    fees = Decimal("0")
    if fees_raw is not None:
        try:
            fees = Decimal(str(fees_raw))
        except Exception:
            return JsonResponse({"error": "fees must be numeric"}, status=400)
        if fees < 0:
            return JsonResponse({"error": "fees cannot be negative"}, status=400)

    if side == Trade.Side.SELL:
        quantity = -quantity

    cash_delta = -(quantity * price + fees)

    with transaction.atomic():
        portfolio.refresh_from_db()
        new_cash_balance = portfolio.cash_balance + cash_delta
        if new_cash_balance < 0:
            return JsonResponse(
                {"error": "Insufficient cash to execute this trade"}, status=400
            )

        portfolio.cash_balance = new_cash_balance
        portfolio.save(update_fields=["cash_balance"])

        trade = Trade.objects.create(
            portfolio=portfolio,
            symbol=symbol,
            side=side,
            quantity=quantity,
            price=price,
            fees=fees,
        )

        position = Position.objects.filter(
            portfolio=portfolio, symbol=symbol
        ).first()

        if side == Trade.Side.BUY:
            if position is None:
                position = Position.objects.create(
                    portfolio=portfolio,
                    symbol=symbol,
                    quantity=quantity,
                    avg_cost=price,
                )
            else:
                old_qty = position.quantity
                old_cost = position.avg_cost
                new_qty = old_qty + quantity
                if new_qty <= 0:
                    return JsonResponse(
                        {"error": "Resulting position quantity would be non-positive"},
                        status=400,
                    )
                new_avg_cost = (old_qty * old_cost + quantity * price) / new_qty
                position.quantity = new_qty
                position.avg_cost = new_avg_cost
                position.save(update_fields=["quantity", "avg_cost"])
        else:
            if position is None or position.quantity + quantity < 0:
                return JsonResponse(
                    {"error": "Cannot sell more than current position quantity"},
                    status=400,
                )

            new_qty = position.quantity + quantity
            if new_qty == 0:
                position.delete()
            else:
                position.quantity = new_qty
                position.save(update_fields=["quantity"])

    return JsonResponse(
        {
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
