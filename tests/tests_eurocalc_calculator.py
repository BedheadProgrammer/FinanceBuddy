import pytest
from unittest.mock import patch, MagicMock
from datetime import date
from eurocalc.calculator import (
    SpotPriceCalculator,
    RiskFreeRateCalculator,
    FundamentalsDividendYieldCalculator,
    ConstantDividendYieldCalculator,
    HistoricalVolatilityCalculator,
    ConstantVolatilityCalculator,
    ImpliedVolatilityCalculator,
    YearFractionCalculator,
    D1D2Calculator,
    GreeksCalculator,
    BAWAmericanOptionCalculator,
    VariablesAssembler,
)


class TestSpotPriceCalculator:
    def test_compute_with_ticker(self):
        def ticker_func(symbol):
            return 100.0 if symbol == "AAPL" else None
        calc = SpotPriceCalculator(market_ticker_func=ticker_func)
        assert calc.compute("AAPL") == 100.0
        with pytest.raises(ValueError):
            calc.compute("INVALID")

    @patch('eurocalc.calculator.CombinedDataSource')
    def test_compute_with_data_source(self, mock_ds):
        mock_ds_instance = MagicMock()
        mock_ds_instance.get_spot.return_value = 150.0
        mock_ds.return_value = mock_ds_instance
        calc = SpotPriceCalculator()
        assert calc.compute("AAPL") == 150.0


class TestRiskFreeRateCalculator:
    def test_compute_default(self):
        calc = RiskFreeRateCalculator()
        rate = calc.compute()
        assert isinstance(rate, float)

    @patch.dict('os.environ', {'RISK_FREE_RATE': '0.05'})
    def test_compute_from_env(self):
        calc = RiskFreeRateCalculator()
        assert calc.compute() == 0.05


class TestFundamentalsDividendYieldCalculator:
    @patch('eurocalc.calculator.CombinedDataSource')
    def test_compute(self, mock_ds):
        mock_ds_instance = MagicMock()
        mock_ds_instance.get_dividend_yield.return_value = 0.02
        mock_ds.return_value = mock_ds_instance
        calc = FundamentalsDividendYieldCalculator()
        assert calc.compute("AAPL") == 0.02

    @patch('eurocalc.calculator.CombinedDataSource')
    def test_compute_missing(self, mock_ds):
        mock_ds_instance = MagicMock()
        mock_ds_instance.get_dividend_yield.return_value = None
        mock_ds.return_value = mock_ds_instance
        calc = FundamentalsDividendYieldCalculator(default_if_missing=0.01)
        assert calc.compute("AAPL") == 0.01


class TestConstantDividendYieldCalculator:
    def test_compute(self):
        calc = ConstantDividendYieldCalculator(q=0.03)
        assert calc.compute() == 0.03


class TestHistoricalVolatilityCalculator:
    @patch('eurocalc.calculator.CombinedDataSource')
    def test_compute(self, mock_ds):
        mock_ds_instance = MagicMock()
        mock_ds_instance.get_daily_closes.return_value = [100, 101, 102, 103, 104]
        mock_ds.return_value = mock_ds_instance
        calc = HistoricalVolatilityCalculator()
        vol = calc.compute("AAPL")
        assert isinstance(vol, float)
        assert 0.01 <= vol <= 5.0


class TestConstantVolatilityCalculator:
    def test_compute(self):
        calc = ConstantVolatilityCalculator(sigma=0.2)
        assert calc.compute() == 0.2

    def test_invalid_sigma(self):
        with pytest.raises(ValueError):
            ConstantVolatilityCalculator(sigma=0)


class TestImpliedVolatilityCalculator:
    @patch('QuantLib.Settings')
    @patch('QuantLib.Date')
    @patch('QuantLib.UnitedStates')
    @patch('QuantLib.Actual365Fixed')
    @patch('QuantLib.QuoteHandle')
    @patch('QuantLib.SimpleQuote')
    @patch('QuantLib.YieldTermStructureHandle')
    @patch('QuantLib.FlatForward')
    @patch('QuantLib.BlackConstantVol')
    @patch('QuantLib.BlackVolTermStructureHandle')
    @patch('QuantLib.BlackScholesMertonProcess')
    @patch('QuantLib.PlainVanillaPayoff')
    @patch('QuantLib.EuropeanExercise')
    @patch('QuantLib.VanillaOption')
    @patch('QuantLib.AnalyticEuropeanEngine')
    def test_compute(self, mock_engine, mock_option, mock_ex, mock_payoff, mock_process, mock_vol_h, mock_vol, mock_flat, mock_yield_h, mock_quote, mock_simple, mock_dc, mock_cal, mock_date, mock_settings):
        mock_option_instance = MagicMock()
        mock_option.return_value = mock_option_instance
        mock_option_instance.impliedVolatility.return_value = 0.25
        calc = ImpliedVolatilityCalculator()
        iv = calc.compute(
            market_price=5.0,
            symbol="AAPL",
            side="CALL",
            strike=110.0,
            expiry=date(2023, 12, 1),
            as_of=date(2023, 1, 1),
            spot=100.0,
            rate=0.05,
            dividend_yield=0.02
        )
        assert iv == 0.25


class TestYearFractionCalculator:
    def test_compute_simple(self):
        calc = YearFractionCalculator(use_quantlib=False)
        as_of = date(2023, 1, 1)
        expiry = date(2024, 1, 1)
        assert calc.compute(as_of, expiry) == 1.0

    def test_invalid_dates(self):
        calc = YearFractionCalculator()
        with pytest.raises(ValueError):
            calc.compute(date(2023, 1, 1), date(2022, 1, 1))


class TestD1D2Calculator:
    def test_compute(self):
        calc = D1D2Calculator()
        d1, d2 = calc.compute(100, 110, 0.05, 0.02, 0.2, 1)
        assert isinstance(d1, float)
        assert isinstance(d2, float)

    def test_invalid_inputs(self):
        calc = D1D2Calculator()
        with pytest.raises(ValueError):
            calc.compute(0, 110, 0.05, 0.02, 0.2, 1)


class TestGreeksCalculator:
    def test_compute_call(self):
        calc = GreeksCalculator()
        result = calc.compute(100, 110, 0.05, 0.02, 0.2, 1, "CALL")
        assert "fair_value" in result
        assert "delta" in result
        assert isinstance(result["fair_value"], float)

    def test_compute_put(self):
        calc = GreeksCalculator()
        result = calc.compute(100, 110, 0.05, 0.02, 0.2, 1, "PUT")
        assert "fair_value" in result
        assert isinstance(result["fair_value"], float)


class TestBAWAmericanOptionCalculator:
    def test_compute_call(self):
        calc = BAWAmericanOptionCalculator()
        result = calc.compute(100, 110, 0.05, 0.02, 0.2, 1, "CALL")
        assert "american_price" in result
        assert "european_price" in result
        assert isinstance(result["american_price"], float)

    def test_compute_put(self):
        calc = BAWAmericanOptionCalculator()
        result = calc.compute(100, 110, 0.05, 0.02, 0.2, 1, "PUT")
        assert "american_price" in result
        assert isinstance(result["american_price"], float)

    def test_invalid_inputs(self):
        calc = BAWAmericanOptionCalculator()
        with pytest.raises(ValueError):
            calc.compute(0, 110, 0.05, 0.02, 0.2, 1, "CALL")


class TestVariablesAssembler:
    @patch('eurocalc.calculator.SpotPriceCalculator')
    @patch('eurocalc.calculator.RiskFreeRateCalculator')
    @patch('eurocalc.calculator.FundamentalsDividendYieldCalculator')
    @patch('eurocalc.calculator.ConstantVolatilityCalculator')
    @patch('eurocalc.calculator.YearFractionCalculator')
    def test_build(self, mock_t_calc, mock_vol_calc, mock_div_calc, mock_rate_calc, mock_spot_calc):
        mock_spot_instance = MagicMock()
        mock_spot_instance.compute.return_value = 100.0
        mock_spot_calc.return_value = mock_spot_instance

        mock_rate_instance = MagicMock()
        mock_rate_instance.compute.return_value = 0.05
        mock_rate_calc.return_value = mock_rate_instance

        mock_div_instance = MagicMock()
        mock_div_instance.compute.return_value = 0.02
        mock_div_calc.return_value = mock_div_instance

        mock_vol_instance = MagicMock()
        mock_vol_instance.compute.return_value = 0.2
        mock_vol_calc.return_value = mock_vol_instance

        mock_t_instance = MagicMock()
        mock_t_instance.compute.return_value = 1.0
        mock_t_calc.return_value = mock_t_instance

        assembler = VariablesAssembler(
            spot_calc=mock_spot_calc.return_value,
            rate_calc=mock_rate_calc.return_value,
            div_calc=mock_div_calc.return_value,
            vol_calc=mock_vol_calc.return_value,
            T_calc=mock_t_calc.return_value
        )
        result = assembler.build(
            symbol="AAPL",
            side="CALL",
            strike=110.0,
            expiry=date(2023, 12, 1)
        )
        assert "S" in result
        assert result["S"] == 100.0
        assert "sigma" in result
        assert result["sigma"] == 0.2