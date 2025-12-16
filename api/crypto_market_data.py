from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple

import os
import requests


@dataclass(frozen=True)
class AlpacaConfig:
    data_base_url: str
    trading_base_url: str
    api_key_id: str
    api_secret_key: str
    crypto_loc: str
    timeout_s: float


def _strip_slash(url: str) -> str:
    return (url or "").strip().rstrip("/")


def _infer_data_base_url() -> str:
    env = _strip_slash(os.getenv("APCA_DATA_BASE_URL") or os.getenv("APCA_MARKET_DATA_BASE_URL") or os.getenv("APCA_API_BASE_URL") or "")
    if env and ("data.alpaca.markets" in env or "paper-data.alpaca.markets" in env):
        return env
    return "https://data.alpaca.markets"


def _infer_trading_base_url() -> str:
    env = _strip_slash(os.getenv("APCA_TRADING_BASE_URL") or os.getenv("APCA_TRADING_API_BASE_URL") or "")
    if env:
        return env
    env2 = _strip_slash(os.getenv("APCA_API_BASE_URL") or "")
    if env2 and ("paper-api.alpaca.markets" in env2 or "api.alpaca.markets" in env2 or "broker-api" in env2):
        return env2
    return "https://paper-api.alpaca.markets"


def get_alpaca_config() -> AlpacaConfig:
    api_key_id = (os.getenv("APCA_API_KEY_ID") or os.getenv("APCA_API_KEY") or "").strip()
    api_secret_key = (os.getenv("APCA_API_SECRET_KEY") or os.getenv("APCA_API_SECRET") or "").strip()
    if not api_key_id or not api_secret_key:
        raise RuntimeError("Missing Alpaca credentials (APCA_API_KEY_ID / APCA_API_SECRET_KEY).")

    crypto_loc = (os.getenv("APCA_CRYPTO_LOC") or "us").strip()
    timeout_s = float(os.getenv("APCA_HTTP_TIMEOUT_S") or "10.0")

    return AlpacaConfig(
        data_base_url=_infer_data_base_url(),
        trading_base_url=_infer_trading_base_url(),
        api_key_id=api_key_id,
        api_secret_key=api_secret_key,
        crypto_loc=crypto_loc,
        timeout_s=timeout_s,
    )


def _headers(cfg: AlpacaConfig) -> Dict[str, str]:
    return {
        "APCA-API-KEY-ID": cfg.api_key_id,
        "APCA-API-SECRET-KEY": cfg.api_secret_key,
    }


def _get_json(url: str, cfg: AlpacaConfig, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    resp = requests.get(url, headers=_headers(cfg), params=params or {}, timeout=cfg.timeout_s)
    if not resp.ok:
        raise RuntimeError(f"Alpaca request failed: {resp.status_code} {resp.text}")
    payload = resp.json()
    if not isinstance(payload, dict):
        raise RuntimeError("Alpaca returned unexpected JSON shape.")
    return payload


def normalize_crypto_symbol(symbol: str) -> str:
    raw = (symbol or "").strip().upper()
    if not raw:
        raise ValueError("symbol is required")

    if "/" in raw:
        parts = [p.strip() for p in raw.split("/") if p.strip()]
        if len(parts) != 2:
            raise ValueError(f"Invalid crypto pair: {symbol}")
        return f"{parts[0]}/{parts[1]}"

    for sep in ("-", "_", ":"):
        if sep in raw:
            parts = [p.strip() for p in raw.split(sep) if p.strip()]
            if len(parts) != 2:
                raise ValueError(f"Invalid crypto pair: {symbol}")
            return f"{parts[0]}/{parts[1]}"

    known_quotes = ["USDT", "USDC", "USD", "BTC", "ETH"]
    for q in known_quotes:
        if raw.endswith(q) and len(raw) > len(q):
            base = raw[: -len(q)]
            return f"{base}/{q}"

    raise ValueError(f"Unable to normalize crypto symbol: {symbol}")


def _csv_symbols(symbols: Iterable[str]) -> Tuple[str, List[str]]:
    normalized: List[str] = []
    seen = set()
    for s in symbols:
        if s is None:
            continue
        ns = normalize_crypto_symbol(s)
        if ns in seen:
            continue
        seen.add(ns)
        normalized.append(ns)
    if not normalized:
        raise ValueError("No valid symbols provided")
    return ",".join(normalized), normalized


def list_crypto_assets(tradable_only: bool = True, status: str = "active") -> List[Dict[str, Any]]:
    cfg = get_alpaca_config()
    url = f"{cfg.trading_base_url}/v2/assets"
    params: Dict[str, Any] = {"asset_class": "crypto"}
    if status:
        params["status"] = status
    payload = requests.get(url, headers=_headers(cfg), params=params, timeout=cfg.timeout_s)
    if not payload.ok:
        raise RuntimeError(f"Alpaca assets request failed: {payload.status_code} {payload.text}")
    data = payload.json()
    if not isinstance(data, list):
        raise RuntimeError("Alpaca assets returned unexpected JSON shape.")
    if not tradable_only:
        return [a for a in data if isinstance(a, dict)]
    return [a for a in data if isinstance(a, dict) and bool(a.get("tradable"))]


def get_crypto_latest_trades(symbols: Iterable[str]) -> Dict[str, Dict[str, Any]]:
    cfg = get_alpaca_config()
    sym_csv, normalized = _csv_symbols(symbols)
    url = f"{cfg.data_base_url}/v1beta3/crypto/{cfg.crypto_loc}/latest/trades"
    payload = _get_json(url, cfg, params={"symbols": sym_csv})
    trades_obj = payload.get("trades")
    out: Dict[str, Dict[str, Any]] = {}

    if isinstance(trades_obj, dict):
        for sym in normalized:
            v = trades_obj.get(sym)
            if isinstance(v, dict):
                out[sym] = v

    if not out:
        for sym in normalized:
            v = payload.get(sym)
            if isinstance(v, dict):
                out[sym] = v

    return out


def get_crypto_snapshots(symbols: Iterable[str]) -> Dict[str, Dict[str, Any]]:
    cfg = get_alpaca_config()
    sym_csv, normalized = _csv_symbols(symbols)
    url = f"{cfg.data_base_url}/v1beta3/crypto/{cfg.crypto_loc}/snapshots"
    payload = _get_json(url, cfg, params={"symbols": sym_csv})
    snaps_obj = payload.get("snapshots")
    out: Dict[str, Dict[str, Any]] = {}

    if isinstance(snaps_obj, dict):
        for sym in normalized:
            v = snaps_obj.get(sym)
            if isinstance(v, dict):
                out[sym] = v

    if not out:
        for sym in normalized:
            v = payload.get(sym)
            if isinstance(v, dict):
                out[sym] = v

    return out


def get_crypto_latest_bars(symbols: Iterable[str]) -> Dict[str, Dict[str, Any]]:
    cfg = get_alpaca_config()
    sym_csv, normalized = _csv_symbols(symbols)
    url = f"{cfg.data_base_url}/v1beta3/crypto/{cfg.crypto_loc}/latest/bars"
    payload = _get_json(url, cfg, params={"symbols": sym_csv})
    bars_obj = payload.get("bars")
    out: Dict[str, Dict[str, Any]] = {}

    if isinstance(bars_obj, dict):
        for sym in normalized:
            v = bars_obj.get(sym)
            if isinstance(v, dict):
                out[sym] = v

    if not out:
        for sym in normalized:
            v = payload.get(sym)
            if isinstance(v, dict):
                out[sym] = v

    return out


def get_crypto_spot(symbol_pair: str) -> float:
    sym = normalize_crypto_symbol(symbol_pair)
    trades = get_crypto_latest_trades([sym])
    trade = trades.get(sym)
    if isinstance(trade, dict):
        p = trade.get("p")
        if p is None:
            p = trade.get("price")
        if p is not None:
            return float(p)

    snaps = get_crypto_snapshots([sym])
    snap = snaps.get(sym)
    if isinstance(snap, dict):
        lt = snap.get("latestTrade")
        if isinstance(lt, dict):
            p = lt.get("p")
            if p is None:
                p = lt.get("price")
            if p is not None:
                return float(p)

        lq = snap.get("latestQuote")
        if isinstance(lq, dict):
            bid = lq.get("bp")
            ask = lq.get("ap")
            if bid is None:
                bid = lq.get("bid_price")
            if ask is None:
                ask = lq.get("ask_price")
            if bid is not None and ask is not None:
                return (float(bid) + float(ask)) / 2.0
            if ask is not None:
                return float(ask)
            if bid is not None:
                return float(bid)

        db = snap.get("dailyBar")
        if isinstance(db, dict):
            c = db.get("c")
            if c is None:
                c = db.get("close")
            if c is not None:
                return float(c)

    raise RuntimeError(f"Alpaca returned no spot price for {sym}")


def get_crypto_daily_closes(symbol_pair: str, need: int = 252) -> List[float]:
    cfg = get_alpaca_config()
    sym = normalize_crypto_symbol(symbol_pair)
    need_i = int(need)
    if need_i <= 0:
        raise ValueError("need must be > 0")

    end_dt = datetime.now(timezone.utc)
    start_dt = end_dt - timedelta(days=max(30, need_i * 3))
    limit = min(max(need_i * 2, need_i + 50), 10000)

    url = f"{cfg.data_base_url}/v1beta3/crypto/{cfg.crypto_loc}/bars"
    params = {
        "symbols": sym,
        "timeframe": "1Day",
        "start": start_dt.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "end": end_dt.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "limit": limit,
        "sort": "asc",
    }
    payload = _get_json(url, cfg, params=params)

    bars_obj = payload.get("bars")
    series: List[Dict[str, Any]] = []
    if isinstance(bars_obj, dict):
        raw = bars_obj.get(sym)
        if isinstance(raw, list):
            series = [b for b in raw if isinstance(b, dict)]
    elif isinstance(bars_obj, list):
        series = [b for b in bars_obj if isinstance(b, dict)]

    closes: List[float] = []
    for b in series:
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
        raise RuntimeError(f"Alpaca returned insufficient daily bars for {sym}: {len(closes)}/{need_i}")

    return closes[-need_i:]


def get_crypto_current_prices(symbols: Iterable[str]) -> Dict[str, Dict[str, Any]]:
    sym_csv, normalized = _csv_symbols(symbols)
    cfg = get_alpaca_config()
    url = f"{cfg.data_base_url}/v1beta3/crypto/{cfg.crypto_loc}/latest/trades"
    payload = _get_json(url, cfg, params={"symbols": sym_csv})

    trades_obj = payload.get("trades")
    results: Dict[str, Dict[str, Any]] = {}
    last_err: Optional[Exception] = None

    for sym in normalized:
        try:
            trade = None
            if isinstance(trades_obj, dict):
                trade = trades_obj.get(sym)
            p = None
            if isinstance(trade, dict):
                p = trade.get("p")
                if p is None:
                    p = trade.get("price")
            if p is None:
                p = get_crypto_spot(sym)
            results[sym] = {"price": float(p), "error": None}
        except Exception as exc:
            last_err = exc
            results[sym] = {"price": None, "error": str(exc)}

    if not results and last_err is not None:
        raise RuntimeError(str(last_err))

    return results
