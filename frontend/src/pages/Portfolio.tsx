import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Divider,
  Stack,
  Container,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Collapse,
  Slider,
} from "@mui/material";
import { usePageMeta } from "../hooks/usePageMeta";

const GridItem = (props: any) => <Grid {...props} />;

type TradeSide = "BUY" | "SELL";

type PortfolioInfo = {
  id: number;
  name: string;
  currency: string;
  initial_cash: number;
  cash_balance: number;
  positions_value: number;
  total_equity: number;
};

type PortfolioPosition = {
  symbol: string;
  quantity: number;
  avg_cost: number;
  market_price: number | null;
  market_value: number | null;
  unrealized_pnl: number | null;
  error?: string;
};

type PortfolioSummaryPayload = {
  portfolio: PortfolioInfo;
  positions: PortfolioPosition[];
  market_error: string | null;
};

type TradeResponse = {
  ok: boolean;
  portfolio: {
    id: number;
    cash_balance: number;
  };
  trade: {
    id: number;
    symbol: string;
    side: TradeSide;
    quantity: number;
    price: number;
    fees: number;
    executed_at: string;
  };
  error?: string;
};

type AssistantMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

type OptionSide = "CALL" | "PUT";
type OptionStyle = "EUROPEAN" | "AMERICAN";

type OptionPositionApi = {
  id: number;
  portfolio_id: number;
  contract_id: number;
  underlying_symbol: string;
  option_side: OptionSide;
  option_style: OptionStyle;
  strike: string;
  expiry: string;
  multiplier: number;
  quantity: string;
  avg_cost: string;
};

type OptionPositionsApiResponse = {
  portfolio: {
    id: number;
    cash: string;
  };
  positions: OptionPositionApi[];
  error?: string;
};

type OptionPosition = {
  id: number;
  contract_id: number;
  underlying_symbol: string;
  option_side: OptionSide;
  option_style: OptionStyle;
  strike: number;
  expiry: string;
  multiplier: number;
  quantity: number;
  avg_cost: number;
};

type OptionTradeResponse = {
  trade: {
    id: number;
    portfolio_id: number;
    contract_id: number;
    side: TradeSide;
    quantity: string;
    price: string;
    fees: string;
    order_type: string;
    status: string;
    realized_pl: string;
    underlying_price_at_execution: string | null;
    executed_at: string;
  };
  contract: {
    id: number;
    underlying_symbol: string;
    option_side: OptionSide;
    option_style: OptionStyle;
    strike: string;
    expiry: string;
    multiplier: number;
    contract_symbol: string | null;
  };
  portfolio: {
    id: number;
    cash: string;
  };
  position: {
    id: number;
    quantity: string;
    avg_cost: string;
  } | null;
  error?: string;
};

type OptionExerciseResponse = {
  exercise: {
    id: number;
    portfolio_id: number;
    contract_id: number;
    quantity: string;
    underlying_price_at_exercise: string;
    intrinsic_value_per_contract: string;
    intrinsic_value_total: string;
    option_realized_pl: string;
    cash_delta: string;
    exercised_at: string;
  };
  contract: {
    id: number;
    underlying_symbol: string;
    option_side: OptionSide;
    option_style: OptionStyle;
    strike: string;
    expiry: string;
    multiplier: number;
    contract_symbol: string | null;
  };
  portfolio: {
    id: number;
    cash: string;
  };
  position: {
    id: number;
    quantity: string;
    avg_cost: string;
  } | null;
  error?: string;
};

export default function Portfolio() {
  usePageMeta("Portfolio | FinanceBuddy", "Virtual Stock Exchange Portfolio");

  const [summary, setSummary] = useState<PortfolioSummaryPayload | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [tradeSymbol, setTradeSymbol] = useState("AAPL");
  const [tradeQuantity, setTradeQuantity] = useState("10");
  const [tradePrice, setTradePrice] = useState("");
  const [useMarketPrice, setUseMarketPrice] = useState(true);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);

  const [sellStockSymbol, setSellStockSymbol] = useState<string | null>(null);
  const [sellStockQuantity, setSellStockQuantity] = useState<number>(0);
  const [sellStockLoading, setSellStockLoading] = useState(false);
  const [sellStockError, setSellStockError] = useState<string | null>(null);
  const [sellStockSuccess, setSellStockSuccess] = useState<string | null>(null);

  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);

  const [optionSymbol, setOptionSymbol] = useState("AAPL");
  const [optionSide, setOptionSide] = useState<OptionSide>("CALL");
  const [optionStyle, setOptionStyle] = useState<OptionStyle>("AMERICAN");
  const [optionStrike, setOptionStrike] = useState("");
  const [optionExpiry, setOptionExpiry] = useState("");
  const [optionQuantity, setOptionQuantity] = useState("1");
  const [optionTradeLoading, setOptionTradeLoading] = useState(false);
  const [optionTradeError, setOptionTradeError] = useState<string | null>(null);
  const [optionTradeSuccess, setOptionTradeSuccess] = useState<string | null>(null);

  const [optionPositions, setOptionPositions] = useState<OptionPosition[]>([]);
  const [optionPositionsLoading, setOptionPositionsLoading] = useState(false);
  const [optionPositionsError, setOptionPositionsError] = useState<string | null>(null);

  const [optionExerciseLoadingId, setOptionExerciseLoadingId] = useState<number | null>(null);
  const [optionExerciseError, setOptionExerciseError] = useState<string | null>(null);
  const [optionExerciseSuccess, setOptionExerciseSuccess] = useState<string | null>(null);

  const [sellOptionId, setSellOptionId] = useState<number | null>(null);
  const [sellOptionQuantity, setSellOptionQuantity] = useState<number>(0);
  const [sellOptionLoading, setSellOptionLoading] = useState(false);
  const [sellOptionError, setSellOptionError] = useState<string | null>(null);
  const [sellOptionSuccess, setSellOptionSuccess] = useState<string | null>(null);

  async function fetchSummary() {
    setSummaryError(null);
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/portfolio/summary/", {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = (json as any).error || "Failed to load portfolio.";
        setSummaryError(msg);
        setSummary(null);
      } else {
        setSummary(json as PortfolioSummaryPayload);
      }
    } catch (err: any) {
      setSummaryError(err?.message || "Failed to load portfolio.");
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function fetchOptionPositions(portfolioId: number) {
    setOptionPositionsError(null);
    setOptionPositionsLoading(true);
    try {
      const res = await fetch(`/api/options/positions/?portfolio_id=${portfolioId}`, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const json = (await res.json()) as OptionPositionsApiResponse;
      if (!res.ok || (json as any).error) {
        const msg = json.error || (json as any).error || "Failed to load option positions.";
        setOptionPositionsError(msg);
        setOptionPositions([]);
      } else {
        const mapped: OptionPosition[] = json.positions.map((p) => ({
          id: p.id,
          contract_id: p.contract_id,
          underlying_symbol: p.underlying_symbol,
          option_side: p.option_side,
          option_style: p.option_style,
          strike: Number(p.strike),
          expiry: p.expiry,
          multiplier: p.multiplier,
          quantity: Number(p.quantity),
          avg_cost: Number(p.avg_cost),
        }));
        setOptionPositions(mapped);
      }
    } catch (err: any) {
      setOptionPositionsError(err?.message || "Failed to load option positions.");
      setOptionPositions([]);
    } finally {
      setOptionPositionsLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (summary?.portfolio.id) {
      fetchOptionPositions(summary.portfolio.id);
    }
  }, [summary?.portfolio.id]);

  async function handleSubmitTrade(e: React.FormEvent) {
    e.preventDefault();
    setTradeError(null);
    setTradeSuccess(null);

    const quantityTrimmed = tradeQuantity.trim();
    if (!tradeSymbol.trim() || !quantityTrimmed) {
      setTradeError("Symbol and quantity are required.");
      return;
    }

    const body: any = {
      symbol: tradeSymbol.trim().toUpperCase(),
      side: "BUY" as TradeSide,
      quantity: Number(quantityTrimmed),
    };

    if (!useMarketPrice && tradePrice.trim()) {
      body.price = Number(tradePrice.trim());
    }

    setTradeLoading(true);
    try {
      const res = await fetch("/api/portfolio/trade/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as TradeResponse;

      if (!res.ok || !json.ok) {
        const msg = json.error || (json as any).error || "Trade failed.";
        setTradeError(msg);
      } else {
        setTradeSuccess(
          `Bought ${json.trade.quantity} ${json.trade.symbol} @ ${json.trade.price.toFixed(2)}`
        );
        setTradeQuantity("10");
        if (!useMarketPrice) {
          setTradePrice("");
        }
        await fetchSummary();
      }
    } catch (err: any) {
      setTradeError(err?.message || "Trade failed.");
    } finally {
      setTradeLoading(false);
    }
  }

  async function handleSellStock(symbol: string, quantity: number) {
    setSellStockError(null);
    setSellStockSuccess(null);

    if (quantity <= 0) {
      setSellStockError("Quantity must be greater than 0.");
      return;
    }

    const body: any = {
      symbol: symbol.toUpperCase(),
      side: "SELL" as TradeSide,
      quantity: quantity,
    };

    setSellStockLoading(true);
    try {
      const res = await fetch("/api/portfolio/trade/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as TradeResponse;

      if (!res.ok || !json.ok) {
        const msg = json.error || (json as any).error || "Sell failed.";
        setSellStockError(msg);
      } else {
        setSellStockSuccess(
          `Sold ${json.trade.quantity} ${json.trade.symbol} @ ${json.trade.price.toFixed(2)}`
        );
        setSellStockSymbol(null);
        setSellStockQuantity(0);
        await fetchSummary();
      }
    } catch (err: any) {
      setSellStockError(err?.message || "Sell failed.");
    } finally {
      setSellStockLoading(false);
    }
  }

  async function handleSubmitOptionTrade(e: React.FormEvent) {
    e.preventDefault();
    setOptionTradeError(null);
    setOptionTradeSuccess(null);

    if (!summary) {
      setOptionTradeError("Portfolio is not loaded yet.");
      return;
    }

    const symbolTrimmed = optionSymbol.trim();
    const quantityTrimmed = optionQuantity.trim();
    const strikeTrimmed = optionStrike.trim();
    const expiryTrimmed = optionExpiry.trim();

    if (!symbolTrimmed || !strikeTrimmed || !expiryTrimmed || !quantityTrimmed) {
      setOptionTradeError(
        "Underlying symbol, strike, expiry date, and contracts quantity are required."
      );
      return;
    }

    const quantityNum = Number(quantityTrimmed);
    const strikeNum = Number(strikeTrimmed);

    if (!Number.isFinite(strikeNum) || strikeNum <= 0) {
      setOptionTradeError("Strike must be a positive number.");
      return;
    }

    if (!Number.isFinite(quantityNum) || quantityNum <= 0) {
      setOptionTradeError("Contracts must be a positive number.");
      return;
    }

    setOptionTradeLoading(true);
    try {
      const symbolUpper = symbolTrimmed.toUpperCase();

      const params = new URLSearchParams({
        symbol: symbolUpper,
        side: optionSide,
        strike: strikeTrimmed,
        expiry: expiryTrimmed,
      });

      const quoteUrl =
        optionStyle === "EUROPEAN"
          ? `/api/euro/price/?${params.toString()}`
          : `/api/american/price/?${params.toString()}`;

      const quoteResp = await fetch(quoteUrl, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const quoteJson = await quoteResp.json();

      if (!quoteResp.ok || (quoteJson as any).error) {
        const msg = (quoteJson as any).error || "Failed to calculate option fair value.";
        setOptionTradeError(msg);
        return;
      }

      let fairPrice: number;

      if (optionStyle === "EUROPEAN") {
        const greeks = (quoteJson as any).price_and_greeks;
        fairPrice = Number(greeks?.fair_value);
      } else {
        const americanResult = (quoteJson as any).american_result;
        fairPrice = Number(americanResult?.american_price);
      }

      if (!Number.isFinite(fairPrice) || fairPrice <= 0) {
        setOptionTradeError("Could not compute a valid fair value for this option.");
        return;
      }

      const body = {
        portfolio_id: summary.portfolio.id,
        symbol: symbolUpper,
        option_side: optionSide,
        option_style: optionStyle,
        strike: strikeNum,
        expiry: expiryTrimmed,
        quantity: quantityNum,
        price: fairPrice,
        side: "BUY" as TradeSide,
      };

      const res = await fetch("/api/options/trade/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as OptionTradeResponse;

      if (!res.ok || (json as any).error) {
        const msg = json.error || (json as any).error || "Options trade failed.";
        setOptionTradeError(msg);
      } else {
        const contract = json.contract;
        const trade = json.trade;
        setOptionTradeSuccess(
          `Bought ${Number(trade.quantity)} ${contract.underlying_symbol} ${contract.option_side} ` +
            `@ strike ${Number(contract.strike).toFixed(2)} exp ${contract.expiry}`
        );
        setOptionQuantity("1");
        await fetchSummary();
        await fetchOptionPositions(json.portfolio.id);
      }
    } catch (err: any) {
      setOptionTradeError(err?.message || "Options trade failed.");
    } finally {
      setOptionTradeLoading(false);
    }
  }

  async function handleSellOption(pos: OptionPosition, quantity: number) {
    setSellOptionError(null);
    setSellOptionSuccess(null);

    if (!summary) {
      setSellOptionError("Portfolio is not loaded yet.");
      return;
    }

    if (quantity <= 0) {
      setSellOptionError("Quantity must be greater than 0.");
      return;
    }

    setSellOptionLoading(true);
    try {
      const symbolUpper = pos.underlying_symbol.toUpperCase();

      const params = new URLSearchParams({
        symbol: symbolUpper,
        side: pos.option_side,
        strike: pos.strike.toString(),
        expiry: pos.expiry,
      });

      const quoteUrl =
        pos.option_style === "EUROPEAN"
          ? `/api/euro/price/?${params.toString()}`
          : `/api/american/price/?${params.toString()}`;

      const quoteResp = await fetch(quoteUrl, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const quoteJson = await quoteResp.json();

      if (!quoteResp.ok || (quoteJson as any).error) {
        const msg = (quoteJson as any).error || "Failed to calculate option fair value.";
        setSellOptionError(msg);
        return;
      }

      let fairPrice: number;

      if (pos.option_style === "EUROPEAN") {
        const greeks = (quoteJson as any).price_and_greeks;
        fairPrice = Number(greeks?.fair_value);
      } else {
        const americanResult = (quoteJson as any).american_result;
        fairPrice = Number(americanResult?.american_price);
      }

      if (!Number.isFinite(fairPrice) || fairPrice <= 0) {
        setSellOptionError("Could not compute a valid fair value for this option.");
        return;
      }

      const body = {
        portfolio_id: summary.portfolio.id,
        symbol: symbolUpper,
        option_side: pos.option_side,
        option_style: pos.option_style,
        strike: pos.strike,
        expiry: pos.expiry,
        quantity: quantity,
        price: fairPrice,
        side: "SELL" as TradeSide,
      };

      const res = await fetch("/api/options/trade/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as OptionTradeResponse;

      if (!res.ok || (json as any).error) {
        const msg = json.error || (json as any).error || "Options sell failed.";
        setSellOptionError(msg);
      } else {
        const contract = json.contract;
        const trade = json.trade;
        setSellOptionSuccess(
          `Sold ${Number(trade.quantity)} ${contract.underlying_symbol} ${contract.option_side} ` +
            `@ strike ${Number(contract.strike).toFixed(2)} exp ${contract.expiry}`
        );
        setSellOptionId(null);
        setSellOptionQuantity(0);
        await fetchSummary();
        await fetchOptionPositions(summary.portfolio.id);
      }
    } catch (err: any) {
      setSellOptionError(err?.message || "Options sell failed.");
    } finally {
      setSellOptionLoading(false);
    }
  }

  async function handleExerciseOption(pos: OptionPosition) {
    if (!summary) {
      setOptionExerciseError("Portfolio is not loaded yet.");
      return;
    }

    const underlyingSymbol = pos.underlying_symbol.toUpperCase();
    const stockPos = summary.positions.find(
      (p) => p.symbol.toUpperCase() === underlyingSymbol
    );
    const underlyingPrice = stockPos?.market_price;

    if (
      underlyingPrice === null ||
      underlyingPrice === undefined ||
      !Number.isFinite(underlyingPrice)
    ) {
      setOptionExerciseError(
        `No valid market price available for ${underlyingSymbol}; cannot exercise this contract.`
      );
      return;
    }

    if (pos.quantity <= 0) {
      setOptionExerciseError("No contracts available to exercise for this position.");
      return;
    }

    setOptionExerciseError(null);
    setOptionExerciseSuccess(null);
    setOptionExerciseLoadingId(pos.id);

    try {
      const body = {
        portfolio_id: summary.portfolio.id,
        symbol: underlyingSymbol,
        option_side: pos.option_side,
        option_style: pos.option_style,
        strike: pos.strike,
        expiry: pos.expiry,
        quantity: pos.quantity,
        underlying_price: underlyingPrice,
      };

      const res = await fetch("/api/options/exercise/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as OptionExerciseResponse;

      if (!res.ok || (json as any).error) {
        const msg = json.error || (json as any).error || "Option exercise failed.";
        setOptionExerciseError(msg);
      } else {
        const ex = json.exercise;
        const contract = json.contract;
        const intrinsicPer = Number(ex.intrinsic_value_per_contract);
        const intrinsicTotal = Number(ex.intrinsic_value_total);
        setOptionExerciseSuccess(
          `Exercised ${Number(ex.quantity)} ${contract.underlying_symbol} ${contract.option_side} ` +
            `@ strike ${Number(contract.strike).toFixed(2)} for intrinsic ${intrinsicPer.toFixed(
              2
            )} (${intrinsicTotal.toFixed(2)} total).`
        );
        await fetchSummary();
        await fetchOptionPositions(summary.portfolio.id);
      }
    } catch (err: any) {
      setOptionExerciseError(err?.message || "Option exercise failed.");
    } finally {
      setOptionExerciseLoadingId(null);
    }
  }

  function formatMoney(value: number | null | undefined, currency = "USD") {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return "—";
    }
    return value.toLocaleString("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
  }

  function formatNumber(value: number | null | undefined, digits = 4) {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return "—";
    }
    return value.toFixed(digits);
  }

  function buildAssistantSnapshot(): PortfolioSummaryPayload | null {
    if (!summary) return null;
    return summary;
  }

  async function handleOpenAssistant() {
    const snapshot = buildAssistantSnapshot();
    if (!snapshot) return;

    setAssistantOpen(true);
    setAssistantError(null);

    if (assistantMessages.length > 0) {
      return;
    }

    setAssistantLoading(true);
    try {
      const resp = await fetch("/api/assistant/portfolio/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          snapshot,
          message:
            "Explain this virtual stock portfolio: cash, positions, market value, and unrealized P/L. " +
            "Point out any concentration, big winners/losers, and anything a student should pay attention to.",
        }),
      });
      const json = await resp.json();
      if (!resp.ok || (json as any).error) {
        setAssistantError((json as any).error || "Assistant request failed");
      } else if ((json as any).reply) {
        setAssistantMessages([
          {
            id: Date.now(),
            role: "assistant",
            content: (json as any).reply,
          },
        ]);
      }
    } catch (err: any) {
      setAssistantError(err?.message || "Assistant request failed");
    } finally {
      setAssistantLoading(false);
    }
  }

  async function handleSendAssistantMessage(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = assistantInput.trim();
    if (!trimmed) return;

    const snapshot = buildAssistantSnapshot();
    if (!snapshot) return;

    const userMsg: AssistantMessage = {
      id: Date.now(),
      role: "user",
      content: trimmed,
    };

    const history = [...assistantMessages, userMsg];
    setAssistantMessages(history);
    setAssistantInput("");
    setAssistantLoading(true);
    setAssistantError(null);

    try {
      const resp = await fetch("/api/assistant/portfolio/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          snapshot,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const json = await resp.json();
      if (!resp.ok || (json as any).error) {
        setAssistantError((json as any).error || "Assistant request failed");
      } else if ((json as any).reply) {
        setAssistantMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "assistant",
            content: (json as any).reply,
          },
        ]);
      }
    } catch (err: any) {
      setAssistantError(err?.message || "Assistant request failed");
    } finally {
      setAssistantLoading(false);
    }
  }

  const currency = summary?.portfolio.currency || "USD";

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 120px)",
        display: "flex",
        alignItems: "center",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography variant="h4" fontWeight={700}>
            Virtual Stock Exchange Portfolio
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Track your cash, holdings, and live P/L while placing simulated stock trades.
          </Typography>
        </Box>

        <Grid container spacing={3} justifyContent="center">
          <GridItem item xs={12} md={5}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "linear-gradient(160deg, #0f172a 0%, #020617 50%, #0f172a 100%)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Buy stock
              </Typography>
              <Box component="form" onSubmit={handleSubmitTrade}>
                <Stack spacing={2.5}>
                  <TextField
                    label="Symbol"
                    value={tradeSymbol}
                    onChange={(e) => setTradeSymbol(e.target.value)}
                    size="small"
                    fullWidth
                  />

                  <Grid container spacing={1.5}>
                    <GridItem item xs={6}>
                      <TextField
                        label="Quantity"
                        value={tradeQuantity}
                        onChange={(e) => setTradeQuantity(e.target.value)}
                        size="small"
                        fullWidth
                        type="number"
                        inputProps={{ step: "1", min: "0" }}
                      />
                    </GridItem>
                    <GridItem item xs={6}>
                      <TextField
                        label={useMarketPrice ? "Price (live)" : "Limit price"}
                        value={tradePrice}
                        onChange={(e) => {
                          setTradePrice(e.target.value);
                          if (e.target.value.trim()) {
                            setUseMarketPrice(false);
                          } else {
                            setUseMarketPrice(true);
                          }
                        }}
                        size="small"
                        fullWidth
                        type="number"
                        placeholder={useMarketPrice ? "Using market price" : ""}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ step: "0.01", min: "0" }}
                      />
                    </GridItem>
                  </Grid>

                  <Typography variant="caption" color="text.secondary">
                    Leave price blank to use the live market price from the data provider.
                  </Typography>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={tradeLoading}
                    sx={{
                      mt: 1,
                      borderRadius: 999,
                      textTransform: "none",
                      fontWeight: 600,
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                      },
                    }}
                    fullWidth
                  >
                    {tradeLoading ? "Buying…" : "Buy"}
                  </Button>

                  {tradeError && (
                    <Typography variant="body2" color="error">
                      {tradeError}
                    </Typography>
                  )}
                  {tradeSuccess && (
                    <Typography variant="body2" color="success.main">
                      {tradeSuccess}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Paper>

            <Paper
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "linear-gradient(160deg, #0f172a 0%, #020617 50%, #0f172a 100%)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Buy options contract
              </Typography>
              <Box component="form" onSubmit={handleSubmitOptionTrade}>
                <Stack spacing={2.5}>
                  <TextField
                    label="Underlying symbol"
                    value={optionSymbol}
                    onChange={(e) => setOptionSymbol(e.target.value)}
                    size="small"
                    fullWidth
                  />

                  <Grid container spacing={1.5}>
                    <GridItem item xs={6}>
                      <ToggleButtonGroup
                        color="primary"
                        value={optionSide}
                        exclusive
                        onChange={(_, val) => val && setOptionSide(val)}
                        size="small"
                        fullWidth
                      >
                        <ToggleButton value="CALL">Call</ToggleButton>
                        <ToggleButton value="PUT">Put</ToggleButton>
                      </ToggleButtonGroup>
                    </GridItem>
                    <GridItem item xs={6}>
                      <ToggleButtonGroup
                        color="primary"
                        value={optionStyle}
                        exclusive
                        onChange={(_, val) => val && setOptionStyle(val)}
                        size="small"
                        fullWidth
                      >
                        <ToggleButton value="AMERICAN">American</ToggleButton>
                        <ToggleButton value="EUROPEAN">European</ToggleButton>
                      </ToggleButtonGroup>
                    </GridItem>
                  </Grid>

                  <Grid container spacing={1.5}>
                    <GridItem item xs={6}>
                      <TextField
                        label="Strike"
                        value={optionStrike}
                        onChange={(e) => setOptionStrike(e.target.value)}
                        size="small"
                        fullWidth
                        type="number"
                        inputProps={{ step: "0.01", min: "0" }}
                      />
                    </GridItem>
                    <GridItem item xs={6}>
                      <TextField
                        label="Expiry"
                        value={optionExpiry}
                        onChange={(e) => setOptionExpiry(e.target.value)}
                        size="small"
                        fullWidth
                        type="date"
                        InputLabelProps={{ shrink: true }}
                      />
                    </GridItem>
                  </Grid>

                  <Grid container spacing={1.5}>
                    <GridItem item xs={6}>
                      <TextField
                        label="Contracts"
                        value={optionQuantity}
                        onChange={(e) => setOptionQuantity(e.target.value)}
                        size="small"
                        fullWidth
                        type="number"
                        inputProps={{ step: "1", min: "0" }}
                      />
                    </GridItem>
                  </Grid>

                  <Typography variant="caption" color="text.secondary">
                    One options contract controls 100 shares by default; total notional is premium ×
                    contracts × 100. Premium is calculated automatically using your option pricer.
                  </Typography>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={optionTradeLoading}
                    sx={{
                      mt: 1,
                      borderRadius: 999,
                      textTransform: "none",
                      fontWeight: 600,
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                      },
                    }}
                    fullWidth
                  >
                    {optionTradeLoading ? "Buying…" : "Buy"}
                  </Button>

                  {optionTradeError && (
                    <Typography variant="body2" color="error">
                      {optionTradeError}
                    </Typography>
                  )}
                  {optionTradeSuccess && (
                    <Typography variant="body2" color="success.main">
                      {optionTradeSuccess}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Paper>
          </GridItem>

          <GridItem item xs={12} md={7}>
            <Paper
              elevation={2}
              sx={{
                p: 4,
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.05)",
                backgroundColor: "rgba(2,6,23,0.4)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Portfolio overview
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Live snapshot of your simulated account and holdings.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleOpenAssistant}
                  disabled={!summary || summaryLoading || !!summaryError}
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    backgroundColor: "black",
                    borderColor: "black",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "#111",
                      borderColor: "#111",
                    },
                  }}
                >
                  Ask FinanceBud
                </Button>
              </Box>

              <Divider sx={{ my: 2.5 }} />

              {summaryLoading && (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading portfolio…
                  </Typography>
                </Box>
              )}

              {summaryError && !summaryLoading && (
                <Box sx={{ py: 4 }}>
                  <Typography variant="body2" color="error">
                    {summaryError}
                  </Typography>
                </Box>
              )}

              {!summaryLoading && !summaryError && summary && (
                <Box>
                  <Grid container spacing={1.5} sx={{ mb: 3 }}>
                    <GridItem item xs={12} sm={4}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: "rgba(15,23,42,0.3)",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Cash
                        </Typography>
                        <Typography variant="h6" sx={{ mt: 0.5 }}>
                          {formatMoney(summary.portfolio.cash_balance, currency)}
                        </Typography>
                      </Paper>
                    </GridItem>
                    <GridItem item xs={12} sm={4}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: "rgba(15,23,42,0.3)",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Positions value
                        </Typography>
                        <Typography variant="h6" sx={{ mt: 0.5 }}>
                          {formatMoney(summary.portfolio.positions_value, currency)}
                        </Typography>
                      </Paper>
                    </GridItem>
                    <GridItem item xs={12} sm={4}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: "rgba(15,23,42,0.3)",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Total equity
                        </Typography>
                        <Typography variant="h6" sx={{ mt: 0.5 }}>
                          {formatMoney(summary.portfolio.total_equity, currency)}
                        </Typography>
                      </Paper>
                    </GridItem>
                  </Grid>

                  {summary.market_error && (
                    <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
                      Market data warning: {summary.market_error}
                    </Typography>
                  )}

                  {sellStockError && (
                    <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                      {sellStockError}
                    </Typography>
                  )}
                  {sellStockSuccess && (
                    <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
                      {sellStockSuccess}
                    </Typography>
                  )}

                  {summary.positions.length === 0 ? (
                    <Box sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No open stock positions yet. Place a trade to open your first position.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Open stock positions
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mb: 1.5, display: "block" }}
                      >
                        Click a row to sell shares from that position
                      </Typography>
                      <Box
                        sx={{
                          maxHeight: 420,
                          overflowY: "auto",
                          borderRadius: 2,
                          border: "1px solid rgba(148,163,184,0.3)",
                        }}
                      >
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Symbol</TableCell>
                              <TableCell align="right">Quantity</TableCell>
                              <TableCell align="right">Avg cost</TableCell>
                              <TableCell align="right">Market price</TableCell>
                              <TableCell align="right">Market value</TableCell>
                              <TableCell align="right">Unrealized P/L</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {summary.positions.map((pos) => {
                              const pnl = pos.unrealized_pnl;
                              const color =
                                pnl === null
                                  ? "text.primary"
                                  : pnl > 0
                                  ? "#22c55e"
                                  : pnl < 0
                                  ? "#ef4444"
                                  : "text.primary";
                              const isSelected = sellStockSymbol === pos.symbol;
                              const maxQty = Math.floor(pos.quantity);
                              return (
                                <React.Fragment key={pos.symbol}>
                                  <TableRow
                                    onClick={() => {
                                      if (isSelected) {
                                        setSellStockSymbol(null);
                                        setSellStockQuantity(0);
                                      } else {
                                        setSellStockSymbol(pos.symbol);
                                        setSellStockQuantity(maxQty);
                                        setSellStockError(null);
                                        setSellStockSuccess(null);
                                      }
                                    }}
                                    sx={{
                                      cursor: "pointer",
                                      backgroundColor: isSelected
                                        ? "rgba(239, 68, 68, 0.1)"
                                        : "transparent",
                                      "&:hover": {
                                        backgroundColor: isSelected
                                          ? "rgba(239, 68, 68, 0.15)"
                                          : "rgba(255,255,255,0.03)",
                                      },
                                      transition: "background-color 0.2s ease",
                                    }}
                                  >
                                    <TableCell>{pos.symbol}</TableCell>
                                    <TableCell align="right">
                                      {formatNumber(pos.quantity, 4)}
                                    </TableCell>
                                    <TableCell align="right">
                                      {formatMoney(pos.avg_cost, currency)}
                                    </TableCell>
                                    <TableCell align="right">
                                      {pos.error ? "N/A" : formatMoney(pos.market_price, currency)}
                                    </TableCell>
                                    <TableCell align="right">
                                      {formatMoney(pos.market_value, currency)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ color }}>
                                      {pnl === null ? "—" : formatMoney(pnl, currency)}
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell
                                      colSpan={6}
                                      sx={{ p: 0, borderBottom: isSelected ? undefined : "none" }}
                                    >
                                      <Collapse in={isSelected} timeout="auto" unmountOnExit>
                                        <Box
                                          sx={{
                                            p: 2,
                                            backgroundColor: "rgba(239, 68, 68, 0.05)",
                                            borderTop: "1px solid rgba(239, 68, 68, 0.2)",
                                          }}
                                        >
                                          <Typography
                                            variant="body2"
                                            sx={{ mb: 1.5, fontWeight: 500 }}
                                          >
                                            Sell {pos.symbol}
                                          </Typography>
                                          <Box
                                            sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 2,
                                              flexWrap: "wrap",
                                            }}
                                          >
                                            <Box sx={{ flex: 1, minWidth: 140 }}>
                                              <Typography
                                                variant="caption"
                                                color="text.secondary"
                                              >
                                                Shares to sell: {sellStockQuantity}
                                              </Typography>
                                              <Slider
                                                value={sellStockQuantity}
                                                onChange={(_, val) =>
                                                  setSellStockQuantity(val as number)
                                                }
                                                min={1}
                                                max={maxQty}
                                                step={1}
                                                marks={[
                                                  { value: 1, label: "1" },
                                                  { value: maxQty, label: String(maxQty) },
                                                ]}
                                                sx={{
                                                  color: "#ef4444",
                                                  "& .MuiSlider-thumb": {
                                                    backgroundColor: "#ef4444",
                                                  },
                                                  "& .MuiSlider-track": {
                                                    backgroundColor: "#ef4444",
                                                  },
                                                }}
                                              />
                                            </Box>
                                            <TextField
                                              size="small"
                                              type="number"
                                              value={sellStockQuantity}
                                              onChange={(e) => {
                                                const val = Math.min(
                                                  Math.max(1, Number(e.target.value)),
                                                  maxQty
                                                );
                                                setSellStockQuantity(val);
                                              }}
                                              inputProps={{ min: 1, max: maxQty, step: 1 }}
                                              sx={{ width: 80 }}
                                            />
                                            <Button
                                              variant="contained"
                                              size="small"
                                              disabled={
                                                sellStockLoading || sellStockQuantity <= 0
                                              }
                                              onClick={() =>
                                                handleSellStock(pos.symbol, sellStockQuantity)
                                              }
                                              sx={{
                                                borderRadius: 999,
                                                textTransform: "none",
                                                fontWeight: 600,
                                                background:
                                                  "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                                "&:hover": {
                                                  background:
                                                    "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                                                },
                                                minWidth: 100,
                                              }}
                                            >
                                              {sellStockLoading ? "Selling…" : "Sell"}
                                            </Button>
                                          </Box>
                                        </Box>
                                      </Collapse>
                                    </TableCell>
                                  </TableRow>
                                </React.Fragment>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Open option positions
                    </Typography>

                    {optionPositionsLoading && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Loading option positions…
                      </Typography>
                    )}

                    {optionPositionsError && !optionPositionsLoading && (
                      <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                        {optionPositionsError}
                      </Typography>
                    )}

                    {optionExerciseError && (
                      <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                        {optionExerciseError}
                      </Typography>
                    )}

                    {optionExerciseSuccess && (
                      <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                        {optionExerciseSuccess}
                      </Typography>
                    )}

                    {sellOptionError && (
                      <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                        {sellOptionError}
                      </Typography>
                    )}

                    {sellOptionSuccess && (
                      <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                        {sellOptionSuccess}
                      </Typography>
                    )}

                    {!optionPositionsLoading &&
                      !optionPositionsError &&
                      optionPositions.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                          No open option positions yet. Place an options trade to open a contract.
                        </Typography>
                      )}

                    {!optionPositionsLoading &&
                      !optionPositionsError &&
                      optionPositions.length > 0 && (
                        <>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 1.5, display: "block" }}
                          >
                            Click a row to sell contracts from that position
                          </Typography>
                          <Box
                            sx={{
                              mt: 1,
                              maxHeight: 320,
                              overflowY: "auto",
                              borderRadius: 2,
                              border: "1px solid rgba(148,163,184,0.3)",
                            }}
                          >
                            <Table size="small" stickyHeader>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Contract</TableCell>
                                  <TableCell align="right">Side</TableCell>
                                  <TableCell align="right">Style</TableCell>
                                  <TableCell align="right">Strike</TableCell>
                                  <TableCell align="right">Expiry</TableCell>
                                  <TableCell align="right">Contracts</TableCell>
                                  <TableCell align="right">Avg cost</TableCell>
                                  <TableCell align="right">Total value</TableCell>
                                  <TableCell align="right">Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {optionPositions.map((pos) => {
                                  const isSelected = sellOptionId === pos.id;
                                  const maxQty = Math.floor(pos.quantity);
                                  return (
                                    <React.Fragment key={pos.id}>
                                      <TableRow
                                        onClick={() => {
                                          if (isSelected) {
                                            setSellOptionId(null);
                                            setSellOptionQuantity(0);
                                          } else {
                                            setSellOptionId(pos.id);
                                            setSellOptionQuantity(maxQty);
                                            setSellOptionError(null);
                                            setSellOptionSuccess(null);
                                          }
                                        }}
                                        sx={{
                                          cursor: "pointer",
                                          backgroundColor: isSelected
                                            ? "rgba(239, 68, 68, 0.1)"
                                            : "transparent",
                                          "&:hover": {
                                            backgroundColor: isSelected
                                              ? "rgba(239, 68, 68, 0.15)"
                                              : "rgba(255,255,255,0.03)",
                                          },
                                          transition: "background-color 0.2s ease",
                                        }}
                                      >
                                        <TableCell>{pos.underlying_symbol}</TableCell>
                                        <TableCell align="right">{pos.option_side}</TableCell>
                                        <TableCell align="right">
                                          {pos.option_style === "AMERICAN" ? "American" : "European"}
                                        </TableCell>
                                        <TableCell align="right">
                                          {formatNumber(pos.strike, 2)}
                                        </TableCell>
                                        <TableCell align="right">{pos.expiry}</TableCell>
                                        <TableCell align="right">
                                          {formatNumber(pos.quantity, 4)}
                                        </TableCell>
                                        <TableCell align="right">
                                          {formatMoney(pos.avg_cost, currency)}
                                        </TableCell>
                                        <TableCell align="right">
                                          {formatMoney(
                                            pos.avg_cost * pos.quantity * pos.multiplier,
                                            currency
                                          )}
                                        </TableCell>
                                        <TableCell align="right">
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleExerciseOption(pos);
                                            }}
                                            disabled={
                                              optionExerciseLoadingId === pos.id ||
                                              pos.quantity <= 0
                                            }
                                            sx={{ textTransform: "none", borderRadius: 999 }}
                                          >
                                            {optionExerciseLoadingId === pos.id
                                              ? "Exercising…"
                                              : "Exercise"}
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell
                                          colSpan={9}
                                          sx={{ p: 0, borderBottom: isSelected ? undefined : "none" }}
                                        >
                                          <Collapse in={isSelected} timeout="auto" unmountOnExit>
                                            <Box
                                              sx={{
                                                p: 2,
                                                backgroundColor: "rgba(239, 68, 68, 0.05)",
                                                borderTop: "1px solid rgba(239, 68, 68, 0.2)",
                                              }}
                                            >
                                              <Typography
                                                variant="body2"
                                                sx={{ mb: 1.5, fontWeight: 500 }}
                                              >
                                                Sell {pos.underlying_symbol} {pos.option_side}{" "}
                                                {formatNumber(pos.strike, 2)} {pos.expiry}
                                              </Typography>
                                              <Box
                                                sx={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 2,
                                                  flexWrap: "wrap",
                                                }}
                                              >
                                                <Box sx={{ flex: 1, minWidth: 140 }}>
                                                  <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                  >
                                                    Contracts to sell: {sellOptionQuantity}
                                                  </Typography>
                                                  <Slider
                                                    value={sellOptionQuantity}
                                                    onChange={(_, val) =>
                                                      setSellOptionQuantity(val as number)
                                                    }
                                                    min={1}
                                                    max={maxQty}
                                                    step={1}
                                                    marks={[
                                                      { value: 1, label: "1" },
                                                      { value: maxQty, label: String(maxQty) },
                                                    ]}
                                                    sx={{
                                                      color: "#ef4444",
                                                      "& .MuiSlider-thumb": {
                                                        backgroundColor: "#ef4444",
                                                      },
                                                      "& .MuiSlider-track": {
                                                        backgroundColor: "#ef4444",
                                                      },
                                                    }}
                                                  />
                                                </Box>
                                                <TextField
                                                  size="small"
                                                  type="number"
                                                  value={sellOptionQuantity}
                                                  onChange={(e) => {
                                                    const val = Math.min(
                                                      Math.max(1, Number(e.target.value)),
                                                      maxQty
                                                    );
                                                    setSellOptionQuantity(val);
                                                  }}
                                                  inputProps={{ min: 1, max: maxQty, step: 1 }}
                                                  sx={{ width: 80 }}
                                                />
                                                <Button
                                                  variant="contained"
                                                  size="small"
                                                  disabled={
                                                    sellOptionLoading || sellOptionQuantity <= 0
                                                  }
                                                  onClick={() =>
                                                    handleSellOption(pos, sellOptionQuantity)
                                                  }
                                                  sx={{
                                                    borderRadius: 999,
                                                    textTransform: "none",
                                                    fontWeight: 600,
                                                    background:
                                                      "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                                    "&:hover": {
                                                      background:
                                                        "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                                                    },
                                                    minWidth: 100,
                                                  }}
                                                >
                                                  {sellOptionLoading ? "Selling…" : "Sell"}
                                                </Button>
                                              </Box>
                                            </Box>
                                          </Collapse>
                                        </TableCell>
                                      </TableRow>
                                    </React.Fragment>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </Box>
                        </>
                      )}
                  </Box>

                  {assistantOpen && (
                    <Box
                      sx={{
                        mt: 3,
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid rgba(148,163,184,0.4)",
                        backgroundColor: "rgba(15,23,42,0.7)",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                        FinanceBud&apos;s portfolio explanation
                      </Typography>
                      {assistantError && (
                        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                          {assistantError}
                        </Typography>
                      )}
                      <Box
                        sx={{
                          maxHeight: 220,
                          overflowY: "auto",
                          mb: 1.5,
                          pr: 1,
                        }}
                      >
                        {assistantMessages.length === 0 &&
                          !assistantLoading &&
                          !assistantError && (
                            <Typography variant="body2" color="text.secondary">
                              Click &quot;Ask FinanceBud&quot; to get an explanation of your cash,
                              positions, and unrealized P/L, or ask questions like &quot;why is my
                              AAPL position down?&quot;
                            </Typography>
                          )}
                        {assistantMessages.map((msg) => (
                          <Box
                            key={msg.id}
                            sx={{
                              mb: 1,
                              textAlign: msg.role === "user" ? "right" : "left",
                            }}
                          >
                            <Box
                              sx={{
                                display: "inline-block",
                                px: 1.5,
                                py: 1,
                                borderRadius: 2,
                                backgroundColor:
                                  msg.role === "user"
                                    ? "rgba(59,130,246,0.3)"
                                    : "rgba(15,23,42,0.9)",
                              }}
                            >
                              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                                {msg.content}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                        {assistantLoading && (
                          <Typography variant="body2" color="text.secondary">
                            Thinking...
                          </Typography>
                        )}
                      </Box>
                      <Box
                        component="form"
                        onSubmit={handleSendAssistantMessage}
                        sx={{ display: "flex", gap: 1 }}
                      >
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Ask a question about this portfolio, cash, or P/L..."
                          value={assistantInput}
                          onChange={(e) => setAssistantInput(e.target.value)}
                          disabled={assistantLoading}
                          variant="outlined"
                        />
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={assistantLoading || !assistantInput.trim()}
                        >
                          Send
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
}
