from decimal import Decimal

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_portfolio_archived_at_portfolio_is_default_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="CryptoPosition",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("symbol", models.CharField(max_length=20)),
                ("quantity", models.DecimalField(decimal_places=18, max_digits=28)),
                ("avg_cost", models.DecimalField(decimal_places=18, max_digits=28)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("last_updated", models.DateTimeField(auto_now=True)),
                (
                    "portfolio",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="crypto_positions",
                        to="api.portfolio",
                    ),
                ),
            ],
            options={
                "unique_together": {("portfolio", "symbol")},
            },
        ),
        migrations.CreateModel(
            name="CryptoTrade",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("symbol", models.CharField(max_length=20)),
                ("side", models.CharField(choices=[("BUY", "Buy"), ("SELL", "Sell")], max_length=4)),
                ("quantity", models.DecimalField(decimal_places=18, max_digits=28)),
                ("price", models.DecimalField(decimal_places=18, max_digits=28)),
                (
                    "order_type",
                    models.CharField(
                        choices=[("MARKET", "Market"), ("LIMIT", "Limit")],
                        default="MARKET",
                        max_length=10,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[("FILLED", "Filled"), ("CANCELLED", "Cancelled")],
                        default="FILLED",
                        max_length=10,
                    ),
                ),
                ("fees", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=18)),
                ("realized_pl", models.DecimalField(blank=True, decimal_places=8, max_digits=18, null=True)),
                ("executed_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                (
                    "portfolio",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="crypto_trades",
                        to="api.portfolio",
                    ),
                ),
            ],
        ),
    ]
