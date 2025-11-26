// FinanceSt/frontend/src/pages/AmericanOptionsPricing.tsx
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

type Inputs = {
  S: number; K: number; r: number; q: number; sigma: number; T: number;
  d1: number; d2: number; side: "CALL"|"PUT"; symbol: string; as_of: string; expiry: string;
};
type AmericanResult = {
  american_price: number; european_price: number; early_exercise_premium: number; critical_price: number;
};
type AmericanApiResponse = { inputs: Inputs; american_result: AmericanResult } | { error: string };

export default function AmericanOptionsPricing() {
  usePageMeta("American Option Calculator | FinanceBuddy", "American option calculator");

  const todayISO = useMemo(() => new Date().toISOString().slice(0,10), []);
  const [symbol, setSymbol] = useState("AAPL");
  const [side, setSide] = useState<"CALL"|"PUT">("CALL");
  const [strike, setStrike] = useState("200");
  const [expiry, setExpiry] = useState("2026-01-17");
  const [volMode, setVolMode] = useState<"HIST"|"IV">("HIST");
  const [marketOptionPrice, setMarketOptionPrice] = useState("");
  const [constantVol, setConstantVol] = useState("");
  const [useQL, setUseQL] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [data, setData] = useState<AmericanApiResponse|null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setData(null); setLoading(true);

    const params = new URLSearchParams({
      symbol: symbol.trim().toUpperCase(), side, strike: strike.trim(), expiry, vol_mode: volMode
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
        setError((json as any).error || `HTTP ${res.status}`);
        setData(null);
      } else {
        setData(json as AmericanApiResponse);
      }
    } catch (err: any) {
      setError(err?.message || String(err));
      setData(null);
    } finally {
      setLoading(false);
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
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>
            American Option Calculator
          </Typography>
        </Box>

        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} md={5}>
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
                    InputLabelProps={{ shrink: true }}
                  />
                  <Box>
                    <Typography variant="caption" sx={{ mb: 1, display: "block" }}>
                      Side
                    </Typography>
                    <ToggleButtonGroup
                      value={side}
                      exclusive
                      onChange={(_, v) => v && setSide(v)}
                      size="small"
                      fullWidth
                    >
                      <ToggleButton value="CALL">CALL</ToggleButton>
                      <ToggleButton value="PUT">PUT</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <TextField
                        label="Strike"
                        value={strike}
                        onChange={(e) => setStrike(e.target.value)}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Expiration"
                        type="date"
                        value={expiry}
                        inputProps={{ min: todayISO }}
                        onChange={(e) => setExpiry(e.target.value)}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                  <TextField
                    select
                    label="Volatility source"
                    value={volMode}
                    onChange={(e) => setVolMode(e.target.value as "HIST" | "IV")}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="HIST">Historical volatility</MenuItem>
                    <MenuItem value="IV">Implied volatility (needs market price)</MenuItem>
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
                    placeholder="e.g. 0.25"
                    InputLabelProps={{ shrink: true }}
                  />
                  <FormControlLabel
                    control={<Switch checked={useQL} onChange={(e) => setUseQL(e.target.checked)} />}
                    label="Use QuantLib day count"
                  />
                  {error && (
                    <Typography
                      variant="body2"
                      sx={{
                        bgcolor: "rgba(248, 113, 113, 0.1)",
                        border: "1px solid rgba(248, 113, 113, 0.4)",
                        borderRadius: 2,
                        p: 1.2,
                        color: "#fecaca",
                      }}
                    >
                      {error}
                    </Typography>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      py: 1.5,
                      fontWeight: 600,
                    }}
                    fullWidth
                  >
                    {loading ? "Calculating…" : "Calculate price"}
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={7}>
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
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!data || !(data as any).american_result}
                  sx={{ borderRadius: 999, textTransform: "none" }}
                >
                  View details
                </Button>
              </Box>

              <Divider sx={{ my: 2.5 }} />

              {!data || !(data as any).american_result ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="body1" color="text.secondary">
                    Run a calculation to see American vs. European price and premium.
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
                        ${(data as any).american_result.american_price.toFixed(2)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 0.5, display: "block" }}
                      >
                        {(data as any).inputs.side} on {(data as any).inputs.symbol} @ {(data as any).inputs.K}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="caption" color="text.secondary">
                        As of
                      </Typography>
                      <Typography variant="body2">
                        {new Date((data as any).inputs.as_of).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Exp: {new Date((data as any).inputs.expiry).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={1.5}>
                    <Grid item xs={6} sm={3}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          European price
                        </Typography>
                        <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                          {(data as any).american_result.european_price.toFixed(4)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Early exercise premium
                        </Typography>
                        <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                          {(data as any).american_result.early_exercise_premium.toFixed(6)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Critical price
                        </Typography>
                        <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                          {(data as any).american_result.critical_price.toFixed(6)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Strike
                        </Typography>
                        <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                          {(data as any).inputs.K.toFixed ? (data as any).inputs.K.toFixed(2) : (data as any).inputs.K}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
