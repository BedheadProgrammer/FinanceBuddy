from __future__ import annotations

from calendar import Calendar
from typing import Optional, Callable, List
from datetime import date
import math
import os

# Requires data_sources.py in the same package
from .data_sources import MarketDataSource, CombinedDataSource


# ---------------- Spot ----------------

class SpotPriceCalculator:
    """
    Spot from:
      1) injected ticker function (if provided),
      2) else injected MarketDataSource,
      3) else CombinedDataSource (AlphaVantage → TwelveData → yfinance).
    """
    def __init__(
        self,
        market_ticker_func: Optional[Callable[[str], float]] = None,
        data_source: Optional[MarketDataSource] = None,
    ):
        self.ticker = market_ticker_func
        self.ds = data_source or CombinedDataSource()

    def compute(self, symbol: str) -> float:
        if self.ticker:
            px = self.ticker(symbol)
            if px is None or px <= 0:
                raise ValueError(f"Invalid spot for {symbol}: {px}")
            return float(px)
        return float(self.ds.get_spot(symbol))


# ---------------- Risk-free rate (continuous) ----------------

class RiskFreeRateCalculator:
    """
    Pull scalar r from Django settings.RISK_FREE_RATE or ENV RISK_FREE_RATE.
    """
    def __init__(self, env_key: str = "RISK_FREE_RATE", default: float = 0.045):
        self.env_key = env_key
        self.default = float(default)

    def compute(self, as_of: Optional[date] = None, expiry: Optional[date] = None) -> float:
        val = None
        try:
            from django.conf import settings
            val = getattr(settings, "RISK_FREE_RATE", None)
        except Exception:
            val = None
        if val is None:
            val = os.getenv(self.env_key, str(self.default))
        return float(val)


# ---------------- Dividend / carry yield q ----------------

class FundamentalsDividendYieldCalculator:
    """Dividend/carry yield from MarketDataSource; returns default if missing."""
    def __init__(self, data_source: Optional[MarketDataSource] = None, default_if_missing: float = 0.0):
        self.ds = data_source or CombinedDataSource()
        self._default = float(default_if_missing)

    def compute(self, symbol: str, as_of: Optional[date] = None, expiry: Optional[date] = None) -> float:
        y = self.ds.get_dividend_yield(symbol)
        try:
            return float(y) if y is not None else self._default
        except Exception:
            return self._default


class ConstantDividendYieldCalculator:
    """Fixed carry/dividend yield (useful for tests or non-dividend underlyings)."""
    def __init__(self, q: float = 0.0):
        self.q = float(q)

    def compute(self, *_, **__) -> float:
        return self.q


# ---------------- Historical volatility σ ----------------

class HistoricalVolatilityCalculator:
    """
    Realized volatility from daily close-to-close log returns, annualized by sqrt(252).
    Data source must return ascending closes (oldest → newest).
    """
    def __init__(
        self,
        data_source: Optional[MarketDataSource] = None,
        lookback_days: int = 252,
        floor: float = 0.01,
        cap: float = 5.0,
    ):
        self.ds = data_source or CombinedDataSource()
        self.lookback = int(lookback_days)
        self.floor = float(floor)
        self.cap = float(cap)

    def compute(self, symbol: str, as_of: Optional[date] = None, expiry: Optional[date] = None) -> float:
        closes = self.ds.get_daily_closes(symbol, need=self.lookback)
        rets: List[float] = []
        for i in range(1, len(closes)):
            a, b = closes[i - 1], closes[i]
            if a > 0 and b > 0:
                rets.append(math.log(b / a))
        if len(rets) < 10:
            return 0.20  # conservative default for short series
        m = sum(rets) / len(rets)
        var = sum((r - m) ** 2 for r in rets) / (len(rets) - 1)
        sigma = math.sqrt(var) * math.sqrt(252.0)
        return max(self.floor, min(self.cap, sigma))


class ConstantVolatilityCalculator:
    """Fixed σ (for tests/overrides)."""
    def __init__(self, sigma: float):
        if sigma <= 0:
            raise ValueError("sigma must be > 0")
        self.sigma = float(sigma)

    def compute(self, *_, **__) -> float:
        return self.sigma


# ---------------- Implied volatility σ (QuantLib) ----------------

class ImpliedVolatilityCalculator:
    """
    Solve implied σ via QuantLib given a market option price.
    Inputs are primitives; style is European (analytic engine).
    """
    def __init__(self, calendar=None, day_count=None):
        import QuantLib as ql  # imported here to avoid hard dependency for other flows
        self.ql = ql
        self.calendar = calendar or ql.UnitedStates(Calendar)
        self.day_count = day_count or ql.Actual365Fixed()

    def compute(
        self,
        *,
        market_price: float,
        symbol: str,
        side: str,          # "CALL" or "PUT"
        strike: float,
        expiry: date,
        as_of: Optional[date],
        spot: float,
        rate: float,
        dividend_yield: float,
        guess: float = 0.20,
        tol: float = 1e-6,
        max_eval: int = 500,
        min_vol: float = 1e-6,
        max_vol: float = 4.0,
    ) -> float:
        ql = self.ql
        as_of_eff = as_of or date.today()
        if expiry <= as_of_eff:
            raise ValueError("expiry must be after as_of for IV solve")

        ql.Settings.instance().evaluationDate = ql.Date(as_of_eff.day, as_of_eff.month, as_of_eff.year)

        S = ql.QuoteHandle(ql.SimpleQuote(float(spot)))
        rf = ql.YieldTermStructureHandle(ql.FlatForward(0, self.calendar, float(rate), self.day_count))
        div = ql.YieldTermStructureHandle(ql.FlatForward(0, self.calendar, float(dividend_yield), self.day_count))
        vol = ql.BlackConstantVol(0, self.calendar, float(guess), self.day_count)
        vol_h = ql.BlackVolTermStructureHandle(vol)
        process = ql.BlackScholesMertonProcess(S, div, rf, vol_h)

        payoff = ql.PlainVanillaPayoff(
            ql.Option.Call if side.upper() == "CALL" else ql.Option.Put, float(strike)
        )
        ex = ql.EuropeanExercise(ql.Date(expiry.day, expiry.month, expiry.year))
        opt = ql.VanillaOption(payoff, ex)
        opt.setPricingEngine(ql.AnalyticEuropeanEngine(process))

        try:
            iv = opt.impliedVolatility(float(market_price), process, tol, max_eval, min_vol, max_vol)
        except Exception:
            iv = opt.impliedVolatility(float(market_price), process, tol, max_eval, min_vol, max_vol * 1.5)
        return float(max(min_vol, iv))


# ---------------- Time to expiry T (year fraction) ----------------

class YearFractionCalculator:
    """
    Actual/365 year fraction. If use_quantlib=True, uses QuantLib's Actual365Fixed.
    """
    def __init__(self, use_quantlib: bool = False):
        self.use_quantlib = use_quantlib
        if use_quantlib:
            import QuantLib as ql  # optional
            self._ql = ql
            self._dc = ql.Actual365Fixed()

    def compute(self, as_of: date, expiry: date) -> float:
        if expiry <= as_of:
            raise ValueError("expiry must be after as_of")
        if not self.use_quantlib:
            return (expiry - as_of).days / 365.0
        ql = self._ql
        d1 = ql.Date(as_of.day, as_of.month, as_of.year)
        d2 = ql.Date(expiry.day, expiry.month, expiry.year)
        return float(self._dc.yearFraction(d1, d2))


# ---------------- d1, d2 + Greeks (closed form) ----------------

def _phi(x: float) -> float:  # standard normal pdf
    return math.exp(-0.5 * x * x) / math.sqrt(2.0 * math.pi)

def _N(x: float) -> float:    # standard normal cdf
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

class D1D2Calculator:
    """BSM d1, d2 under continuous dividend yield q."""
    def compute(self, S: float, K: float, r: float, q: float, sigma: float, T: float) -> tuple[float, float]:
        if S <= 0 or K <= 0 or sigma <= 0 or T <= 0:
            raise ValueError("S, K, sigma, T must be positive.")
        num = math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T
        den = sigma * math.sqrt(T)
        d1 = num / den
        d2 = d1 - sigma * math.sqrt(T)
        return d1, d2

class GreeksCalculator:
    """
    Closed-form European price + Greeks with continuous dividend yield.
    Returns dict with fair_value, delta, gamma, theta (per year), vega, rho.
    """
    def compute(self, S: float, K: float, r: float, q: float, sigma: float, T: float, side: str) -> dict:
        side_u = side.upper()
        d1, d2 = D1D2Calculator().compute(S, K, r, q, sigma, T)
        Nd1, Nd2 = _N(d1), _N(d2)
        nd1 = _phi(d1)
        disc_r = math.exp(-r * T)
        disc_q = math.exp(-q * T)

        if side_u == "CALL":
            fair  = S * disc_q * Nd1 - K * disc_r * Nd2
            delta = disc_q * Nd1
            theta = -(S * disc_q * nd1 * sigma) / (2.0 * math.sqrt(T)) - r * K * disc_r * Nd2 + q * S * disc_q * Nd1
            rho   = K * T * disc_r * Nd2
        else:
            fair  = K * disc_r * _N(-d2) - S * disc_q * _N(-d1)
            delta = -disc_q * _N(-d1)
            theta = -(S * disc_q * nd1 * sigma) / (2.0 * math.sqrt(T)) + r * K * disc_r * _N(-d2) - q * S * disc_q * _N(-d1)
            rho   = -K * T * disc_r * _N(-d2)

        gamma = (disc_q * nd1) / (S * sigma * math.sqrt(T))
        vega  = S * disc_q * nd1 * math.sqrt(T)

        return {
            "fair_value": fair,
            "delta": delta,
            "gamma": gamma,
            "theta": theta,
            "vega": vega,
            "rho": rho,
        }


# ---------------- Assembler (primitives in, full input set out) ----------------

class VariablesAssembler:
    """
    Builds all variables needed by Black–Scholes pricers and greeks using the calculators.
    Accepts primitives; no external domain types required.
    """
    def __init__(
        self,
        spot_calc: SpotPriceCalculator,
        rate_calc: RiskFreeRateCalculator,
        div_calc,  # FundamentalsDividendYieldCalculator | ConstantDividendYieldCalculator
        vol_calc,  # HistoricalVolatilityCalculator | ConstantVolatilityCalculator | ImpliedVolatilityCalculator
        T_calc: YearFractionCalculator,
    ):
        self.spot_calc = spot_calc
        self.rate_calc = rate_calc
        self.div_calc = div_calc
        self.vol_calc = vol_calc
        self.T_calc = T_calc

    def build(
        self,
        *,
        symbol: str,
        side: str,            # "CALL" or "PUT"
        strike: float,
        expiry: date,
        as_of: Optional[date] = None,
        market_option_price: Optional[float] = None,  # required when using ImpliedVolatilityCalculator
    ) -> dict:
        side_u = side.upper()
        if side_u not in ("CALL", "PUT"):
            raise ValueError("side must be 'CALL' or 'PUT'")
        as_of_eff = as_of or date.today()

        S = self.spot_calc.compute(symbol)
        r = self.rate_calc.compute(as_of_eff, expiry)
        q = self.div_calc.compute(symbol, as_of_eff, expiry)

        if isinstance(self.vol_calc, ImpliedVolatilityCalculator):
            if market_option_price is None:
                raise ValueError("market_option_price is required for implied volatility")
            sigma = self.vol_calc.compute(
                market_price=float(market_option_price),
                symbol=symbol,
                side=side_u,
                strike=float(strike),
                expiry=expiry,
                as_of=as_of_eff,
                spot=S,
                rate=r,
                dividend_yield=q,
            )
        else:
            sigma = self.vol_calc.compute(symbol, as_of_eff, expiry)

        T = self.T_calc.compute(as_of_eff, expiry)
        d1, d2 = D1D2Calculator().compute(S, float(strike), r, q, sigma, T)

        return {
            "S": S,
            "K": float(strike),
            "r": r,
            "q": q,
            "sigma": sigma,
            "T": T,
            "d1": d1,
            "d2": d2,
            "side": side_u,
            "symbol": symbol,
            "as_of": as_of_eff,
            "expiry": expiry,
        }