from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timedelta, date
from typing import List, Optional, Any, Dict

import os
import math
import requests
import numpy as np
import pandas as pd
import yfinance as yf
from alpha_vantage.timeseries import TimeSeries


class MarketDataSource(ABC):
    @abstractmethod
    def get_spot(self, symbol: str) -> float:
        raise NotImplementedError

    def get_daily_closes(self, symbol: str, need: int = 252) -> List[float]:
        raise NotImplementedError

    def get_dividend_yield(self, symbol: str) -> Optional[float]:
        return None


class AlpacaDataSource(MarketDataSource):
    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        feed: Optional[str] = None,
        timeout_s: float = 10.0,
    ):
        self.base_url = (base_url or os.getenv("APCA_API_BASE_URL") or "https://data.alpaca.markets").rstrip("/")
        self.api_key = api_key or os.getenv("APCA_API_KEY_ID") or os.getenv("APCA_API_KEY")
        self.api_secret = api_secret or os.getenv("APCA_API_SECRET_KEY") or os.getenv("APCA_API_SECRET")
        self.feed = feed or os.getenv("APCA_DATA_FEED") or "iex"
        self.timeout_s = float(timeout_s)

        if not self.api_key or not self.api_secret:
            raise RuntimeError("Missing Alpaca credentials (APCA_API_KEY_ID/APCA_API_SECRET_KEY).")

    def _headers(self) -> Dict[str, str]:
        return {"APCA-API-KEY-ID": str(self.api_key), "APCA-API-SECRET-KEY": str(self.api_secret)}

    def _get_json(self, path: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        resp = requests.get(url, headers=self._headers(), params=params or {}, timeout=self.timeout_s)
        if not resp.ok:
            raise RuntimeError(f"Alpaca request failed: {resp.status_code} {resp.text}")
        try:
            payload = resp.json()
        except Exception as e:
            raise RuntimeError("Alpaca returned non-JSON response.") from e
        if not isinstance(payload, dict):
            raise RuntimeError("Alpaca returned unexpected JSON shape.")
        return payload

    def get_spot(self, symbol: str) -> float:
        sym = (symbol or "").strip().upper()
        if not sym:
            raise ValueError("symbol is required")

        payload = self._get_json(
            "/v2/stocks/trades/latest",
            params={"symbols": sym, "feed": self.feed},
        )

        trade = None
        trades = payload.get("trades")
        if isinstance(trades, dict):
            trade = trades.get(sym)
        if trade is None and isinstance(payload.get("trade"), dict):
            trade = payload.get("trade")

        price = None
        if isinstance(trade, dict):
            price = trade.get("p")
            if price is None:
                price = trade.get("price")

        if price is None:
            q_payload = self._get_json(
                "/v2/stocks/quotes/latest",
                params={"symbols": sym, "feed": self.feed},
            )
            quote = None
            quotes = q_payload.get("quotes")
            if isinstance(quotes, dict):
                quote = quotes.get(sym)
            if quote is None and isinstance(q_payload.get("quote"), dict):
                quote = q_payload.get("quote")
            if isinstance(quote, dict):
                bid = quote.get("bp")
                ask = quote.get("ap")
                if bid is None:
                    bid = quote.get("bid_price")
                if ask is None:
                    ask = quote.get("ask_price")
                if bid is not None and ask is not None:
                    price = (float(bid) + float(ask)) / 2.0
                elif ask is not None:
                    price = float(ask)
                elif bid is not None:
                    price = float(bid)

        if price is None:
            s_payload = self._get_json(
                f"/v2/stocks/{sym}/snapshot",
                params={"feed": self.feed},
            )
            latest_trade = s_payload.get("latestTrade")
            if isinstance(latest_trade, dict):
                price = latest_trade.get("p")
            if price is None:
                daily_bar = s_payload.get("dailyBar")
                if isinstance(daily_bar, dict):
                    price = daily_bar.get("c")

        if price is None:
            raise RuntimeError(f"Alpaca returned no latest price for {sym}.")

        try:
            return float(price)
        except Exception as e:
            raise RuntimeError(f"Alpaca returned invalid price for {sym}.") from e

    def get_daily_closes(self, symbol: str, need: int = 252) -> List[float]:
        sym = (symbol or "").strip().upper()
        if not sym:
            raise ValueError("symbol is required")
        need_i = int(need)
        if need_i <= 0:
            raise ValueError("need must be > 0")

        end_dt = datetime.utcnow()
        start_dt = end_dt - timedelta(days=max(30, need_i * 3))
        limit = min(max(need_i * 2, need_i + 50), 1000)

        payload = self._get_json(
            "/v2/stocks/bars",
            params={
                "symbols": sym,
                "timeframe": "1Day",
                "start": start_dt.replace(microsecond=0).isoformat() + "Z",
                "end": end_dt.replace(microsecond=0).isoformat() + "Z",
                "limit": limit,
                "adjustment": "all",
                "feed": self.feed,
                "sort": "asc",
            },
        )

        bars_obj = payload.get("bars")
        bars_list: List[Dict[str, Any]] = []
        if isinstance(bars_obj, dict):
            raw = bars_obj.get(sym)
            if isinstance(raw, list):
                bars_list = raw
        elif isinstance(bars_obj, list):
            bars_list = [b for b in bars_obj if isinstance(b, dict) and (b.get("S") == sym or b.get("symbol") == sym)]

        closes: List[float] = []
        for b in bars_list:
            c = b.get("c")
            if c is None:
                c = b.get("close")
            if c is None:
                continue
            try:
                closes.append(float(c))
            except Exception:
                continue

        if len(closes) < need_i:
            raise RuntimeError(f"Alpaca returned insufficient bars for {sym}: {len(closes)}/{need_i}")

        return closes[-need_i:]

    def get_dividend_yield(self, symbol: str) -> Optional[float]:
        sym = (symbol or "").strip().upper()
        if not sym:
            raise ValueError("symbol is required")

        price = self.get_spot(sym)
        if price <= 0:
            return 0.0

        today = date.today()
        start = today - timedelta(days=400)
        end = today + timedelta(days=30)

        payload = self._get_json(
            "/v1/corporate-actions",
            params={
                "symbols": sym,
                "types": "cash_dividend",
                "start": start.isoformat(),
                "end": end.isoformat(),
            },
        )

        actions: List[Dict[str, Any]] = []
        ca = payload.get("corporate_actions")
        if isinstance(ca, dict):
            raw = ca.get(sym)
            if isinstance(raw, list):
                actions = [a for a in raw if isinstance(a, dict)]
        elif isinstance(ca, list):
            actions = [a for a in ca if isinstance(a, dict)]
        else:
            data = payload.get("data")
            if isinstance(data, list):
                actions = [a for a in data if isinstance(a, dict)]

        cutoff = today - timedelta(days=365)
        total_cash = 0.0

        for a in actions:
            ex_str = a.get("ex_date") or a.get("exDate") or a.get("effective_date") or a.get("effectiveDate")
            ex_dt: Optional[date] = None
            if isinstance(ex_str, str) and ex_str:
                try:
                    ex_dt = date.fromisoformat(ex_str[:10])
                except Exception:
                    ex_dt = None
            if ex_dt is not None and ex_dt < cutoff:
                continue
            if ex_dt is not None and ex_dt > today:
                continue

            amt = None
            for k in ("cash", "per_share_amount", "rate", "amount", "cash_amount", "net_amount"):
                v = a.get(k)
                if v is None:
                    continue
                try:
                    amt = float(v)
                    break
                except Exception:
                    continue

            if amt is None:
                continue
            if amt > 0:
                total_cash += amt

        if total_cash <= 0:
            return 0.0

        return float(total_cash) / float(price)


class AlphaVantageDataSource(MarketDataSource):
    def __init__(self, key: Optional[str] = None):
        self.key = key or os.getenv("ALPHAVANTAGE_KEY")
        if not self.key:
            raise ValueError("ALPHAVANTAGE_KEY not set")
        self.ts = TimeSeries(key=self.key, output_format="pandas")

    def get_spot(self, symbol: str) -> float:
        data, _meta = self.ts.get_quote_endpoint(symbol=symbol)
        try:
            px = float(data["05. price"].iloc[0])
            return px
        except Exception as e:
            raise RuntimeError(f"AlphaVantage quote parse failed for {symbol}") from e

    def get_daily_closes(self, symbol: str, need: int = 252) -> List[float]:
        data, _meta = self.ts.get_daily(symbol=symbol, outputsize="compact")
        try:
            keys = sorted(data.index)
            closes = []
            for k in keys:
                closes.append(float(data.loc[k]["4. close"]))
            if len(closes) < int(need):
                raise RuntimeError(f"AlphaVantage returned only {len(closes)} bars for {symbol}")
            return closes[-int(need) :]
        except Exception as e:
            raise RuntimeError(f"AlphaVantage daily parse failed for {symbol}") from e


class TwelveDataDataSource(MarketDataSource):
    def __init__(self, key: Optional[str] = None):
        self.key = key or os.getenv("TWELVEDATA_KEY")
        if not self.key:
            raise ValueError("TWELVEDATA_KEY not set")
        self.base = "https://api.twelvedata.com"

    def get_spot(self, symbol: str) -> float:
        url = f"{self.base}/price"
        params = {"symbol": symbol, "apikey": self.key}
        r = requests.get(url, params=params, timeout=10)
        if not r.ok:
            raise RuntimeError(f"TwelveData price failed: {r.status_code} {r.text}")
        j = r.json()
        if "price" not in j:
            raise RuntimeError(f"TwelveData price missing for {symbol}: {j}")
        return float(j["price"])

    def get_daily_closes(self, symbol: str, need: int = 252) -> List[float]:
        url = f"{self.base}/time_series"
        params = {
            "symbol": symbol,
            "interval": "1day",
            "outputsize": max(int(need), 50),
            "apikey": self.key,
            "order": "asc",
            "format": "JSON",
        }
        r = requests.get(url, params=params, timeout=10)
        if not r.ok:
            raise RuntimeError(f"TwelveData time_series failed: {r.status_code} {r.text}")
        j = r.json()
        vals = j.get("values") or []
        closes: List[float] = []
        for v in vals:
            if not isinstance(v, dict):
                continue
            c = v.get("close")
            if c is None:
                continue
            try:
                closes.append(float(c))
            except Exception:
                continue
        if len(closes) < int(need):
            raise RuntimeError(f"TwelveData returned only {len(closes)} bars for {symbol}")
        return closes[-int(need) :]


class YFinanceDataSource(MarketDataSource):
    def get_spot(self, symbol: str) -> float:
        t = yf.Ticker(symbol)
        px = t.fast_info.get("lastPrice") if hasattr(t, "fast_info") else None
        if px is None:
            hist = t.history(period="1d", interval="1m")
            if hist is None or hist.empty:
                raise RuntimeError(f"yfinance returned no data for {symbol}")
            px = float(hist["Close"].iloc[-1])
        return float(px)

    def get_daily_closes(self, symbol: str, need: int = 252) -> List[float]:
        t = yf.Ticker(symbol)
        hist = t.history(period="2y", interval="1d")
        if hist is None or hist.empty:
            raise RuntimeError(f"yfinance returned no daily bars for {symbol}")
        closes = [float(x) for x in hist["Close"].tolist() if x is not None and not (isinstance(x, float) and math.isnan(x))]
        if len(closes) < int(need):
            raise RuntimeError(f"yfinance returned only {len(closes)} bars for {symbol}")
        return closes[-int(need) :]

    def get_dividend_yield(self, symbol: str) -> Optional[float]:
        t = yf.Ticker(symbol)
        info = getattr(t, "info", None)
        if not isinstance(info, dict):
            return None
        y = info.get("dividendYield")
        try:
            if y is None:
                return 0.0
            return float(y)
        except Exception:
            return None


class CombinedDataSource(MarketDataSource):
    def __init__(self):
        self._sources: List[MarketDataSource] = []
        try:
            self._sources.append(AlpacaDataSource())
        except Exception:
            pass
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
            raise RuntimeError("No market data sources configured")

    def get_spot(self, symbol: str) -> float:
        last_err: Optional[Exception] = None
        for src in self._sources:
            try:
                return float(src.get_spot(symbol))
            except Exception as e:
                last_err = e
                continue
        if last_err is not None:
            raise last_err
        raise RuntimeError("No market data sources available")

    def get_daily_closes(self, symbol: str, need: int = 252) -> List[float]:
        last_err: Optional[Exception] = None
        for src in self._sources:
            fn = getattr(src, "get_daily_closes", None)
            if fn is None:
                continue
            try:
                closes = fn(symbol, need=need)
                if closes:
                    return list(closes)
            except Exception as e:
                last_err = e
                continue
        if last_err is not None:
            raise last_err
        raise RuntimeError("No market data sources available")

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
