// Greeks visualization page that consumes the last priced option and shows the sensitivities.
import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Divider,
  Stack,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

type Inputs = {
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

type Greeks = {
  fair_value: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
};

export default function GreeksVisualization() {
  const location = useLocation();
  const navigate = useNavigate();
  const [inputs, setInputs] = useState<Inputs | null>(null);
  const [greeks, setGreeks] = useState<Greeks | null>(null);

  useEffect(() => {
    const st = location.state as any;
    if (st && st.response && st.response.inputs && st.response.price_and_greeks) {
      setInputs(st.response.inputs);
      setGreeks(st.response.price_and_greeks);
      return;
    }

    const qs = new URLSearchParams(location.search);
    const symbol = qs.get("symbol");
    const side = qs.get("side") as "CALL" | "PUT" | null;
    const strike = qs.get("strike");
    const expiry = qs.get("expiry");
    const fair = qs.get("fair_value");
    const delta = qs.get("delta");
    const gamma = qs.get("gamma");
    const theta = qs.get("theta");
    const vega = qs.get("vega");
    const rho = qs.get("rho");

    if (symbol && side && strike && expiry && fair && delta && gamma && theta && vega && rho) {
      setInputs({
        symbol,
        side,
        S: 0,
        K: Number(strike),
        r: 0,
        q: 0,
        sigma: 0,
        T: 0,
        as_of: new Date().toISOString(),
        expiry,
      });
      setGreeks({
        fair_value: Number(fair),
        delta: Number(delta),
        gamma: Number(gamma),
        theta: Number(theta),
        vega: Number(vega),
        rho: Number(rho),
      });
    }
  }, [location]);

  return (
    <Box sx={{ minHeight: "calc(100vh - 120px)" }}>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Greeks breakdown
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Visual reference for the option you just priced.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate("/tools/euro")}
          sx={{ borderRadius: 999, textTransform: "none" }}
        >
          Back to calculator
        </Button>
      </Box>

      {!inputs || !greeks ? (
        <Paper
          variant="outlined"
          sx={{ p: 4, borderRadius: 3, textAlign: "center", backgroundColor: "rgba(2,6,23,0.3)" }}
        >
          <Typography variant="body1" color="text.secondary">
            No option data received. Run the European calculator first, then click “View Greeks chart.”
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper
              variant="outlined"
              sx={{ p: 3, borderRadius: 3, backgroundColor: "rgba(2,6,23,0.3)" }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Option
              </Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>
                {inputs.side} {inputs.symbol}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Strike {inputs.K} • Exp {new Date(inputs.expiry).toLocaleDateString()}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="caption" color="text.secondary">
                Fair value
              </Typography>
              <Typography variant="h4" sx={{ mt: 0.5 }}>
                ${greeks.fair_value.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                As of {new Date(inputs.as_of).toLocaleDateString()}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper
              variant="outlined"
              sx={{ p: 3, borderRadius: 3, backgroundColor: "rgba(2,6,23,0.15)" }}
            >
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Sensitivities
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <MetricCard title="Delta" value={greeks.delta.toFixed(4)} helper="Price change vs underlying" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <MetricCard title="Gamma" value={greeks.gamma.toFixed(6)} helper="Delta sensitivity" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <MetricCard title="Theta" value={greeks.theta.toFixed(4)} helper="Time decay (per year)" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <MetricCard title="Vega" value={greeks.vega.toFixed(4)} helper="Volatility sensitivity" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <MetricCard title="Rho" value={greeks.rho.toFixed(4)} helper="Rate sensitivity" />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />
              <Typography variant="caption" color="text.secondary">
                Change the inputs on the calculator to recompute and refresh this view.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

function MetricCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper?: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderRadius: 2, backgroundColor: "rgba(15,23,42,0.25)" }}
    >
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </Typography>
      {helper ? (
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      ) : null}
    </Paper>
  );
}
