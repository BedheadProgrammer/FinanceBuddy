import React, { useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";

const GridItem = (props: any) => <Grid {...props} />;

type EuroApiResponse = {
  inputs: {
    symbol: string;
    side: "CALL" | "PUT";
    S: number;
    K: number;
    r: number;
    q: number;
    sigma: number;
    T: number;
    as_of: string;
    expiry: string;
  };
  price_and_greeks: {
    fair_value: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  };
  error?: string;
};

type AssistantMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export default function EuroOptionsPricing() {
  const navigate = useNavigate();

  usePageMeta("European Option Calculator | FinanceBuddy", "European Option Calculator");

  const [symbol, setSymbol] = useState("AAPL");
  const [side, setSide] = useState<"CALL" | "PUT">("CALL");
  const [strike, setStrike] = useState("200");
  const [expiry, setExpiry] = useState("2026-01-17");
  const [volMode, setVolMode] = useState<"HIST" | "IV">("HIST");
  const [marketOptionPrice, setMarketOptionPrice] = useState("");
  const [constantVol, setConstantVol] = useState("");
  const [useQL, setUseQL] = useState(false);
  const [data, setData] = useState<EuroApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setData(null);
    setAssistantOpen(false);
    setAssistantMessages([]);
    setAssistantError(null);

    const params = new URLSearchParams({
      symbol: symbol.trim().toUpperCase(),
      side,
      strike: strike.trim(),
      expiry,
      vol_mode: volMode,
    });

    if (volMode === "IV" && marketOptionPrice.trim()) {
      params.set("market_option_price", marketOptionPrice.trim());
    }
    if (constantVol.trim()) {
      params.set("constant_vol", constantVol.trim());
    }
    if (useQL) {
      params.set("use_quantlib_daycount", "true");
    }

    const res = await fetch(`/api/euro/price/?${params.toString()}`, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });

    const json = (await res.json()) as EuroApiResponse;
    setLoading(false);

    if (!res.ok || json.error) {
      setError(json.error || "Request failed.");
      setData(null);
      return;
    }

    setData(json);
  };

  const handleViewChart = () => {
    if (!data) return;
    navigate("/tools/euro/greeks", {
      state: { response: data },
    });
  };

  function buildAssistantSnapshot():
    | { inputs: EuroApiResponse["inputs"]; price_and_greeks: EuroApiResponse["price_and_greeks"] }
    | null {
    if (!data || !data.inputs || !data.price_and_greeks) return null;
    return {
      inputs: data.inputs,
      price_and_greeks: data.price_and_greeks,
    };
  }

  async function handleOpenAssistant() {
    const snapshot = buildAssistantSnapshot();
    if (!snapshot) return;

    setAssistantOpen(true);
    setAssistantError(null);

    if (assistantMessages.length > 0) return;

    setAssistantLoading(true);
    try {
      const resp = await fetch("/api/assistant/euro/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          snapshot,
          message:
            "Explain this European option's fair value and Greeks in simple terms, focusing on what each sensitivity means for the trader.",
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
      const resp = await fetch("/api/assistant/euro/", {
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

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 120px)",
        display: "flex",
        alignItems: "center",
        py: 4,
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          transform: "scale(0.8)",
          transformOrigin: "top center",
        }}
      >
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography variant="h4" fontWeight={700}>
            European Option Calculator
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Price a European call or put and view fair value plus Greeks.
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
                Option setup
              </Typography>
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <TextField
                    label="Symbol"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    size="small"
                    fullWidth
                  />
                  <ToggleButtonGroup
                    color="primary"
                    value={side}
                    exclusive
                    onChange={(_, val) => val && setSide(val)}
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
                      />
                    </GridItem>
                  </Grid>

                  <TextField
                    select
                    label="Volatility source"
                    value={volMode}
                    onChange={(e) => setVolMode(e.target.value as "HIST" | "IV")}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="HIST">Use historical volatility</MenuItem>
                    <MenuItem value="IV">Match market option price (IV)</MenuItem>
                  </TextField>

                  {volMode === "IV" && (
                    <TextField
                      label="Market option price"
                      value={marketOptionPrice}
                      onChange={(e) => setMarketOptionPrice(e.target.value)}
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  )}

                  <TextField
                    label="Constant σ override (optional)"
                    value={constantVol}
                    onChange={(e) => setConstantVol(e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="e.g. 0.22"
                  />

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
                    disabled={loading}
                    sx={{
                      mt: 1,
                      borderRadius: 999,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                    fullWidth
                  >
                    {loading ? "Calculating…" : "Calculate price & Greeks"}
                  </Button>

                  {error && (
                    <Typography variant="body2" color="error">
                      {error}
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
                    Latest result
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Shows the last successful calculation from the backend.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleViewChart}
                    disabled={!data}
                    sx={{ borderRadius: 999, textTransform: "none" }}
                  >
                    View Greeks chart
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleOpenAssistant}
                    disabled={!data}
                    sx={{ borderRadius: 999, textTransform: "none" }}
                  >
                    Ask FinanceBud
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ my: 2.5 }} />

              {!data ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="body1" color="text.secondary">
                    Run a calculation to see price and Greeks.
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
                        Fair value
                      </Typography>
                      <Typography variant="h3" fontWeight={700} sx={{ mt: 0.5 }}>
                        ${data.price_and_greeks.fair_value.toFixed(2)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 0.5, display: "block" }}
                      >
                        {data.inputs.side} on {data.inputs.symbol} @ {data.inputs.K}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="caption" color="text.secondary">
                        As of
                      </Typography>
                      <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
                        {new Date(data.inputs.as_of).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        Exp: {new Date(data.inputs.expiry).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={1.5}>
                    <GridItem item xs={6} sm={4}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Delta
                        </Typography>
                        <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                          {data.price_and_greeks.delta.toFixed(4)}
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
                          {data.price_and_greeks.gamma.toFixed(6)}
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
                          {data.price_and_greeks.theta.toFixed(4)}
                        </Typography>
                      </Paper>
                    </GridItem>
                    <GridItem item xs={6} sm={4}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Vega
                        </Typography>
                        <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                          {data.price_and_greeks.vega.toFixed(4)}
                        </Typography>
                      </Paper>
                    </GridItem>
                    <GridItem item xs={6} sm={4}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Rho
                        </Typography>
                        <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                          {data.price_and_greeks.rho.toFixed(4)}
                        </Typography>
                      </Paper>
                    </GridItem>
                  </Grid>

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
                        {assistantMessages.length === 0 &&
                          !assistantLoading &&
                          !assistantError && (
                            <Typography variant="body2" color="text.secondary">
                              Click &quot;Ask FinanceBud&quot; to get an explanation of this run.
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
                          placeholder="Ask a question about this fair value or Greeks..."
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
