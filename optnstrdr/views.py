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

from BE1.MRKT_WTCH import get_current_prices, POPULAR

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


def _get_portfolio(portfolio_id) -> Portfolio:
    if not portfolio_id:
        raise ValueError("portfolio_id is required")
    try:
        return Portfolio.objects.get(pk=portfolio_id)
    except Portfolio.DoesNotExist:
        raise ValueError("Portfolio not found")


@csrf_exempt
@require_POST
def option_trade_api(request: HttpRequest) -> JsonResponse:
    try:
        payload = json.loads(request.body.decode() or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    try:
        portfolio = _get_portfolio(payload.get("portfolio_id"))

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

        fees_raw = payload.get("fees", "0")
        fees = _parse_decimal(fees_raw, "fees")

        underlying_price_raw = payload.get("underlying_price_at_execution")
        underlying_price_at_execution = None
        if underlying_price_raw is not None:
            underlying_price_at_execution = _parse_decimal(
                underlying_price_raw,
                "underlying_price_at_execution",
            )

        trade = apply_option_trade(
            portfolio=portfolio,
            underlying_symbol=symbol,
            option_side=option_side,
            option_style=option_style,
            strike=strike,
            expiry=expiry,
            quantity=quantity,
            price=price,
            side=side,
            fees=fees,
            underlying_price_at_execution=underlying_price_at_execution,
        )

        contract = trade.contract
        position = (
            OptionPosition.objects.filter(
                portfolio=portfolio,
                contract=contract,
            )
            .only("id", "quantity", "avg_cost")
            .first()
        )

        position_payload = None
        if position is not None:
            position_payload = {
                "id": position.id,
                "quantity": str(position.quantity),
                "avg_cost": str(position.avg_cost),
            }

        data = {
            "trade": {
                "id": trade.id,
                "portfolio_id": portfolio.id,
                "contract_id": contract.id,
                "side": trade.side,
                "quantity": str(trade.quantity),
                "price": str(trade.price),
                "fees": str(trade.fees),
                "order_type": trade.order_type,
                "status": trade.status,
                "realized_pl": str(trade.realized_pl or Decimal("0")),
                "underlying_price_at_execution": (
                    str(trade.underlying_price_at_execution)
                    if trade.underlying_price_at_execution is not None
                    else None
                ),
                "executed_at": trade.executed_at.isoformat(),
            },
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
    portfolio_id = request.GET.get("portfolio_id")
    try:
        portfolio = _get_portfolio(portfolio_id)
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
    portfolio_id = request.GET.get("portfolio_id")
    try:
        portfolio = _get_portfolio(portfolio_id)
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
    try:
        payload = json.loads(request.body.decode() or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    try:
        portfolio = _get_portfolio(payload.get("portfolio_id"))

        contract_id = payload.get("contract_id")
        if not contract_id:
            raise ValueError("contract_id is required")

        try:
            contract = OptionContract.objects.get(pk=contract_id)
        except OptionContract.DoesNotExist:
            raise ValueError("Option contract not found")

        mark_price = _parse_decimal(payload.get("mark_price"), "mark_price")

        underlying_price_raw = payload.get("underlying_price")
        underlying_price = None
        if underlying_price_raw is not None:
            underlying_price = _parse_decimal(underlying_price_raw, "underlying_price")

        delta_raw = payload.get("delta")
        gamma_raw = payload.get("gamma")
        theta_raw = payload.get("theta")
        vega_raw = payload.get("vega")
        rho_raw = payload.get("rho")

        delta = _parse_decimal(delta_raw, "delta") if delta_raw is not None else None
        gamma = _parse_decimal(gamma_raw, "gamma") if gamma_raw is not None else None
        theta = _parse_decimal(theta_raw, "theta") if theta_raw is not None else None
        vega = _parse_decimal(vega_raw, "vega") if vega_raw is not None else None
        rho = _parse_decimal(rho_raw, "rho") if rho_raw is not None else None

        source = payload.get("source")

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
            "id": snapshot.id,
            "portfolio_id": snapshot.portfolio_id,
            "contract_id": snapshot.contract_id,
            "position_id": snapshot.position_id,
            "snapshot_time": snapshot.snapshot_time.isoformat(),
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
        }
        return JsonResponse(data, status=201)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)


@csrf_exempt
@require_POST
def option_exercise_api(request: HttpRequest) -> JsonResponse:
    try:
        payload = json.loads(request.body.decode() or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    try:
        portfolio = _get_portfolio(payload.get("portfolio_id"))

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
        if quantity <= 0:
            raise ValueError("quantity must be positive")

        underlying_price_raw = payload.get("underlying_price")
        if underlying_price_raw is None:
            raise ValueError("underlying_price is required")
        underlying_price = _parse_decimal(underlying_price_raw, "underlying_price")

        fees_raw = payload.get("fees", "0")
        fees = _parse_decimal(fees_raw, "fees")

        exercise = exercise_option_contract(
            portfolio=portfolio,
            underlying_symbol=symbol,
            option_side=option_side,
            option_style=option_style,
            strike=strike,
            expiry=expiry,
            quantity=quantity,
            underlying_price=underlying_price,
            fees=fees,
        )

        contract = exercise.contract
        position = (
            OptionPosition.objects.filter(
                portfolio=portfolio,
                contract=contract,
            )
            .only("id", "quantity", "avg_cost")
            .first()
        )

        position_payload = None
        if position is not None:
            position_payload = {
                "id": position.id,
                "quantity": str(position.quantity),
                "avg_cost": str(position.avg_cost),
            }

        data = {
            "exercise": {
                "id": exercise.id,
                "portfolio_id": portfolio.id,
                "contract_id": contract.id,
                "quantity": str(exercise.quantity),
                "underlying_price_at_exercise": str(exercise.underlying_price_at_exercise),
                "intrinsic_value_per_contract": str(exercise.intrinsic_value_per_contract),
                "intrinsic_value_total": str(exercise.intrinsic_value_total),
                "option_realized_pl": str(exercise.option_realized_pl),
                "cash_delta": str(exercise.cash_delta),
                "exercised_at": exercise.exercised_at.isoformat(),
            },
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
