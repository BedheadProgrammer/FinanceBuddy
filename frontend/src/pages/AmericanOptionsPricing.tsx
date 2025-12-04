import React, { useMemo, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Divider,
  Stack,
  Container,
} from "@mui/material";
import { usePageMeta } from "../hooks/usePageMeta";

const GridItem = (props: any) => <Grid {...props} />;

type Inputs = {
  S: number;
  K: number;
  r: number;
  q: number;
  sigma: number;
  T: number;
  d1: number;
  d2: number;
  side: "CALL" | "PUT";
  symbol: string;
  as_of: string;
  expiry: string;
};
type AmericanResult = {
  american_price: number;
  european_price: number;
  early_exercise_premium: number;
  critical_price: number | null;
};
type Greeks = {
  fair_value: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
};
type AmericanApiResponse =
  | { inputs: Inputs; american_result: AmericanResult; greeks: Greeks }
  | { error: string };

type AssistantMessage = { id: number; role: "user" | "assistant"; content: string };

export default function AmericanOptionsPricing() {
  usePageMeta("American Option Calculator | FinanceBuddy", "American option calculator");

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [symbol, setSymbol] = useState("AAPL");
  const [side, setSide] = useState<"CALL" | "PUT">("CALL");
  const [strike, setStrike] = useState("200");
  const [expiry, setExpiry] = useState("2026-01-16");
  const [volMode, setVolMode] = useState<"HIST" | "IV" | "CONST">("HIST");
  const [marketOptionPrice, setMarketOptionPrice] = useState("");
  const [constantVol, setConstantVol] = useState("");
  const [useQL, setUseQL] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AmericanApiResponse | null>(null);

  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);

  function buildAssistantSnapshot() {
    if (!data || (data as any).error || !(data as any).american_result) return null;
    return {
      inputs: (data as any).inputs,
      american_result: (data as any).american_result,
      greeks: (data as any).greeks,
    };
  }

  async function handleOpenAssistant() {
    const snapshot = buildAssistantSnapshot();
    if (!snapshot) return;
    setAssistantError(null);
    setAssistantOpen(true);
    if (assistantMessages.length > 0) return;

    setAssistantLoading(true);
    try {
      const resp = await fetch("/api/assistant/american/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          snapshot,
          message:
            "Explain this American option pricing result in simple terms, including what the prices, premium, early exercise behavior, and Greeks mean for the trader.",
        }),
      });
      const json = await resp.json();
      if (!resp.ok || (json as any).error) {
        setAssistantError((json as any).error || "Assistant request failed");
      } else {
        setAssistantMessages([
          {
            id: Date.now(),
            role: "assistant",
            content: (json as any).reply ?? "",
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

    const newUserMessage: AssistantMessage = {
      id: Date.now(),
      role: "user",
      content: trimmed,
    };
    const history = [...assistantMessages, newUserMessage];
    setAssistantMessages(history);
    setAssistantInput("");
    setAssistantLoading(true);
    setAssistantError(null);

    try {
      const resp = await fetch("/api/assistant/american/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setData(null);
    setLoading(true);

    const params = new URLSearchParams({
      symbol: symbol.trim().toUpperCase(),
      side,
      strike: strike.trim(),
      expiry,
      vol_mode: volMode,
    });
    if (volMode === "IV" && marketOptionPrice.trim()) params.set("market_option_price", marketOptionPrice.trim());
    if (constantVol.trim()) params.set("constant_vol", constantVol.trim());
    if (useQL) params.set("use_quantlib_daycount", "true");

    try {
      const res = await fetch(`/api/american/price/?${params.toString()}`, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok || (json as any).error) {
        setError((json as any).error || "Something went wrong");
        setData(null);
      } else {
        setData(json as AmericanApiResponse);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const hasResult = !!data && !(data as any).error && (data as any).american_result;
  const result = hasResult ? (data as any) : null;

  let criticalDisplay = "N/A";
  if (result) {
    const raw = result.american_result.critical_price as number | null;
    const Knum = result.inputs.K as number;
    const invalid = raw == null || !Number.isFinite(raw) || raw <= 0 || !Knum || raw > 10 * Knum;
    criticalDisplay = invalid ? "N/A" : raw.toFixed(4);
  }

  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <GridItem item xs={12} md={5}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                background: "radial-gradient(circle at top left, #1e293b 0%, #020617 55%, #000 100%)",
                border: "1px solid rgba(148,163,184,0.4)",
                boxShadow: "0 18px 60px rgba(15,23,42,0.9)",
              }}
            >
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: 2 }} color="primary.light">
                    FinanceBud
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    American option calculator
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Price an American call or put using the Barone-Adesi Whaley approximation with live
                    market inputs.
                  </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={2}>
                    <TextField
                      label="Symbol"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      size="small"
                      fullWidth
                    />

                    <ToggleButtonGroup
                      color="primary"
                      value={side}
                      exclusive
                      onChange={(_, next) => next && setSide(next)}
                      size="small"
                    >
                      <ToggleButton value="CALL">Call</ToggleButton>
                      <ToggleButton value="PUT">Put</ToggleButton>
                    </ToggleButtonGroup>

                    <Grid container spacing={1.5}>
                      <GridItem item xs={6}>
                        <TextField
                          label="Strike"
                          value={strike}
                          onChange={(e) => setStrike(e.target.value)}
                          size="small"
                          fullWidth
                          type="number"
                          inputProps={{ step: "0.01" }}
                        />
                      </GridItem>
                      <GridItem item xs={6}>
                        <TextField
                          label="Expiration"
                          type="date"
                          size="small"
                          fullWidth
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ min: todayISO }}
                        />
                      </GridItem>
                    </Grid>

                    <TextField
                      select
                      label="Volatility mode"
                      size="small"
                      fullWidth
                      value={volMode}
                      onChange={(e) => setVolMode(e.target.value as any)}
                    >
                      <MenuItem value="HIST">Use historical volatility</MenuItem>
                      <MenuItem value="IV">Match market option price (IV)</MenuItem>
                      <MenuItem value="CONST">Use constant volatility</MenuItem>
                    </TextField>

                    {volMode === "IV" && (
                      <TextField
                        label="Market option price"
                        size="small"
                        fullWidth
                        type="number"
                        value={marketOptionPrice}
                        onChange={(e) => setMarketOptionPrice(e.target.value)}
                        InputProps={{ startAdornment: <span>$</span> as any }}
                      />
                    )}

                    {volMode === "CONST" && (
                      <TextField
                        label="Constant volatility (σ)"
                        size="small"
                        fullWidth
                        type="number"
                        value={constantVol}
                        onChange={(e) => setConstantVol(e.target.value)}
                        InputProps={{ endAdornment: <span>%</span> as any }}
                      />
                    )}

                    <FormControlLabel
                      control={
                        <Switch
                          checked={useQL}
                          onChange={(e) => setUseQL(e.target.checked)}
                          size="small"
                        />
                      }
                      label="Use QuantLib day count"
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{
                        mt: 1,
                        borderRadius: 999,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      {loading ? "Pricing..." : "Run American pricing"}
                    </Button>

                    {error && (
                      <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        {error}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </GridItem>

          <GridItem item xs={12} md={7}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                background: "radial-gradient(circle at top, #020617 0%, #020617 55%, #000 100%)",
                border: "1px solid rgba(148,163,184,0.4)",
                minHeight: 260,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Latest result
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Shows the last successful calculation from the backend.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!hasResult}
                  sx={{ borderRadius: 999, textTransform: "none" }}
                  onClick={handleOpenAssistant}
                >
                  View details
                </Button>
              </Box>

              <Divider sx={{ my: 2.5 }} />

              {!hasResult ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="body1" color="text.secondary">
                    Run a calculation to see American vs. European price, early exercise premium, and Greeks.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Box
                    sx={{
                      mb: 3,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        American price
                      </Typography>
                      <Typography variant="h3" fontWeight={700} sx={{ mt: 0.5 }}>
                        ${result.american_result.american_price.toFixed(2)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 0.5, display: "block" }}
                      >
                        {result.inputs.side} on {result.inputs.symbol} @ {result.inputs.K}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="caption" color="text.secondary">
                        As of
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontVariantNumeric: "tabular-nums", display: "block" }}
                      >
                        {result.inputs.as_of}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                        Exp: {result.inputs.expiry}
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={1.5}>
                    <GridItem item xs={6} sm={3}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          European price
                        </Typography>
                        <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                          {result.american_result.european_price.toFixed(4)}
                        </Typography>
                      </Paper>
                    </GridItem>
                    <GridItem item xs={6} sm={3}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Early exercise premium
                        </Typography>
                        <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                          {result.american_result.early_exercise_premium.toFixed(6)}
                        </Typography>
                      </Paper>
                    </GridItem>
                    <GridItem item xs={6} sm={3}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Critical price
                        </Typography>
                        <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                          {criticalDisplay}
                        </Typography>
                      </Paper>
                    </GridItem>
                    <GridItem item xs={6} sm={3}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Strike
                        </Typography>
                        <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                          {result.inputs.K.toFixed ? result.inputs.K.toFixed(2) : result.inputs.K}
                        </Typography>
                      </Paper>
                    </GridItem>
                  </Grid>

                  {result.greeks && (
                    <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
                      <GridItem item xs={6} sm={4}>
                        <Paper
                          variant="outlined"
                          sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Delta
                          </Typography>
                          <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                            {result.greeks.delta.toFixed(4)}
                          </Typography>
                        </Paper>
                      </GridItem>
                      <GridItem item xs={6} sm={4}>
                        <Paper
                          variant="outlined"
                          sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Gamma
                          </Typography>
                          <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                            {result.greeks.gamma.toFixed(6)}
                          </Typography>
                        </Paper>
                      </GridItem>
                      <GridItem item xs={6} sm={4}>
                        <Paper
                          variant="outlined"
                          sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Theta
                          </Typography>
                          <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                            {result.greeks.theta.toFixed(4)}
                          </Typography>
                        </Paper>
                      </GridItem>
                      <GridItem item xs={6} sm={6}>
                        <Paper
                          variant="outlined"
                          sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Vega
                          </Typography>
                          <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                            {result.greeks.vega.toFixed(4)}
                          </Typography>
                        </Paper>
                      </GridItem>
                      <GridItem item xs={6} sm={6}>
                        <Paper
                          variant="outlined"
                          sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Rho
                          </Typography>
                          <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                            {result.greeks.rho.toFixed(4)}
                          </Typography>
                        </Paper>
                      </GridItem>
                    </Grid>
                  )}

                  {assistantOpen && (
                    <Box
                      sx={{
                        mt: 3,
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid rgba(148,163,184,0.4)",
                        backgroundColor: "rgba(15,23,42,0.6)",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                        FinanceBud&apos;s explanation
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
                        {assistantMessages.length === 0 && !assistantLoading && !assistantError && (
                          <Typography variant="body2" color="text.secondary">
                            Click "View details" to ask FinanceBud about this American option run.
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
                          placeholder="Ask a question about this result..."
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
