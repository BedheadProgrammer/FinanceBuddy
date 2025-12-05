from django.db import models

from decimal import Decimal

from django.db import models
from django.utils import timezone


class OptionSide(models.TextChoices):
    CALL = "CALL", "Call"
    PUT = "PUT", "Put"


class OptionStyle(models.TextChoices):
    EUROPEAN = "EUROPEAN", "European"
    AMERICAN = "AMERICAN", "American"


class OptionContract(models.Model):
    underlying_symbol = models.CharField(max_length=10)
    option_side = models.CharField(max_length=4, choices=OptionSide.choices)
    option_style = models.CharField(max_length=10, choices=OptionStyle.choices)
    strike = models.DecimalField(max_digits=18, decimal_places=4)
    expiry = models.DateField()
    multiplier = models.IntegerField(default=100)
    contract_symbol = models.CharField(max_length=64, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (
            "underlying_symbol",
            "option_side",
            "option_style",
            "strike",
            "expiry",
            "multiplier",
        )

    def __str__(self) -> str:
        base = f"{self.underlying_symbol} {self.strike} {self.option_side} {self.expiry}"
        if self.option_style == OptionStyle.AMERICAN:
            return base + " (Am)"
        return base + " (Eu)"

class OptionExercise(models.Model):
    portfolio = models.ForeignKey(
        "api.Portfolio",
        on_delete=models.CASCADE,
        related_name="option_exercises",
    )
    contract = models.ForeignKey(
        OptionContract,
        on_delete=models.CASCADE,
        related_name="exercises",
    )
    quantity = models.DecimalField(max_digits=18, decimal_places=4)
    underlying_price_at_exercise = models.DecimalField(max_digits=18, decimal_places=4)
    intrinsic_value_per_contract = models.DecimalField(max_digits=18, decimal_places=4)
    intrinsic_value_total = models.DecimalField(max_digits=18, decimal_places=4)
    option_realized_pl = models.DecimalField(max_digits=18, decimal_places=4)
    cash_delta = models.DecimalField(max_digits=18, decimal_places=4)
    exercised_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=["portfolio", "exercised_at"]),
            models.Index(fields=["contract", "exercised_at"]),
        ]

    def __str__(self) -> str:
        return f"Exercise {self.quantity} {self.contract} in {self.portfolio} @ {self.underlying_price_at_exercise}"






class OptionPosition(models.Model):
    portfolio = models.ForeignKey(
        "api.Portfolio",
        on_delete=models.CASCADE,
        related_name="option_positions",
    )
    contract = models.ForeignKey(
        OptionContract,
        on_delete=models.CASCADE,
        related_name="positions",
    )
    quantity = models.DecimalField(max_digits=18, decimal_places=4)
    avg_cost = models.DecimalField(max_digits=18, decimal_places=4)
    created_at = models.DateTimeField(default=timezone.now)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("portfolio", "contract")

    def __str__(self) -> str:
        return f"{self.portfolio} - {self.contract}"


class OptionTrade(models.Model):
    class Side(models.TextChoices):
        BUY = "BUY", "Buy"
        SELL = "SELL", "Sell"

    class OrderType(models.TextChoices):
        MARKET = "MARKET", "Market"
        LIMIT = "LIMIT", "Limit"

    class Status(models.TextChoices):
        FILLED = "FILLED", "Filled"
        CANCELLED = "CANCELLED", "Cancelled"

    portfolio = models.ForeignKey(
        "api.Portfolio",
        on_delete=models.CASCADE,
        related_name="option_trades",
    )
    contract = models.ForeignKey(
        OptionContract,
        on_delete=models.CASCADE,
        related_name="trades",
    )
    side = models.CharField(max_length=4, choices=Side.choices)
    quantity = models.DecimalField(max_digits=18, decimal_places=4)
    price = models.DecimalField(max_digits=18, decimal_places=4)
    order_type = models.CharField(
        max_length=10,
        choices=OrderType.choices,
        default=OrderType.MARKET,
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.FILLED,
    )
    fees = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    underlying_price_at_execution = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        blank=True,
        null=True,
    )
    realized_pl = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        blank=True,
        null=True,
    )
    executed_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:
        return f"{self.side} {self.quantity} {self.contract} @ {self.price}"


class OptionValuationSnapshot(models.Model):
    portfolio = models.ForeignKey(
        "api.Portfolio",
        on_delete=models.CASCADE,
        related_name="option_valuations",
    )
    contract = models.ForeignKey(
        OptionContract,
        on_delete=models.CASCADE,
        related_name="valuations",
    )
    position = models.ForeignKey(
        OptionPosition,
        on_delete=models.SET_NULL,
        related_name="valuations",
        null=True,
        blank=True,
    )
    snapshot_time = models.DateTimeField(default=timezone.now, db_index=True)
    mark_price = models.DecimalField(max_digits=18, decimal_places=4)
    underlying_price = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        blank=True,
        null=True,
    )
    unrealized_pl = models.DecimalField(
        max_digits=18,
        decimal_places=4,
    )
    delta = models.DecimalField(
        max_digits=18,
        decimal_places=8,
        blank=True,
        null=True,
    )
    gamma = models.DecimalField(
        max_digits=18,
        decimal_places=8,
        blank=True,
        null=True,
    )
    theta = models.DecimalField(
        max_digits=18,
        decimal_places=8,
        blank=True,
        null=True,
    )
    vega = models.DecimalField(
        max_digits=18,
        decimal_places=8,
        blank=True,
        null=True,
    )
    rho = models.DecimalField(
        max_digits=18,
        decimal_places=8,
        blank=True,
        null=True,
    )
    source = models.CharField(
        max_length=32,
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=["portfolio", "snapshot_time"]),
            models.Index(fields=["contract", "snapshot_time"]),
        ]

    def __str__(self) -> str:
        return f"{self.snapshot_time} {self.portfolio} {self.contract}"
