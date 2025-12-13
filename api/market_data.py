from __future__ import annotations

from typing import Iterable, Dict, Any

from eurocalc.data_sources import CombinedDataSource

# Shared list of "popular" tickers used by both the API layer and the
# options home view. This replaces BE1.MRKT_WTCH.POPULAR.
POPULAR = [
    "AAPL",
    "MSFT",
    "NVDA",
    "AMZN",
    "GOOGL",
    "META",
    "TSLA",
    "BRK.B",
    "JPM",
    "NFLX",
    "AMD",
    "INTC",
    "BAC",
    "XOM",
]


def get_current_prices(symbols: Iterable[str]) -> Dict[str, Dict[str, Any]]:
    """
    Fetch current prices via eurocalc.data_sources.CombinedDataSource.

    This is an adapter that mimics the old BE1.MRKT_WTCH.get_current_prices
    signature so the rest of the code does not need to change:

        { "SYM": { "price": float | None, "error": str | None }, ... }

    It will:
      * Normalize symbols to upper-case.
      * Leave entries present with price=None and an error message if
        a specific symbol fails.
      * Raise RuntimeError if *every* symbol fails due to an upstream error.
    """
    try:
        ds = CombinedDataSource()
    except Exception as exc:
        # Bubble up a clear message if we can't construct the data source at all
        raise RuntimeError(str(exc))

    results: Dict[str, Dict[str, Any]] = {}
    last_err: Exception | None = None

    for raw_sym in symbols:
        sym = (raw_sym or "").strip().upper()
        if not sym:
            continue
        try:
            price = ds.get_spot(sym)
            results[sym] = {"price": float(price), "error": None}
        except Exception as exc:
            last_err = exc
            results[sym] = {"price": None, "error": str(exc)}

    # If *nothing* succeeded and we saw at least one error, surface that
    if not results and last_err is not None:
        raise RuntimeError(str(last_err))

    return results
