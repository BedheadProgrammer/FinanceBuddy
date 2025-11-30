from __future__ import annotations
from datetime import date
from django.http import JsonResponse, HttpRequest

from .calculator import (
    SpotPriceCalculator,
    RiskFreeRateCalculator,
    FundamentalsDividendYieldCalculator,
    HistoricalVolatilityCalculator,
    ConstantVolatilityCalculator,
    ImpliedVolatilityCalculator,
    YearFractionCalculator,
    GreeksCalculator,
    BAWAmericanOptionCalculator,
    VariablesAssembler,
)
from .data_sources import CombinedDataSource


def euro_price_api(request: HttpRequest) -> JsonResponse:
    q = request.GET
    try:
        symbol = str(q.get("symbol", "AAPL")).upper().strip()
        side = str(q.get("side", "CALL")).upper()
        strike = float(q["strike"])
        expiry = date.fromisoformat(q["expiry"])
        vol_mode = str(q.get("vol_mode", "HIST")).upper()
        market_option_price = q.get("market_option_price")
        constant_vol = q.get("constant_vol")
        use_ql = str(q.get("use_quantlib_daycount", "false")).lower() in ("1", "true", "yes")
    except Exception as e:
        return JsonResponse({"error": f"bad parameters: {e}"}, status=400)

    ds = CombinedDataSource()
    spot_calc = SpotPriceCalculator(data_source=ds)
    rate_calc = RiskFreeRateCalculator()
    div_calc = FundamentalsDividendYieldCalculator(data_source=ds)

    if constant_vol:
        vol_calc = ConstantVolatilityCalculator(float(constant_vol))
    elif vol_mode == "IV":
        vol_calc = ImpliedVolatilityCalculator()
    else:
        vol_calc = HistoricalVolatilityCalculator(data_source=ds)

    T_calc = YearFractionCalculator(use_quantlib=use_ql)
    assembler = VariablesAssembler(spot_calc, rate_calc, div_calc, vol_calc, T_calc)

    try:
        params = {"symbol": symbol, "side": side, "strike": strike, "expiry": expiry}
        if vol_mode == "IV" and market_option_price:
            params["market_option_price"] = float(market_option_price)
        vars_ = assembler.build(**params)

        greeks_calc = GreeksCalculator()
        greeks = greeks_calc.compute(
            S=vars_["S"],
            K=vars_["K"],
            r=vars_["r"],
            q=vars_["q"],
            sigma=vars_["sigma"],
            T=vars_["T"],
            side=vars_["side"],
        )
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

    out = {"inputs": vars_, "price_and_greeks": greeks}
    if isinstance(out["inputs"].get("as_of"), date):
        out["inputs"]["as_of"] = out["inputs"]["as_of"].isoformat()
    if isinstance(out["inputs"].get("expiry"), date):
        out["inputs"]["expiry"] = out["inputs"]["expiry"].isoformat()
    return JsonResponse(out, status=200)


def american_price_api(request: HttpRequest) -> JsonResponse:
    q = request.GET
    try:
        symbol = str(q.get("symbol", "AAPL")).upper().strip()
        side = str(q.get("side", "CALL")).upper()
        strike = float(q["strike"])
        expiry = date.fromisoformat(q["expiry"])
        vol_mode = str(q.get("vol_mode", "HIST")).upper()
        market_option_price = q.get("market_option_price")
        constant_vol = q.get("constant_vol")
        use_ql = str(q.get("use_quantlib_daycount", "false")).lower() in ("1", "true", "yes")
    except Exception as e:
        return JsonResponse({"error": f"bad parameters: {e}"}, status=400)

    ds = CombinedDataSource()
    spot_calc = SpotPriceCalculator(data_source=ds)
    rate_calc = RiskFreeRateCalculator()
    div_calc = FundamentalsDividendYieldCalculator(data_source=ds)

    if constant_vol:
        vol_calc = ConstantVolatilityCalculator(float(constant_vol))
    elif vol_mode == "IV":
        vol_calc = ImpliedVolatilityCalculator()
    else:
        vol_calc = HistoricalVolatilityCalculator(data_source=ds)

    T_calc = YearFractionCalculator(use_quantlib=use_ql)
    assembler = VariablesAssembler(spot_calc, rate_calc, div_calc, vol_calc, T_calc)

    try:
        params = {"symbol": symbol, "side": side, "strike": strike, "expiry": expiry}
        if vol_mode == "IV" and market_option_price:
            params["market_option_price"] = float(market_option_price)
        vars_ = assembler.build(**params)

        baw_calc = BAWAmericanOptionCalculator()
        am_result = baw_calc.compute(
            S=vars_["S"],
            K=vars_["K"],
            r=vars_["r"],
            q=vars_["q"],
            sigma=vars_["sigma"],
            T=vars_["T"],
            side=vars_["side"],
        )
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

    out = {"inputs": vars_, "american_result": am_result}
    if isinstance(out["inputs"].get("as_of"), date):
        out["inputs"]["as_of"] = out["inputs"]["as_of"].isoformat()
    if isinstance(out["inputs"].get("expiry"), date):
        out["inputs"]["expiry"] = out["inputs"]["expiry"].isoformat()
    return JsonResponse(out, status=200)
