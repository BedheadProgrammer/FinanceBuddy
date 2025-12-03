from django.db import models
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone


class Portfolio(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="portfolios",
    )
    name = models.CharField(max_length=100, default="Default Portfolio")
    initial_cash = models.DecimalField(max_digits=18, decimal_places=2)
    cash_balance = models.DecimalField(max_digits=18, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.user.username} - {self.name}"


class Position(models.Model):
    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="positions",
    )
    symbol = models.CharField(max_length=10)
    quantity = models.DecimalField(max_digits=18, decimal_places=4)
    avg_cost = models.DecimalField(max_digits=18, decimal_places=4)
    created_at = models.DateTimeField(default=timezone.now)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("portfolio", "symbol")

    def __str__(self) -> str:
        return f"{self.portfolio} - {self.symbol}"


class Trade(models.Model):
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
        Portfolio,
        on_delete=models.CASCADE,
        related_name="trades",
    )
    symbol = models.CharField(max_length=10)
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
    executed_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:
        return f"{self.side} {self.quantity} {self.symbol} @ {self.price}"
