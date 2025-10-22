# main.py
from __future__ import annotations
import os
import sys
import argparse
from datetime import datetime, date
"This is a simple main method we can use to test the data parsers."
"Please note that you will need to create an Alpha Vantage account and include API key at multiple steps in this process,"

from data_sources import AlphaVantageDataSource, CombinedDataSource
from calculator import (
    SpotPriceCalculator,
    RiskFreeRateCalculator,
    FundamentalsDividendYieldCalculator,
    ConstantDividendYieldCalculator,
    HistoricalVolatilityCalculator,
    ImpliedVolatilityCalculator,
    ConstantVolatilityCalculator,
    YearFractionCalculator,
    VariablesAssembler,
    GreeksCalculator,
)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Quick tester for data_sources.py + calculators.py"
    )
    p.add_argument("--symbol", required=True, help="Underlying symbol (e.g., AAPL)")
    p.add_argument("--side", required=True, choices=["CALL", "PUT", "call", "put"], help="Option side")
    p.add_argument("--strike", required=True, type=float, help="Strike price")
    p.add_argument("--expiry", required=True, help="Expiry date (YYYY-MM-DD)")
    p.add_argument("--as-of", dest="as_of", default=None, help="Valuation date YYYY-MM-DD (default: today)")
    p.add_argument("--market-price", dest="market_price", type=float, default=None,
                   help="Observed option price (enables implied vol solve if provided)")
    p.add_argument("--sigma", type=float, default=None,
                   help="Override volatility (use instead of historical/implied)")
    p.add_argument("--q", type=float, default=None,
                   help="Override dividend/carry yield (decimal, e.g., 0.012 for 1.2%)")
    p.add_argument("--lookback", type=int, default=252, help="Historical vol lookback days (default 252)")
    p.add_argument("--use-ql-daycount", action="store_true", help="Use QuantLib Actual/365 for T")
    return p.parse_args()


def to_date(s: str | None) -> date | None:
    if not s:
        return None
    return datetime.strptime(s, "%Y-%m-%d").date()


def main() -> int:
    args = parse_args()

    symbol = args.symbol.strip().upper()
    side = args.side.upper()
    strike = float(args.strike)
    expiry = to_date(args.expiry)
    as_of = to_date(args.as_of) or date.today()

    if expiry is None:
        print("Invalid --expiry format; expected YYYY-MM-DD", file=sys.stderr)
        return 2
    if expiry <= as_of:
        print("Expiry must be after valuation date (--as-of).", file=sys.stderr)
        return 2

    # Prefer Alpha Vantage if key configured; else CombinedDataSource handles fallbacks.
    ds = None
    if os.getenv("ALPHAVANTAGE_API_KEY") or os.getenv("ALPHA_VANTAGE_API_KEY"):
        try:
            ds = AlphaVantageDataSource()
        except Exception as e:
            print(f"[warn] Alpha Vantage unavailable: {e}", file=sys.stderr)
            ds = None
    if ds is None:
        ds = CombinedDataSource()

    # Calculators --------------------------------------------------------------
    spot_calc = SpotPriceCalculator(data_source=ds)
    rate_calc = RiskFreeRateCalculator()

    if args.q is not None:
        div_calc = ConstantDividendYieldCalculator(args.q)
    else:
        div_calc = FundamentalsDividendYieldCalculator(data_source=ds)

    if args.sigma is not None:
        vol_calc = ConstantVolatilityCalculator(args.sigma)
    elif args.market_price is not None:
        try:
            vol_calc = ImpliedVolatilityCalculator()  # requires QuantLib
        except Exception as e:
            print(f"[error] QuantLib required for implied vol: {e}", file=sys.stderr)
            return 2
    else:
        vol_calc = HistoricalVolatilityCalculator(data_source=ds, lookback_days=args.lookback)

    t_calc = YearFractionCalculator(use_quantlib=args.use_ql_daycount)

    assembler = VariablesAssembler(
        spot_calc=spot_calc,
        rate_calc=rate_calc,
        div_calc=div_calc,
        vol_calc=vol_calc,
        T_calc=t_calc,
    )

    # Build variables ----------------------------------------------------------
    try:
        vars_dict = assembler.build(
            symbol=symbol,
            side=side,
            strike=strike,
            expiry=expiry,
            as_of=as_of,
            market_option_price=args.market_price,
        )
    except Exception as e:
        print(f"[error] assembling variables: {e}", file=sys.stderr)
        return 1

    # Price + Greeks (closed form) --------------------------------------------
    try:
        greeks = GreeksCalculator().compute(
            S=vars_dict["S"],
            K=vars_dict["K"],
            r=vars_dict["r"],
            q=vars_dict["q"],
            sigma=vars_dict["sigma"],
            T=vars_dict["T"],
            side=vars_dict["side"],
        )
    except Exception as e:
        print(f"[error] computing greeks: {e}", file=sys.stderr)
        return 1

    # Output -------------------------------------------------------------------
    print("\n=== Inputs ===")
    print(f"Symbol: {vars_dict['symbol']}")
    print(f"Side:   {vars_dict['side']}")
    print(f"S:      {vars_dict['S']:.6f}")
    print(f"K:      {vars_dict['K']:.6f}")
    print(f"r:      {vars_dict['r']:.6f}")
    print(f"q:      {vars_dict['q']:.6f}")
    print(f"sigma:  {vars_dict['sigma']:.6f}")
    print(f"T:      {vars_dict['T']:.6f} years")
    print(f"d1:     {vars_dict['d1']:.6f}")
    print(f"d2:     {vars_dict['d2']:.6f}")
    print(f"as_of:  {vars_dict['as_of']}")
    print(f"expiry: {vars_dict['expiry']}")

    print("\n=== Price & Greeks (BSM, continuous q) ===")
    print(f"Fair Value: {greeks['fair_value']:.6f}")
    print(f"Delta:      {greeks['delta']:.6f}")
    print(f"Gamma:      {greeks['gamma']:.6f}")
    print(f"Theta/yr:   {greeks['theta']:.6f}")
    print(f"Vega:       {greeks['vega']:.6f}")
    print(f"Rho:        {greeks['rho']:.6f}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
