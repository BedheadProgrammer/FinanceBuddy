from __future__ import annotations

from decimal import Decimal
from typing import Tuple

from django.db import transaction
from django.utils import timezone

from api.models import Portfolio
from .models import (
    OptionContract,
    OptionPosition,
    OptionTrade,
    OptionValuationSnapshot,
    OptionExercise,
)


def get_or_create_option_contract(
    underlying_symbol: str,
    option_side: str,
    option_style: str,
    strike: Decimal,
    expiry,
    multiplier: int = 100,
) -> OptionContract:
    underlying_symbol = underlying_symbol.upper().strip()
    option_side = option_side.upper().strip()
    option_style = option_style.upper().strip()

    contract, _ = OptionContract.objects.get_or_create(
        underlying_symbol=underlying_symbol,
        option_side=option_side,
        option_style=option_style,
        strike=strike,
        expiry=expiry,
        multiplier=multiplier,
    )
    return contract


def _update_long_position_for_buy(
    position: OptionPosition | None,
    contract: OptionContract,
    portfolio: Portfolio,
    quantity: Decimal,
    price: Decimal,
) -> Tuple[OptionPosition, Decimal]:
    if position is None:
        position = OptionPosition.objects.create(
            portfolio=portfolio,
            contract=contract,
            quantity=quantity,
            avg_cost=price,
        )
        realized_pl = Decimal("0")
    else:
        total_quantity = position.quantity + quantity
        new_avg_cost = (
            (position.avg_cost * position.quantity) + (price * quantity)
        ) / total_quantity
        position.quantity = total_quantity
        position.avg_cost = new_avg_cost
        position.last_updated = timezone.now()
        position.save(update_fields=["quantity", "avg_cost", "last_updated"])
        realized_pl = Decimal("0")
    return position, realized_pl


def _update_long_position_for_sell(
    position: OptionPosition | None,
    contract: OptionContract,
    portfolio: Portfolio,
    quantity: Decimal,
    price: Decimal,
) -> Tuple[OptionPosition | None, Decimal]:
    if position is None or position.quantity <= 0 or quantity > position.quantity:
        raise ValueError("Cannot sell more contracts than currently held for long-only positions.")

    realized_pl_per_contract = price - position.avg_cost
    realized_pl = realized_pl_per_contract * quantity * contract.multiplier

    remaining_quantity = position.quantity - quantity
    if remaining_quantity == 0:
        position.delete()
        position = None
    else:
        position.quantity = remaining_quantity
        position.last_updated = timezone.now()
        position.save(update_fields=["quantity", "last_updated"])

    return position, realized_pl


@transaction.atomic
def apply_option_trade(
    portfolio: Portfolio,
    *,
    underlying_symbol: str,
    option_side: str,
    option_style: str,
    strike: Decimal,
    expiry,
    quantity: Decimal,
    price: Decimal,
    side: str,
    fees: Decimal = Decimal("0"),
    underlying_price_at_execution: Decimal | None = None,
    order_type: str = OptionTrade.OrderType.MARKET,
) -> OptionTrade:
    contract = get_or_create_option_contract(
        underlying_symbol=underlying_symbol,
        option_side=option_side,
        option_style=option_style,
        strike=strike,
        expiry=expiry,
    )

    side = side.upper().strip()
    if side not in (OptionTrade.Side.BUY, OptionTrade.Side.SELL):
        raise ValueError("Invalid trade side for option trade.")

    position = (
        OptionPosition.objects.select_for_update()
        .filter(portfolio=portfolio, contract=contract)
        .first()
    )

    if side == OptionTrade.Side.BUY:
        position, realized_pl = _update_long_position_for_buy(
            position=position,
            contract=contract,
            portfolio=portfolio,
            quantity=quantity,
            price=price,
        )
        cash_delta = -(price * quantity * contract.multiplier) - fees
    else:
        position, realized_pl = _update_long_position_for_sell(
            position=position,
            contract=contract,
            portfolio=portfolio,
            quantity=quantity,
            price=price,
        )
        cash_delta = (price * quantity * contract.multiplier) - fees

    portfolio.cash_balance = portfolio.cash_balance + cash_delta
    portfolio.save(update_fields=["cash_balance"])

    trade = OptionTrade.objects.create(
        portfolio=portfolio,
        contract=contract,
        side=side,
        quantity=quantity,
        price=price,
        order_type=order_type,
        status=OptionTrade.Status.FILLED,
        fees=fees,
        underlying_price_at_execution=underlying_price_at_execution,
        realized_pl=realized_pl,
    )

    return trade


def snapshot_option_valuation(
    portfolio: Portfolio,
    contract: OptionContract,
    mark_price: Decimal,
    underlying_price: Decimal | None = None,
    delta: Decimal | None = None,
    gamma: Decimal | None = None,
    theta: Decimal | None = None,
    vega: Decimal | None = None,
    rho: Decimal | None = None,
    source: str | None = None,
    snapshot_time=None,
) -> OptionValuationSnapshot:
    if snapshot_time is None:
        snapshot_time = timezone.now()

    position = (
        OptionPosition.objects.filter(portfolio=portfolio, contract=contract).first()
    )

    if position is None or position.quantity == 0:
        unrealized_pl = Decimal("0")
    else:
        unrealized_pl = (
            (mark_price - position.avg_cost)
            * position.quantity
            * contract.multiplier
        )

    snapshot = OptionValuationSnapshot.objects.create(
        portfolio=portfolio,
        contract=contract,
        position=position,
        snapshot_time=snapshot_time,
        mark_price=mark_price,
        underlying_price=underlying_price,
        unrealized_pl=unrealized_pl,
        delta=delta,
        gamma=gamma,
        theta=theta,
        vega=vega,
        rho=rho,
        source=source,
    )
    return snapshot


@transaction.atomic
def exercise_option_contract(
    portfolio: Portfolio,
    *,
    underlying_symbol: str,
    option_side: str,
    option_style: str,
    strike: Decimal,
    expiry,
    quantity: Decimal,
    underlying_price: Decimal,
    fees: Decimal = Decimal("0"),
) -> OptionExercise:
    if quantity <= 0:
        raise ValueError("Exercise quantity must be positive.")

    underlying_symbol = underlying_symbol.upper().strip()
    option_side = option_side.upper().strip()
    option_style = option_style.upper().strip()

    contract = (
        OptionContract.objects.select_for_update()
        .filter(
            underlying_symbol=underlying_symbol,
            option_side=option_side,
            option_style=option_style,
            strike=strike,
            expiry=expiry,
        )
        .first()
    )
    if contract is None:
        raise ValueError("No existing option contract found for exercise.")

    position = (
        OptionPosition.objects.select_for_update()
        .filter(portfolio=portfolio, contract=contract)
        .first()
    )
    if position is None or position.quantity <= 0 or quantity > position.quantity:
        raise ValueError("Cannot exercise more contracts than currently held for long-only positions.")

    if contract.option_side == "CALL":
        intrinsic_value_per_contract = max(underlying_price - contract.strike, Decimal("0"))
    elif contract.option_side == "PUT":
        intrinsic_value_per_contract = max(contract.strike - underlying_price, Decimal("0"))
    else:
        raise ValueError("Unknown option side for exercise.")

    intrinsic_value_total = intrinsic_value_per_contract * quantity * contract.multiplier
    option_realized_pl = (
        (intrinsic_value_per_contract - position.avg_cost)
        * quantity
        * contract.multiplier
    )

    cash_delta = intrinsic_value_total - fees

    remaining_quantity = position.quantity - quantity
    if remaining_quantity == 0:
        position.delete()
        position = None
    else:
        position.quantity = remaining_quantity
        position.last_updated = timezone.now()
        position.save(update_fields=["quantity", "last_updated"])

    portfolio.cash_balance = portfolio.cash_balance + cash_delta
    portfolio.save(update_fields=["cash_balance"])

    exercise = OptionExercise.objects.create(
        portfolio=portfolio,
        contract=contract,
        quantity=quantity,
        underlying_price_at_exercise=underlying_price,
        intrinsic_value_per_contract=intrinsic_value_per_contract,
        intrinsic_value_total=intrinsic_value_total,
        option_realized_pl=option_realized_pl,
        cash_delta=cash_delta,
    )

    return exercise
