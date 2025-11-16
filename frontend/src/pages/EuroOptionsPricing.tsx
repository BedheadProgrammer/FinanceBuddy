// European option calculator page with a professional two-panel layout.
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
  Chip,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";

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

export default function EuroOptionsPricing() {
  const navigate = useNavigate();

  usePageMeta(
    "European Option Calculator | FinanceBuddy",
    "Price European call and put options against your Django backend and view Greeks instantly with FinanceBuddy."
  );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

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

  return (
    <Box sx={{ minHeight: "calc(100vh - 120px)" }}>
      <Box
        sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <Box>
          <Typography variant="h4" fontWeight={600}>
            European Option Calculator
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Price a European option against your Django backend and view Greeks instantly.
          </Typography>
        </Box>
        <Chip label="Live pricing" color="primary" variant="outlined" />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.05)",
              background: "linear-gradient(160deg, #0f172a 0%, #020617 50%, #0f172a 100%)",
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Option setup
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <Box>
                  <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
                    Side
                  </Typography>
                  <ToggleButtonGroup
                    value={side}
                    exclusive
                    onChange={(_, v) => v && setSide(v)}
                    size="small"
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
                  placeholder="e.g. 0.22"
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
                  size="medium"
                  disabled={loading}
                  sx={{ borderRadius: 2, textTransform: "none" }}
                  fullWidth
                >
                  {loading ? "Calculating…" : "Calculate price & greeks"}
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.03)",
              backgroundColor: "rgba(2,6,23,0.3)",
            }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <Box>
                <Typography variant="subtitle1">Latest result</Typography>
                <Typography variant="caption" color="text.secondary">
                  Shows the last successful calculation from the backend.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={handleViewChart}
                disabled={!data}
                sx={{ borderRadius: 999, textTransform: "none" }}
              >
                View Greeks chart
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            {!data ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
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
                    <Typography variant="h3" fontWeight={600} sx={{ mt: 0.5 }}>
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
                    <Typography variant="body2">
                      {new Date(data.inputs.as_of).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Exp: {new Date(data.inputs.expiry).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={1.5}>
                  <Grid item xs={6} sm={4}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Delta
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {data.price_and_greeks.delta.toFixed(4)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Gamma
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {data.price_and_greeks.gamma.toFixed(6)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Theta
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {data.price_and_greeks.theta.toFixed(4)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Vega
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {data.price_and_greeks.vega.toFixed(4)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 1.5, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.3)" }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Rho
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {data.price_and_greeks.rho.toFixed(4)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
