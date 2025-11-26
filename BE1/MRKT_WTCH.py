import os
import sys
from typing import Iterable, Optional, Tuple

from twelvedata import TDClient



POPULAR = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA",
    "BRK.B", "JPM", "NFLX", "AMD", "INTC", "BAC", "XOM"]

def _get_td_client() -> TDClient:

    api_key = os.environ.get("TWELVEDATA_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Please set TwelveData_API_KEY environment variable"
        )
    return TDClient(apikey=api_key)

def _extract_price(obj) -> Optional[float]:
    "Pull latest price from TD"
    "keep parsing logic seperate so its modular"


    try:
        if isinstance(obj, dict):
            for k in ("price", "last", "close"):
                if k in obj and obj[k] not in (None, ""):
                    return float(str(obj[k]).replace(",", ""))
            return None
        if isinstance(obj, list) and obj:
            return _extract_price(obj[0])
    except Exception:
        pass
    return None

def get_current_price(symbol: str) -> Tuple[Optional[float], Optional[str]]:
    "get price from Parser for single stock"
    td = _get_td_client()
    sym = symbol.strip().upper()

    try:
        p = td.price(symbol=sym).as_json()
        price = _extract_price(p)
        if price is not None:
            return price, None
    except Exception as e:
        last_err = f"price endpoint error: {e}"
    else:
        last_err = None

    try:
        q = td.quote(symbol=sym).as_json()
        price = _extract_price(q)
        if price is not None:
            return price, None
        return None, f"Could not parse price from quote payload for {sym}."
    except Exception as e:
        # If both endpoints fail, return the combined error text so the caller
        if last_err:
            return None, f"{last_err}; quote endpoint error: {e}"
        return None, f"quote endpoint error: {e}"
def get_current_prices(tickers: Iterable[str]) -> dict:
    """
    Get current prices for several stocks at once.

    What this does:
      - Loops through the provided tickers.
      - Calls get_current_price for each one.
      - Builds and returns a dictionary like:
          {
            'AAPL': {'price': 123.45, 'error': None},
            'MSFT': {'price': None, 'error': '...'}
          }

    """
    out = {}
    for t in tickers:
        price, err = get_current_price(t)
        out[t.upper()] = {"price": price, "error": err}
    return out

def _prompt_user_selection() -> list[str]:
    """
    Ask the user which stocks they want to see.

    How it works:
      - Shows a numbered list of popular tickers.
      - Lets the user pick by number, multiple numbers, or choose custom symbols.
      - Returns a list of uppercase ticker symbols.
    """
    print("Select from popular tickers or enter your own (comma-separated):\n")
    for i, t in enumerate(POPULAR, 1):
        print(f"  {i:2d}. {t}")
    print("  0.  Enter custom tickers")

    choice = input("\nChoose (e.g., 1 or 1,2,5 or 0): ").strip()
    if choice == "0" or choice == "":
        raw = input("Enter symbols (e.g., AAPL,MSFT,BRK.B): ").strip()
        return [s.strip().upper() for s in raw.split(",") if s.strip()]

    try:
        if "," in choice:
            idxs = []
            for part in choice.split(","):
                idx = int(part)
                if 1 <= idx <= len(POPULAR):
                    idxs.append(idx)
            return [POPULAR[i - 1] for i in idxs] or [POPULAR[0]]
        idx = int(choice)
        if 1 <= idx <= len(POPULAR):
            return [POPULAR[idx - 1]]
    except ValueError:
        pass

    return [POPULAR[0]]

def _print_results(results: dict) -> None:

    print("\nCurrent Listing Prices")
    print("-" * 28)
    for sym, data in sorted(results.items()):
        price = data["price"]
        err = data["error"]
        if price is not None:
            print(f"{sym:<8}  ${price:,.2f}")
        else:
            print(f"{sym:<8}  —    (error: {err})")
    print()

def main(argv: list[str]) -> int:
    """
    Entry point for command-line use.

    Flow:
      1) If tickers are passed as arguments, use those (e.g., python app.py AAPL MSFT).
      2) Otherwise, show the menu and ask the user to pick.
      3) Fetch prices for the chosen tickers.
      4) Print the results.
      5) Exit with 0 if at least one price succeeded, otherwise a non-zero code.

    This makes it easy to test the backend behavior before wiring it into a web route.
    """
    if len(argv) > 1:
        tickers = [a.upper() for a in argv[1:]]
    else:
        tickers = _prompt_user_selection()

    if not tickers:
        print("No tickers provided.")
        return 1

    try:
        results = get_current_prices(tickers)
    except RuntimeError as e:

        print(str(e))
        return 2

    _print_results(results)
    # If at least one ticker returned a price, call it a success.
    ok = any(v["price"] is not None for v in results.values())
    return 0 if ok else 3

if __name__ == "__main__":

    raise SystemExit(main(sys.argv))