import pytest
from unittest.mock import patch, MagicMock
from BE1.MRKT_WTCH import (
    _get_td_client,
    _extract_price,
    get_current_price,
    get_current_prices,
    _prompt_user_selection,
    _print_results,
    main,
    POPULAR
)


class TestGetTdClient:
    @patch.dict('os.environ', {'TWELVEDATA_API_KEY': 'test_key'})
    def test_success(self):
        client = _get_td_client()
        assert client is not None

    @patch.dict('os.environ', {}, clear=True)
    def test_missing_key(self):
        with pytest.raises(RuntimeError, match="Please set TwelveData_API_KEY"):
            _get_td_client()


class TestExtractPrice:
    def test_dict_with_price(self):
        obj = {"price": "123.45"}
        assert _extract_price(obj) == 123.45

    def test_dict_with_last(self):
        obj = {"last": "100"}
        assert _extract_price(obj) == 100.0

    def test_dict_with_close(self):
        obj = {"close": "200,000"}
        assert _extract_price(obj) == 200000.0

    def test_dict_no_price(self):
        obj = {"other": "value"}
        assert _extract_price(obj) is None

    def test_list_with_dict(self):
        obj = [{"price": "150"}]
        assert _extract_price(obj) == 150.0

    def test_list_empty(self):
        obj = []
        assert _extract_price(obj) is None

    def test_invalid_type(self):
        obj = "string"
        assert _extract_price(obj) is None

    def test_exception(self):
        obj = {"price": "invalid"}
        assert _extract_price(obj) is None


class TestGetCurrentPrice:
    @patch('BE1.MRKT_WTCH._get_td_client')
    def test_price_success(self, mock_get_client):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_client.price.return_value.as_json.return_value = {"price": "123.45"}

        price, error = get_current_price("AAPL")
        assert price == 123.45
        assert error is None

    @patch('BE1.MRKT_WTCH._get_td_client')
    def test_price_fail_quote_success(self, mock_get_client):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_client.price.side_effect = Exception("Price error")
        mock_client.quote.return_value.as_json.return_value = {"last": "100"}

        price, error = get_current_price("AAPL")
        assert price == 100.0
        assert error is None

    @patch('BE1.MRKT_WTCH._get_td_client')
    def test_both_fail(self, mock_get_client):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_client.price.side_effect = Exception("Price error")
        mock_client.quote.side_effect = Exception("Quote error")

        price, error = get_current_price("AAPL")
        assert price is None
        assert "Price error" in error
        assert "Quote error" in error

    @patch('BE1.MRKT_WTCH._get_td_client')
    def test_quote_no_price(self, mock_get_client):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_client.price.side_effect = Exception("Price error")
        mock_client.quote.return_value.as_json.return_value = {"other": "value"}

        price, error = get_current_price("AAPL")
        assert price is None
        assert "Could not parse price" in error


class TestGetCurrentPrices:
    @patch('BE1.MRKT_WTCH.get_current_price')
    def test_multiple_tickers(self, mock_get_price):
        mock_get_price.side_effect = [(100.0, None), (None, "Error"), (200.0, None)]

        results = get_current_prices(["AAPL", "MSFT", "NVDA"])
        assert results["AAPL"]["price"] == 100.0
        assert results["AAPL"]["error"] is None
        assert results["MSFT"]["price"] is None
        assert results["MSFT"]["error"] == "Error"
        assert results["NVDA"]["price"] == 200.0


class TestPromptUserSelection:
    @patch('builtins.input')
    def test_select_single(self, mock_input):
        mock_input.return_value = "1"
        result = _prompt_user_selection()
        assert result == ["AAPL"]

    @patch('builtins.input')
    def test_select_multiple(self, mock_input):
        mock_input.return_value = "1,2"
        result = _prompt_user_selection()
        assert result == ["AAPL", "MSFT"]

    @patch('builtins.input')
    def test_custom_tickers(self, mock_input):
        mock_input.side_effect = ["0", "GOOG,TSLA"]
        result = _prompt_user_selection()
        assert result == ["GOOG", "TSLA"]

    @patch('builtins.input')
    def test_invalid_choice(self, mock_input):
        mock_input.return_value = "99"
        result = _prompt_user_selection()
        assert result == ["AAPL"]  # Default


class TestPrintResults:
    @patch('builtins.print')
    def test_print(self, mock_print):
        results = {
            "AAPL": {"price": 123.45, "error": None},
            "MSFT": {"price": None, "error": "Error"}
        }
        _print_results(results)
        # Check that print was called multiple times
        assert mock_print.call_count > 0


class TestMain:
    @patch('BE1.MRKT_WTCH.get_current_prices')
    @patch('BE1.MRKT_WTCH._print_results')
    def test_with_args(self, mock_print, mock_get_prices):
        mock_get_prices.return_value = {"AAPL": {"price": 100.0, "error": None}}
        result = main(["script", "AAPL"])
        assert result == 0

    @patch('BE1.MRKT_WTCH._prompt_user_selection')
    @patch('BE1.MRKT_WTCH.get_current_prices')
    @patch('BE1.MRKT_WTCH._print_results')
    def test_no_args(self, mock_print, mock_get_prices, mock_prompt):
        mock_prompt.return_value = ["AAPL"]
        mock_get_prices.return_value = {"AAPL": {"price": 100.0, "error": None}}
        result = main(["script"])
        assert result == 0

    @patch('BE1.MRKT_WTCH._prompt_user_selection')
    def test_no_tickers(self, mock_prompt):
        mock_prompt.return_value = []
        result = main(["script"])
        assert result == 1

    @patch('BE1.MRKT_WTCH._prompt_user_selection')
    @patch('BE1.MRKT_WTCH.get_current_prices')
    def test_runtime_error(self, mock_get_prices, mock_prompt):
        mock_prompt.return_value = ["AAPL"]
        mock_get_prices.side_effect = RuntimeError("API error")
        result = main(["script"])
        assert result == 2

    @patch('BE1.MRKT_WTCH._prompt_user_selection')
    @patch('BE1.MRKT_WTCH.get_current_prices')
    @patch('BE1.MRKT_WTCH._print_results')
    def test_no_prices(self, mock_print, mock_get_prices, mock_prompt):
        mock_prompt.return_value = ["AAPL"]
        mock_get_prices.return_value = {"AAPL": {"price": None, "error": "Error"}}
        result = main(["script"])
        assert result == 3