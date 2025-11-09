from __future__ import annotations
from typing import List, Optional, Tuple
from functools import lru_cache
from datetime import datetime
import os
import time
import requests


class MarketDataSource:

    def get_spot(self, symbol: str) -> float: ...
    def get_daily_closes(self, symbol: str, need: int = 252) -> List[float]: ...
    def get_dividend_yield(self, symbol: str) -> Optional[float]: ...


class AlphaVantageDataSource(MarketDataSource):
    """
    Alpha Vantage via official client.
    """

    def __init__(self, api_key: Optional[str] = None, pause_s: float = 12.0):
        key = api_key or os.getenv("ALPHAVANTAGE_API_KEY") or os.getenv("ALPHA_VANTAGE_API_KEY")
        if not key:
            raise RuntimeError("Alpha Vantage API key not set (ALPHAVANTAGE_API_KEY).")

        try:
            from alpha_vantage.timeseries import TimeSeries
            from alpha_vantage.fundamentaldata import FundamentalData
        except Exception as e:
            raise ImportError("alpha_vantage not installed. pip install alpha-vantage") from e

        self._ts = TimeSeries(key=key, output_format="json")
        self._fd = FundamentalData(key=key, output_format="json")
        self._pause_s = float(pause_s)

    def _sleep(self) -> None:
        time.sleep(self._pause_s)

    def get_spot(self, symbol: str) -> float:
        # Prefer quote; fallback to latest daily close.
        try:
            data, _ = self._ts.get_quote_endpoint(symbol=symbol)
            px = data.get("05. price")
            if px is not None:
                return float(px)
        except Exception:
            pass

        self._sleep()
        data, _ = self._ts.get_daily(symbol=symbol, outputsize="compact")
        if not data:
            raise RuntimeError(f"Alpha Vantage: no daily series for {symbol}")

        latest = max(data.keys(), key=lambda s: datetime.fromisoformat(s))
        close = data[latest].get("4. close")
        if close is None:
            raise RuntimeError(f"Alpha Vantage: close missing for {symbol} @ {latest}")
        return float(close)

    def get_daily_closes(self, symbol: str, need: int = 252) -> List[float]:
        outputsize = "compact" if need <= 100 else "full"
        data, _ = self._ts.get_daily(symbol=symbol, outputsize=outputsize)
        if not data:
            raise RuntimeError(f"Alpha Vantage: no daily series for {symbol}")

        pairs: List[Tuple[datetime, float]] = []
        for ds, row in data.items():
            try:
                dt = datetime.fromisoformat(ds)
                c = float(row["4. close"])
            except Exception:
                continue
            pairs.append((dt, c))

        if len(pairs) < 2:
            raise RuntimeError(f"Alpha Vantage: insufficient closes for {symbol}")

        pairs.sort(key=lambda x: x[0])
        closes = [c for _, c in pairs][-need:]
        return closes

    @lru_cache(maxsize=256)
    def get_dividend_yield(self, symbol: str) -> Optional[float]:
        data, _ = self._fd.get_company_overview(symbol=symbol)
        payload = data if isinstance(data, dict) else {}
        y = payload.get("DividendYield")
        try:
            return float(y) if y not in (None, "None", "") else None
        except Exception:
            return None


class TwelveDataDataSource(MarketDataSource):
    """
    TwelveData REST via requests.
    """

    BASE = "https://api.twelvedata.com"

    def __init__(self, api_key: Optional[str] = None, pause_s: float = 1.0):
        key = api_key or os.getenv("TWELVEDATA_API_KEY")
        if not key:
            raise RuntimeError("TwelveData API key not set (TWELVEDATA_API_KEY).")
        self._key = key
        self._pause_s = float(pause_s)

    def _get(self, path: str, params: dict) -> dict:
        url = f"{self.BASE}{path}"
        p = {**params, "apikey": self._key}
        r = requests.get(url, params=p, timeout=12)
        if r.status_code == 429:
            time.sleep(self._pause_s)
            r = requests.get(url, params=p, timeout=12)
        r.raise_for_status()
        data = r.json()
        if isinstance(data, dict) and data.get("status") == "error":
            raise RuntimeError(data.get("message", "TwelveData error"))
        return data

    def get_spot(self, symbol: str) -> float:
        try:
            d = self._get("/price", {"symbol": symbol})
            return float(d["price"])
        except Exception:
            q = self._get("/quote", {"symbol": symbol})
            for k in ("last", "close", "previous_close", "open"):
                v = q.get(k)
                if v is not None:
                    try:
                        return float(v)
                    except Exception:
                        pass
            raise RuntimeError(f"TwelveData: could not resolve spot for {symbol}")

    def get_daily_closes(self, symbol: str, need: int = 252) -> List[float]:
        d = self._get("/time_series", {"symbol": symbol, "interval": "1day", "outputsize": max(need, 100), "order": "asc"})
        values = d.get("values") or []
        closes: List[float] = []
        for row in values:
            v = row.get("close")
            if v is not None:
                try:
                    closes.append(float(v))
                except Exception:
                    pass
        if len(closes) < 2:
            raise RuntimeError(f"TwelveData: insufficient closes for {symbol}")
        return closes[-need:]

    @lru_cache(maxsize=256)
    def get_dividend_yield(self, symbol: str) -> Optional[float]:
        f = self._get("/fundamentals", {"symbol": symbol}) or {}
        for c in (
            f.get("dividend_yield"),
            (f.get("summary") or {}).get("dividend_yield"),
            (f.get("valuation") or {}).get("dividend_yield"),
        ):
            if c is None:
                continue
            try:
                return float(c)
            except Exception:
                pass
        return None


class YFinanceDataSource(MarketDataSource):
    """yfinance fallback."""

    def __init__(self):
        try:
            import yfinance as yf  # type: ignore
        except Exception as e:
            raise RuntimeError("yfinance not installed") from e
        self._yf = yf

    def get_spot(self, symbol: str) -> float:
        t = self._yf.Ticker(symbol)
        px = t.fast_info.last_price if hasattr(t, "fast_info") else None
        if px is None:
            info = t.info or {}
            px = info.get("regularMarketPrice")
        if px is None:
            hist = t.history(period="1d")
            if not hist.empty:
                px = float(hist["Close"].iloc[-1])
        if px is None:
            raise RuntimeError(f"yfinance: could not resolve spot for {symbol}")
        return float(px)

    def get_daily_closes(self, symbol: str, need: int = 252) -> List[float]:
        t = self._yf.Ticker(symbol)
        hist = t.history(period="max")
        closes = hist["Close"].dropna().to_list()
        if len(closes) < 2:
            raise RuntimeError(f"yfinance: insufficient closes for {symbol}")
        return closes[-need:]

    def get_dividend_yield(self, symbol: str) -> Optional[float]:
        t = self._yf.Ticker(symbol)
        info = t.info or {}
        y = info.get("dividendYield")
        try:
            return float(y) if y is not None else None
        except Exception:
            return None


class CombinedDataSource(MarketDataSource):
    """
    Try Alpha Vantage → TwelveData → yfinance in order.
    Use at least one configured source.
    """

    def __init__(self):
        self._sources: List[MarketDataSource] = []
        try:
            self._sources.append(AlphaVantageDataSource())
        except Exception:
            pass
        try:
            self._sources.append(TwelveDataDataSource())
        except Exception:
            pass
        try:
            self._sources.append(YFinanceDataSource())
        except Exception:
            pass
        if not self._sources:
            raise RuntimeError(
                "No data sources available. Set ALPHAVANTAGE_API_KEY or TWELVEDATA_API_KEY, or install yfinance."
            )

    def _first_ok(self, fn_name: str, *args, **kwargs):
        last_err = None
        for src in self._sources:
            try:
                return getattr(src, fn_name)(*args, **kwargs)
            except Exception as e:
                last_err = e
                continue
        raise last_err or RuntimeError("No data sources succeeded")

    def get_spot(self, symbol: str) -> float:
        return self._first_ok("get_spot", symbol)

    def get_daily_closes(self, symbol: str, need: int = 252) -> List[float]:
        return self._first_ok("get_daily_closes", symbol, need)

    def get_dividend_yield(self, symbol: str) -> Optional[float]:
        return self._first_ok("get_dividend_yield", symbol)
