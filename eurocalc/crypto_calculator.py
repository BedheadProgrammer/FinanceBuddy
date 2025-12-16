from __future__ import annotations
from typing import Optional, List
from datetime import date
import math

from .data_sources import MarketDataSource, CombinedDataSource


class CryptoSpotCalculator:
    def __init__(self, data_source: Optional[MarketDataSource] = None):
        self.ds = data_source or CombinedDataSource()

    def compute(self, symbol: str) -> float:
        return float(self.ds.get_crypto_spot(symbol))


class CryptoVolatilityCalculator:
    def __init__(
        self,
        data_source: Optional[MarketDataSource] = None,
        lookback_days: int = 90,
        floor: float = 0.10,
        cap: float = 3.0,
    ):
        self.ds = data_source or CombinedDataSource()
        self.lookback = lookback_days
        self.floor = floor
        self.cap = cap

    def compute(self, symbol: str, as_of: Optional[date] = None, expiry: Optional[date] = None) -> float:
        closes = self.ds.get_crypto_daily_closes(symbol, need=self.lookback)
        rets: List[float] = []
        for i in range(1, len(closes)):
            a, b = closes[i - 1], closes[i]
            if a > 0 and b > 0:
                rets.append(math.log(b / a))
        if len(rets) < 10:
            return 0.50
        m = sum(rets) / len(rets)
        var = sum((r - m) ** 2 for r in rets) / (len(rets) - 1)
        sigma = math.sqrt(var) * math.sqrt(365.0)
        return max(self.floor, min(self.cap, sigma))
