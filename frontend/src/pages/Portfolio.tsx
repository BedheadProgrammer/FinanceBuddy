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

export default function Portfolio() {
  usePageMeta("Portfolio | FinanceBuddy", "Virtual Stock Exchange Portfolio");

  const [summary, setSummary] = useState<PortfolioSummaryPayload | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [tradeSymbol, setTradeSymbol] = useState("AAPL");
  const [tradeSide, setTradeSide] = useState<TradeSide>("BUY");
  const [tradeQuantity, setTradeQuantity] = useState("10");
  const [tradePrice, setTradePrice] = useState("");
  const [useMarketPrice, setUseMarketPrice] = useState(true);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);

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

  useEffect(() => {
    fetchSummary();
  }, []);

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
      side: tradeSide,
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
          `${json.trade.side} ${json.trade.quantity} ${json.trade.symbol} @ ${json.trade.price.toFixed(
            2
          )}`
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
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Place trade
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
                  <ToggleButtonGroup
                    color="primary"
                    value={tradeSide}
                    exclusive
                    onChange={(_, val) => val && setTradeSide(val)}
                    size="small"
                  >
                    <ToggleButton value="BUY">Buy</ToggleButton>
                    <ToggleButton value="SELL">Sell</ToggleButton>
                  </ToggleButtonGroup>

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
                    }}
                    fullWidth
                  >
                    {tradeLoading ? "Submitting trade..." : "Submit trade"}
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
              </Box>

              <Divider sx={{ my: 2.5 }} />

              {summaryLoading && (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading portfolio...
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

                  {summary.positions.length === 0 ? (
                    <Box sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No open stock positions yet. Place a trade to open your first position.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                        Open positions
                      </Typography>
                      <Box
                        sx={{
                          maxHeight: 360,
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
                              return (
                                <TableRow key={pos.symbol}>
                                  <TableCell>{pos.symbol}</TableCell>
                                  <TableCell align="right">
                                    {formatNumber(pos.quantity, 4)}
                                  </TableCell>
                                  <TableCell align="right">
                                    {formatMoney(pos.avg_cost, currency)}
                                  </TableCell>
                                  <TableCell align="right">
                                    {pos.error
                                      ? "N/A"
                                      : formatMoney(pos.market_price, currency)}
                                  </TableCell>
                                  <TableCell align="right">
                                    {formatMoney(pos.market_value, currency)}
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    sx={{ color: color }}
                                  >
                                    {pnl === null ? "—" : formatMoney(pnl, currency)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
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
