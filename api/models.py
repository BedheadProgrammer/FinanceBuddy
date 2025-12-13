from django.db import models
from decimal import Decimal

from django.conf import settings
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

    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    archived_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                condition=models.Q(is_default=True, archived_at__isnull=True),
                name="unique_default_portfolio_per_user",
            ),
        ]

    def __str__(self) -> str:
        suffix = ""
        if self.is_default and self.archived_at is None:
            suffix = " (Default)"
        return f"{self.user.username} - {self.name}{suffix}"

    @property
    def is_archived(self) -> bool:
        return self.archived_at is not None

    def save(self, *args, **kwargs):
        """
        Ensure that at most one active (non-archived) portfolio per user
        is marked as default.
        """
        super().save(*args, **kwargs)
        if self.is_default and self.archived_at is None:
            Portfolio.objects.filter(
                user=self.user,
                is_default=True,
                archived_at__isnull=True,
            ).exclude(pk=self.pk).update(is_default=False)


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
