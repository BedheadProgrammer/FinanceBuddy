from __future__ import annotations

import json
from datetime import date
from decimal import Decimal, InvalidOperation

from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse, HttpRequest
from django.shortcuts import render, redirect
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from api.market_data import get_current_prices, POPULAR

from api.models import Portfolio
from .models import OptionPosition, OptionTrade, OptionContract, OptionExercise
from .services import apply_option_trade, snapshot_option_valuation, exercise_option_contract


class HomeView(LoginRequiredMixin, View):
    template_name = "optnstrdr/home.html"

    def get(self, request):
        return render(request, self.template_name, {"results": None})

    def post(self, request):
        symbols = (
            POPULAR
            if "popular" in request.POST
            else [s.strip() for s in request.POST.get("symbols", "").split(",") if s.strip()]
        )
        try:
            results = get_current_prices(symbols)
        except RuntimeError as e:
            messages.error(request, str(e))
            return redirect("optnstrdr:home")
        return render(request, self.template_name, {"results": results})


def _parse_decimal(value, field_name: str) -> Decimal:
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError(f"Invalid decimal for {field_name}")


def _parse_date(value, field_name: str) -> date:
    if not isinstance(value, str):
        raise ValueError(f"{field_name} must be an ISO date string")
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise ValueError(f"Invalid date for {field_name}, expected YYYY-MM-DD")


def _require_authenticated_user(request: HttpRequest):
    user = request.user
    if not user.is_authenticated:
        return None, JsonResponse({"error": "Authentication required"}, status=401)
    return user, None


def _get_portfolio(portfolio_id, user) -> Portfolio:
    if not portfolio_id:
        raise ValueError("portfolio_id is required")
    try:
        return Portfolio.objects.get(
            pk=portfolio_id,
            user=user,
            is_active=True,
            archived_at__isnull=True,
        )
    except Portfolio.DoesNotExist:
        raise ValueError("Portfolio not found")


@csrf_exempt
@require_POST
def option_trade_api(request: HttpRequest) -> JsonResponse:
    user, error_response = _require_authenticated_user(request)
    if error_response is not None:
        return error_response

    try:
        payload = json.loads(request.body.decode() or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    try:
        portfolio = _get_portfolio(payload.get("portfolio_id"), user)

        symbol = (payload.get("symbol") or "").upper().strip()
        if not symbol:
            raise ValueError("symbol is required")

        option_side = (payload.get("option_side") or "").upper().strip()
        option_style = (payload.get("option_style") or "").upper().strip()
        if option_side not in ("CALL", "PUT"):
            raise ValueError("option_side must be CALL or PUT")
        if option_style not in ("EUROPEAN", "AMERICAN"):
            raise ValueError("option_style must be EUROPEAN or AMERICAN")

        strike = _parse_decimal(payload.get("strike"), "strike")
        expiry = _parse_date(payload.get("expiry"), "expiry")

        quantity = _parse_decimal(payload.get("quantity"), "quantity")
        price = _parse_decimal(payload.get("price"), "price")
        side = (payload.get("side") or "").upper().strip()
        if side not in ("BUY", "SELL"):
            raise ValueError("side must be BUY or SELL")

        fees_raw = payload.get("fees")
        fees = _parse_decimal(fees_raw, "fees") if fees_raw is not None else Decimal("0")

        if quantity <= 0:
            raise ValueError("quantity must be positive")
        if price <= 0:
            raise ValueError("price must be positive")
        if fees < 0:
            raise ValueError("fees cannot be negative")

        try:
            contract = OptionContract.objects.get(
                underlying_symbol=symbol,
                option_side=option_side,
                option_style=option_style,
                strike=strike,
                expiry=expiry,
            )
        except OptionContract.DoesNotExist:
            contract = OptionContract.objects.create(
                underlying_symbol=symbol,
                option_side=option_side,
                option_style=option_style,
                strike=strike,
                expiry=expiry,
                multiplier=100,
            )

        opposite_side = "SELL" if side == "BUY" else "BUY"
        if OptionTrade.objects.filter(
            portfolio=portfolio,
            contract=contract,
            side=opposite_side,
            status="PENDING",
        ).exists():
            raise ValueError("There is a pending order in the opposite direction for this contract.")

        result = apply_option_trade(
            portfolio=portfolio,
            symbol=symbol,
            side=side,
            style=option_side,
            quantity=quantity,
            price=price,
            strike=strike,
            expiry=expiry,
            fees=fees,
        )

        position = result.position
        position_payload = None
        if position:
            position_payload = {
                "id": position.id,
                "portfolio_id": portfolio.id,
                "contract_id": contract.id,
                "underlying_symbol": contract.underlying_symbol,
                "option_side": contract.option_side,
                "option_style": contract.option_style,
                "strike": str(contract.strike),
                "expiry": contract.expiry.isoformat(),
                "multiplier": contract.multiplier,
                "quantity": str(position.quantity),
                "avg_cost": str(position.avg_cost),
            }

        data = {
            "contract": {
                "id": contract.id,
                "underlying_symbol": contract.underlying_symbol,
                "option_side": contract.option_side,
                "option_style": contract.option_style,
                "strike": str(contract.strike),
                "expiry": contract.expiry.isoformat(),
                "multiplier": contract.multiplier,
                "contract_symbol": contract.contract_symbol,
            },
            "portfolio": {
                "id": portfolio.id,
                "cash": str(portfolio.cash_balance),
            },
            "position": position_payload,
        }
        return JsonResponse(data, status=201)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)


@csrf_exempt
@require_GET
def option_positions_api(request: HttpRequest) -> JsonResponse:
    user, error_response = _require_authenticated_user(request)
    if error_response is not None:
        return error_response

    portfolio_id = request.GET.get("portfolio_id")
    try:
        portfolio = _get_portfolio(portfolio_id, user)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    positions = (
        OptionPosition.objects.filter(portfolio=portfolio)
        .select_related("contract")
        .order_by("contract__underlying_symbol", "contract__expiry", "contract__strike")
    )

    positions_payload = []
    for position in positions:
        contract = position.contract
        positions_payload.append(
            {
                "id": position.id,
                "portfolio_id": portfolio.id,
                "contract_id": contract.id,
                "underlying_symbol": contract.underlying_symbol,
                "option_side": contract.option_side,
                "option_style": contract.option_style,
                "strike": str(contract.strike),
                "expiry": contract.expiry.isoformat(),
                "multiplier": contract.multiplier,
                "quantity": str(position.quantity),
                "avg_cost": str(position.avg_cost),
            }
        )

    data = {
        "portfolio": {
            "id": portfolio.id,
            "cash": str(portfolio.cash_balance),
        },
        "positions": positions_payload,
    }
    return JsonResponse(data)


@csrf_exempt
@require_GET
def option_trades_api(request: HttpRequest) -> JsonResponse:
    user, error_response = _require_authenticated_user(request)
    if error_response is not None:
        return error_response

    portfolio_id = request.GET.get("portfolio_id")
    try:
        portfolio = _get_portfolio(portfolio_id, user)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    trades = (
        OptionTrade.objects.filter(portfolio=portfolio)
        .select_related("contract")
        .order_by("-executed_at")
    )

    trades_payload = []
    for trade in trades:
        contract = trade.contract
        trades_payload.append(
            {
                "id": trade.id,
                "portfolio_id": portfolio.id,
                "contract_id": contract.id,
                "underlying_symbol": contract.underlying_symbol,
                "option_side": contract.option_side,
                "option_style": contract.option_style,
                "strike": str(contract.strike),
                "expiry": contract.expiry.isoformat(),
                "multiplier": contract.multiplier,
                "side": trade.side,
                "quantity": str(trade.quantity),
                "price": str(trade.price),
                "fees": str(trade.fees),
                "realized_pl": str(trade.realized_pl or Decimal("0")),
                "underlying_price_at_execution": (
                    str(trade.underlying_price_at_execution)
                    if trade.underlying_price_at_execution is not None
                    else None
                ),
                "order_type": trade.order_type,
                "status": trade.status,
                "executed_at": trade.executed_at.isoformat(),
            }
        )

    data = {
        "portfolio": {
            "id": portfolio.id,
            "cash": str(portfolio.cash_balance),
        },
        "trades": trades_payload,
    }
    return JsonResponse(data)


@csrf_exempt
@require_POST
def option_snapshot_api(request: HttpRequest) -> JsonResponse:
    user, error_response = _require_authenticated_user(request)
    if error_response is not None:
        return error_response

    try:
        payload = json.loads(request.body.decode() or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    try:
        portfolio = _get_portfolio(payload.get("portfolio_id"), user)

        contract_id = payload.get("contract_id")
        if not contract_id:
            raise ValueError("contract_id is required")
        try:
            contract = OptionContract.objects.get(pk=contract_id)
        except OptionContract.DoesNotExist:
            raise ValueError("OptionContract not found")

        mark_price = _parse_decimal(payload.get("mark_price"), "mark_price")

        underlying_price_raw = payload.get("underlying_price")
        underlying_price = (
            _parse_decimal(underlying_price_raw, "underlying_price")
            if underlying_price_raw is not None
            else None
        )

        delta_raw = payload.get("delta")
        delta = _parse_decimal(delta_raw, "delta") if delta_raw is not None else None

        gamma_raw = payload.get("gamma")
        gamma = _parse_decimal(gamma_raw, "gamma") if gamma_raw is not None else None

        theta_raw = payload.get("theta")
        theta = _parse_decimal(theta_raw, "theta") if theta_raw is not None else None

        vega_raw = payload.get("vega")
        vega = _parse_decimal(vega_raw, "vega") if vega_raw is not None else None

        rho_raw = payload.get("rho")
        rho = _parse_decimal(rho_raw, "rho") if rho_raw is not None else None

        source = (payload.get("source") or "").strip() or None

        snapshot = snapshot_option_valuation(
            portfolio=portfolio,
            contract=contract,
            mark_price=mark_price,
            underlying_price=underlying_price,
            delta=delta,
            gamma=gamma,
            theta=theta,
            vega=vega,
            rho=rho,
            source=source,
        )

        data = {
            "snapshot": {
                "id": snapshot.id,
                "portfolio_id": snapshot.portfolio.id,
                "contract_id": snapshot.contract.id,
                "position_id": snapshot.position.id if snapshot.position else None,
                "mark_price": str(snapshot.mark_price),
                "underlying_price": (
                    str(snapshot.underlying_price)
                    if snapshot.underlying_price is not None
                    else None
                ),
                "unrealized_pl": str(snapshot.unrealized_pl),
                "delta": str(snapshot.delta) if snapshot.delta is not None else None,
                "gamma": str(snapshot.gamma) if snapshot.gamma is not None else None,
                "theta": str(snapshot.theta) if snapshot.theta is not None else None,
                "vega": str(snapshot.vega) if snapshot.vega is not None else None,
                "rho": str(snapshot.rho) if snapshot.rho is not None else None,
                "source": snapshot.source,
                "snapshot_time": snapshot.snapshot_time.isoformat(),
            }
        }
        return JsonResponse(data, status=201)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)


@csrf_exempt
@require_POST
def option_exercise_api(request: HttpRequest) -> JsonResponse:
    user, error_response = _require_authenticated_user(request)
    if error_response is not None:
        return error_response

    try:
        payload = json.loads(request.body.decode() or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    try:
        portfolio = _get_portfolio(payload.get("portfolio_id"), user)

        position_id = payload.get("position_id")
        if not position_id:
            raise ValueError("position_id is required")
        try:
            position = OptionPosition.objects.get(
                pk=position_id,
                portfolio=portfolio,
            )
        except OptionPosition.DoesNotExist:
            raise ValueError("OptionPosition not found")

        quantity = _parse_decimal(payload.get("quantity"), "quantity")
        if quantity <= 0:
            raise ValueError("quantity must be positive")
        if quantity > position.quantity:
            raise ValueError("Cannot exercise more contracts than currently held")

        underlying_price = _parse_decimal(payload.get("underlying_price"), "underlying_price")

        fees_raw = payload.get("fees")
        fees = _parse_decimal(fees_raw, "fees") if fees_raw is not None else Decimal("0")
        if fees < 0:
            raise ValueError("fees cannot be negative")

        exercise = exercise_option_contract(
            portfolio=portfolio,
            underlying_symbol=position.contract.underlying_symbol,
            option_side=position.contract.option_side,
            option_style=position.contract.option_style,
            strike=position.contract.strike,
            expiry=position.contract.expiry,
            quantity=quantity,
            underlying_price=underlying_price,
            fees=fees,
        )

        data = {
            "exercise": {
                "id": exercise.id,
                "portfolio_id": exercise.portfolio.id,
                "position_id": exercise.position.id,
                "underlying_symbol": exercise.underlying_symbol,
                "option_side": exercise.option_side,
                "option_style": exercise.option_style,
                "strike": str(exercise.strike),
                "expiry": exercise.expiry.isoformat(),
                "quantity": str(exercise.quantity),
                "underlying_price": str(exercise.underlying_price),
                "total_underlying_value": str(exercise.total_underlying_value),
                "total_strike_cost": str(exercise.total_strike_cost),
                "fees": str(exercise.fees),
                "net_cash_flow": str(exercise.net_cash_flow),
                "created_at": exercise.created_at.isoformat(),
            },
            "portfolio": {
                "id": portfolio.id,
                "cash": str(portfolio.cash_balance),
            },
        }
        return JsonResponse(data, status=201)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
