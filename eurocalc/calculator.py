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


# ---------------- American option pricing (Barone-Adesi-Whaley) ----------------

class BAWAmericanOptionCalculator:
    """
    Barone-Adesi-Whaley (1987) approximation for American option pricing.
    Fast analytical approximation for American calls and puts with continuous dividends.
    
    Reference: Barone-Adesi, G., & Whaley, R. E. (1987). 
    "Efficient Analytic Approximation of American Option Values"
    Journal of Finance, 42(2), 301-320.
    """
    
    def __init__(self, max_iterations: int = 100, tolerance: float = 1e-6):
        self.max_iterations = max_iterations
        self.tolerance = tolerance
    
    def compute(self, S: float, K: float, r: float, q: float, sigma: float, T: float, side: str) -> dict:
        """
        Calculate American option price using BAW approximation.
        
        Args:
            S: Current spot price
            K: Strike price
            r: Risk-free rate (continuous)
            q: Dividend yield (continuous)
            sigma: Volatility (annualized)
            T: Time to expiry (years)
            side: "CALL" or "PUT"
        
        Returns:
            dict with:
                - american_price: American option value
                - european_price: European option value (for comparison)
                - early_exercise_premium: american_price - european_price
                - critical_price: Optimal early exercise boundary (S*)
        """
        if S <= 0 or K <= 0 or sigma <= 0 or T <= 0:
            raise ValueError("S, K, sigma, T must be positive.")
        
        side_u = side.upper()
        if side_u not in ("CALL", "PUT"):
            raise ValueError("side must be 'CALL' or 'PUT'")
        
        # Get European price first
        euro_calc = GreeksCalculator()
        euro_result = euro_calc.compute(S, K, r, q, sigma, T, side_u)
        european_price = euro_result["fair_value"]
        
        # Check for early exercise conditions
        if side_u == "CALL":
            # American call with no dividends (q=0) = European call
            if q <= 1e-10:
                return {
                    "american_price": european_price,
                    "european_price": european_price,
                    "early_exercise_premium": 0.0,
                    "critical_price": float('inf'),  # Never optimal to exercise early
                }
            
            # Check immediate exercise value
            intrinsic = max(S - K, 0)
            if T < 1e-10:  # At expiry
                return {
                    "american_price": intrinsic,
                    "european_price": european_price,
                    "early_exercise_premium": intrinsic - european_price,
                    "critical_price": K,
                }
            
            american_price, critical_price = self._baw_call(S, K, r, q, sigma, T)
        
        else:  # PUT
            # American put always has early exercise premium (can exercise early to get K)
            intrinsic = max(K - S, 0)
            if T < 1e-10:  # At expiry
                return {
                    "american_price": intrinsic,
                    "european_price": european_price,
                    "early_exercise_premium": intrinsic - european_price,
                    "critical_price": K,
                }
            
            american_price, critical_price = self._baw_put(S, K, r, q, sigma, T)
        
        early_exercise_premium = american_price - european_price
        
        return {
            "american_price": american_price,
            "european_price": european_price,
            "early_exercise_premium": early_exercise_premium,
            "critical_price": critical_price,
        }
    
    def _baw_call(self, S: float, K: float, r: float, q: float, sigma: float, T: float) -> tuple[float, float]:
        """BAW approximation for American call."""
        # Parameters
        M = 2.0 * r / (sigma * sigma)
        N = 2.0 * (r - q) / (sigma * sigma)
        K_factor = 1.0 - math.exp(-r * T)
        
        # q2 coefficient
        q2 = 0.5 * (-(N - 1) + math.sqrt((N - 1) ** 2 + 4.0 * M / K_factor))
        
        # Seed value for critical price S*
        S_star_seed = K + (K / (q2 - 1.0)) * (1.0 - math.exp(-q * T) * _N(self._d1(K, K, r, q, sigma, T)))
        
        # Newton-Raphson iteration to find critical price S*
        S_star = S_star_seed
        for _ in range(self.max_iterations):
            d1 = self._d1(S_star, K, r, q, sigma, T)
            LHS = S_star - K
            RHS = self._european_call(S_star, K, r, q, sigma, T) + (1.0 - math.exp(-q * T) * _N(d1)) * S_star / q2
            diff = LHS - RHS
            
            if abs(diff) < self.tolerance:
                break
            
            # Derivative for Newton-Raphson
            d_diff = (1.0 - math.exp(-q * T) * _N(d1)) * (1.0 - 1.0 / q2) + math.exp(-q * T) * _phi(d1) / (sigma * math.sqrt(T))
            S_star = S_star - diff / d_diff
        
        # Calculate American call price
        if S < S_star:
            # Below critical price: use European + early exercise premium
            A2 = (S_star / q2) * (1.0 - math.exp(-q * T) * _N(self._d1(S_star, K, r, q, sigma, T)))
            american_call = self._european_call(S, K, r, q, sigma, T) + A2 * (S / S_star) ** q2
        else:
            # Above critical price: immediate exercise optimal
            american_call = S - K
        
        return american_call, S_star
    
    def _baw_put(self, S: float, K: float, r: float, q: float, sigma: float, T: float) -> tuple[float, float]:
        """BAW approximation for American put."""
        # Parameters
        M = 2.0 * r / (sigma * sigma)
        N = 2.0 * (r - q) / (sigma * sigma)
        K_factor = 1.0 - math.exp(-r * T)
        
        # q1 coefficient (negative root for put)
        q1 = 0.5 * (-(N - 1) - math.sqrt((N - 1) ** 2 + 4.0 * M / K_factor))
        
        # Seed value for critical price S**
        S_star_seed = K - (K / (1.0 - q1)) * (1.0 - math.exp(-q * T) * _N(-self._d1(K, K, r, q, sigma, T)))
        
        # Newton-Raphson iteration to find critical price S**
        S_star = S_star_seed
        for _ in range(self.max_iterations):
            d1 = self._d1(S_star, K, r, q, sigma, T)
            LHS = K - S_star
            RHS = self._european_put(S_star, K, r, q, sigma, T) - (1.0 - math.exp(-q * T) * _N(-d1)) * S_star / q1
            diff = LHS - RHS
            
            if abs(diff) < self.tolerance:
                break
            
            # Derivative for Newton-Raphson
            d_diff = -(1.0 - math.exp(-q * T) * _N(-d1)) * (1.0 - 1.0 / q1) - math.exp(-q * T) * _phi(d1) / (sigma * math.sqrt(T))
            S_star = S_star - diff / d_diff
        
        # Calculate American put price
        if S > S_star:
            # Above critical price: use European + early exercise premium
            A1 = -(S_star / q1) * (1.0 - math.exp(-q * T) * _N(-self._d1(S_star, K, r, q, sigma, T)))
            american_put = self._european_put(S, K, r, q, sigma, T) + A1 * (S / S_star) ** q1
        else:
            # Below critical price: immediate exercise optimal
            american_put = K - S
        
        return american_put, S_star
    
    def _d1(self, S: float, K: float, r: float, q: float, sigma: float, T: float) -> float:
        """Helper: Calculate d1."""
        return (math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * math.sqrt(T))
    
    def _european_call(self, S: float, K: float, r: float, q: float, sigma: float, T: float) -> float:
        """Helper: European call price."""
        d1 = self._d1(S, K, r, q, sigma, T)
        d2 = d1 - sigma * math.sqrt(T)
        return S * math.exp(-q * T) * _N(d1) - K * math.exp(-r * T) * _N(d2)
    
    def _european_put(self, S: float, K: float, r: float, q: float, sigma: float, T: float) -> float:
        """Helper: European put price."""
        d1 = self._d1(S, K, r, q, sigma, T)
        d2 = d1 - sigma * math.sqrt(T)
        return K * math.exp(-r * T) * _N(-d2) - S * math.exp(-q * T) * _N(-d1)


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