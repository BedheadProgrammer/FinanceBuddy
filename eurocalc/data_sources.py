from __future__ import annotations
from typing import List, Optional, Tuple
from functools import lru_cache
from datetime import datetime
import os
import time
import math
import requests


def _normalize_dividend_yield(value: Optional[float]) -> Optional[float]:
    try:
        y = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(y):
        return None
    if y <= 0:
        return None
    if y < 1e-6:
        return None
    if y <= 0.25:
        y_norm = y
    elif y <= 25.0:
        y_norm = y / 100.0
    elif y <= 100.0:
        y_norm = y / 100.0
    else:
        return None
    if y_norm > 0.25:
        y_norm = 0.25
    return y_norm


class MarketDataSource:
    def get_spot(self, symbol: str) -> float: ...
    def get_daily_closes(self, symbol: str, need: int = 252) -> List[float]: ...
    def get_dividend_yield(self, symbol: str) -> Optional[float]: ...


class AlphaVantageDataSource(MarketDataSource):
    def __init__(self, api_key: Optional[str] = None, pause_s: float = 12.0):
        from alpha_vantage.timeseries import TimeSeries
        from alpha_vantage.fundamentaldata import FundamentalData

        key = api_key or os.getenv("ALPHAVANTAGE_API_KEY")
        if not key:
            raise RuntimeError("Alpha Vantage API key not set (ALPHAVANTAGE_API_KEY).")
        self._ts = TimeSeries(key=key, output_format="json")
        self._fd = FundamentalData(key=key, output_format="json")
        self._pause_s = float(pause_s)

    def _sleep(self):
        time.sleep(self._pause_s)

    def get_spot(self, symbol: str) -> float:
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

        pairs.sort(key=lambda p: p[0])
        closes = [c for _, c in pairs]
        return closes[-need:]

    @lru_cache(maxsize=256)
    def get_dividend_yield(self, symbol: str) -> Optional[float]:
        try:
            data, _ = self._fd.get_company_overview(symbol=symbol)
        except Exception:
            return None
        payload = data if isinstance(data, dict) else {}
        raw = payload.get("DividendYield")
        y = _normalize_dividend_yield(raw)
        return y


class TwelveDataDataSource(MarketDataSource):
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
        d = self._get(
            "/time_series",
            {
                "symbol": symbol,
                "interval": "1day",
                "outputsize": max(need, 100),
                "order": "asc",
            },
        )
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
        try:
            f = self._get("/fundamentals", {"symbol": symbol}) or {}
        except requests.HTTPError:
            return None
        except Exception:
            return None

        for c in (
            f.get("dividend_yield"),
            (f.get("summary") or {}).get("dividend_yield"),
            (f.get("valuation") or {}).get("dividend_yield"),
        ):
            if c is None:
                continue
            y = _normalize_dividend_yield(c)
            if y is not None:
                return y

        return None


class YFinanceDataSource(MarketDataSource):
    def __init__(self):
        try:
            import yfinance as yf
        except Exception as e:
            raise RuntimeError("yfinance is required for YFinanceDataSource") from e
        self._yf = yf

    def get_spot(self, symbol: str) -> float:
        t = self._yf.Ticker(symbol)
        px = None
        try:
            px = float(t.fast_info["last_price"])
        except Exception:
            pass
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
        closes = hist["Close"].dropna().tolist()
        if len(closes) < 2:
            raise RuntimeError(f"yfinance: insufficient closes for {symbol}")
        return closes[-need:]

    def get_dividend_yield(self, symbol: str) -> Optional[float]:
        t = self._yf.Ticker(symbol)
        info = t.info or {}
        raw = info.get("dividendYield")
        y = _normalize_dividend_yield(raw)
        return y


class CombinedDataSource(MarketDataSource):
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
            raise RuntimeError("No data sources available.")

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
        last_err: Optional[Exception] = None
        for src in self._sources:
            fn = getattr(src, "get_dividend_yield", None)
            if fn is None:
                continue
            try:
                y = fn(symbol)
                if y is not None:
                    return y
            except Exception as e:
                last_err = e
                continue
        if last_err is not None:
            raise last_err
        return None
