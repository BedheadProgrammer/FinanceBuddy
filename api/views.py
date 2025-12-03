from __future__ import annotations

import json
import os
from typing import Dict, List
from decimal import Decimal

from openai import OpenAI
from dotenv import load_dotenv

from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from django.db import transaction

from .models import Portfolio, Position, Trade
from BE1.MRKT_WTCH import get_current_prices, POPULAR

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
    if not isinstance(snapshot, dict) or "inputs" not in snapshot or "american_result" not in snapshot:
        return JsonResponse(
            {"error": "snapshot with inputs and american_result is required"},
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
        "early_exercise_premium, critical_price).  When you structure your response give the real world names not the data point names"
        "Explain what the numbers mean in plain English, focusing on intuition, risk, and exercise logic. "
        "Keep answers concise and structured with short paragraphs or bullet points."
    )

    snapshot_text = json.dumps(snapshot, separators=(",", ":"), ensure_ascii=False)

    messages: List[Dict[str, str]] = [
        {"role": "system", "content": system_prompt},
        {
            "role": "system",
            "content": f"Here is the latest American option snapshot as JSON: {snapshot_text}",
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
    if not isinstance(snapshot, dict) or "inputs" not in snapshot or "price_and_greeks" not in snapshot:
        return JsonResponse(
            {"error": "snapshot with inputs and price_and_greeks is required"},
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
        "The snapshot has two keys: 'inputs' (symbol, side, S, K, r, q, sigma, T, as_of, expiry)  "
        "and 'price_and_greeks' (fair_value, delta, gamma, theta, vega, rho). If critical price is too high, it will list N/A explain why (too close to european option, no early exercise premium)"
        "Explain what the fair value and each Greek mean in practical terms for the trader, "
        "including how they relate to price moves, volatility, time decay, and interest rates. "
        "Keep answers concise and structured with short paragraphs or bullet points."
    )

    snapshot_text = json.dumps(snapshot, separators=(",", ":"), ensure_ascii=False)

    messages: List[Dict[str, str]] = [
        {"role": "system", "content": system_prompt},
        {
            "role": "system",
            "content": f"Here is the latest European option snapshot as JSON: {snapshot_text}",
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
    portfolio = (
        Portfolio.objects.filter(user=user, is_active=True)
        .order_by("id")
        .first()
    )
    if portfolio is None:
        portfolio = Portfolio.objects.create(
            user=user,
            name="Default Portfolio",
            initial_cash=DEFAULT_INITIAL_CASH,
            cash_balance=DEFAULT_INITIAL_CASH,
            currency="USD",
        )
    return portfolio


@require_GET
def portfolio_summary(request: HttpRequest) -> JsonResponse:
    user, error_response = _get_authenticated_user(request)
    if error_response is not None:
        return error_response

    portfolio = _get_or_create_default_portfolio(user)
    positions = list(portfolio.positions.all().order_by("symbol"))

    symbols = [p.symbol for p in positions]
    market_data = {}
    market_error = None

    if symbols:
        try:
            market_data = get_current_prices(symbols)
        except RuntimeError as e:
            market_error = str(e)
            market_data = {}

    from decimal import Decimal as _D
    total_positions_value = _D("0")

    positions_payload = []
    for pos in positions:
        info = market_data.get(pos.symbol) or {}
        price_val = info.get("price")
        if price_val is None:
            market_price = None
            market_value = None
            unrealized_pnl = None
        else:
            market_price = _D(str(price_val))
            market_value = market_price * pos.quantity
            cost_basis = pos.avg_cost * pos.quantity
            unrealized_pnl = market_value - cost_basis
            total_positions_value += market_value

        positions_payload.append(
            {
                "symbol": pos.symbol,
                "quantity": float(pos.quantity),
                "avg_cost": float(pos.avg_cost),
                "market_price": float(market_price) if market_price is not None else None,
                "market_value": float(market_value) if market_value is not None else None,
                "unrealized_pnl": float(unrealized_pnl) if unrealized_pnl is not None else None,
                "error": info.get("error"),
            }
        )

    total_equity = portfolio.cash_balance + total_positions_value

    return JsonResponse(
        {
            "portfolio": {
                "id": portfolio.id,
                "name": portfolio.name,
                "currency": portfolio.currency,
                "initial_cash": float(portfolio.initial_cash),
                "cash_balance": float(portfolio.cash_balance),
                "positions_value": float(total_positions_value),
                "total_equity": float(total_equity),
            },
            "positions": positions_payload,
            "market_error": market_error,
        }
    )


@csrf_exempt
@require_POST
def execute_trade(request: HttpRequest) -> JsonResponse:
    user, error_response = _get_authenticated_user(request)
    if error_response is not None:
        return error_response

    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
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
            portfolio = Portfolio.objects.get(
                id=portfolio_id,
                user=user,
                is_active=True,
            )
        except Portfolio.DoesNotExist:
            return JsonResponse({"error": "Portfolio not found"}, status=404)
    else:
        portfolio = _get_or_create_default_portfolio(user)

    if fees_raw is None:
        fees = Decimal("0")
    else:
        try:
            fees = Decimal(str(fees_raw))
        except Exception:
            return JsonResponse({"error": "fees must be numeric"}, status=400)
        if fees < 0:
            return JsonResponse({"error": "fees cannot be negative"}, status=400)

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
            err_text = info.get("error") or "No price available for symbol"
            return JsonResponse(
                {"error": err_text},
                status=502,
            )
        price = Decimal(str(price_val))

    with transaction.atomic():
        portfolio = Portfolio.objects.select_for_update().get(id=portfolio.id)

        if side == Trade.Side.BUY:
            total_cost = price * quantity + fees
            if total_cost > portfolio.cash_balance:
                return JsonResponse(
                    {"error": "Insufficient cash for this trade"},
                    status=400,
                )

            portfolio.cash_balance -= total_cost
            portfolio.save()

            position = (
                Position.objects.select_for_update()
                .filter(portfolio=portfolio, symbol=symbol)
                .first()
            )
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
                new_cost = (old_qty * old_cost + quantity * price) / new_qty
                position.quantity = new_qty
                position.avg_cost = new_cost
                position.save()

            trade = Trade.objects.create(
                portfolio=portfolio,
                symbol=symbol,
                side=Trade.Side.BUY,
                quantity=quantity,
                price=price,
                fees=fees,
            )

        else:
            position = (
                Position.objects.select_for_update()
                .filter(portfolio=portfolio, symbol=symbol)
                .first()
            )
            if position is None or position.quantity < quantity:
                return JsonResponse(
                    {"error": "Insufficient position to sell"},
                    status=400,
                )

            total_proceeds = price * quantity - fees
            portfolio.cash_balance += total_proceeds
            portfolio.save()

            new_qty = position.quantity - quantity
            if new_qty <= 0:
                position.delete()
            else:
                position.quantity = new_qty
                position.save()

            trade = Trade.objects.create(
                portfolio=portfolio,
                symbol=symbol,
                side=Trade.Side.SELL,
                quantity=quantity,
                price=price,
                fees=fees,
            )

    return JsonResponse(
        {
            "ok": True,
            "portfolio": {
                "id": portfolio.id,
                "cash_balance": float(portfolio.cash_balance),
            },
            "trade": {
                "id": trade.id,
                "symbol": trade.symbol,
                "side": trade.side,
                "quantity": float(trade.quantity),
                "price": float(trade.price),
                "fees": float(trade.fees),
                "executed_at": trade.executed_at.isoformat(),
            },
        }
    )
