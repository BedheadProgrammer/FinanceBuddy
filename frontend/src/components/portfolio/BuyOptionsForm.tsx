import React from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Stack,
  Alert,
} from "@mui/material";
import { colors, inputSx, toggleButtonSx } from "../../constants/theme";
import { SectionCard, GridItem } from "../common";
import type { OptionSide, OptionStyle, PortfolioSummaryPayload } from "../../types/portfolio";

type BuyOptionsFormProps = {
  symbol: string;
  setSymbol: (val: string) => void;
  side: OptionSide;
  setSide: (val: OptionSide) => void;
  style: OptionStyle;
  setStyle: (val: OptionStyle) => void;
  strike: string;
  setStrike: (val: string) => void;
  expiry: string;
  setExpiry: (val: string) => void;
  quantity: string;
  setQuantity: (val: string) => void;
  loading: boolean;
  error: string | null;
  success: string | null;
  onSubmit: (e: React.FormEvent, summary: PortfolioSummaryPayload | null) => void;
  summary: PortfolioSummaryPayload | null;
};

export const BuyOptionsForm: React.FC<BuyOptionsFormProps> = ({
  symbol,
  setSymbol,
  side,
  setSide,
  style,
  setStyle,
  strike,
  setStrike,
  expiry,
  setExpiry,
  quantity,
  setQuantity,
  loading,
  error,
  success,
  onSubmit,
  summary,
}) => {
  return (
    <SectionCard>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: colors.textPrimary,
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          component="span"
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: colors.accent,
          }}
        />
        Buy Options Contract
      </Typography>

      <Box component="form" onSubmit={(e) => onSubmit(e, summary)}>
        <Stack spacing={2.5}>
          <TextField
            label="Underlying Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            size="small"
            fullWidth
            sx={inputSx}
            placeholder="e.g. AAPL"
          />

          <Grid container spacing={2}>
            <GridItem item xs={6}>
              <ToggleButtonGroup
                color="primary"
                value={side}
                exclusive
                onChange={(_, val) => val && setSide(val)}
                size="small"
                fullWidth
                sx={toggleButtonSx}
              >
                <ToggleButton value="CALL" sx={toggleButtonSx}>
                  Call
                </ToggleButton>
                <ToggleButton value="PUT" sx={toggleButtonSx}>
                  Put
                </ToggleButton>
              </ToggleButtonGroup>
            </GridItem>
            <GridItem item xs={6}>
              <ToggleButtonGroup
                color="primary"
                value={style}
                exclusive
                onChange={(_, val) => val && setStyle(val)}
                size="small"
                fullWidth
                sx={toggleButtonSx}
              >
                <ToggleButton value="AMERICAN" sx={toggleButtonSx}>
                  American
                </ToggleButton>
                <ToggleButton value="EUROPEAN" sx={toggleButtonSx}>
                  European
                </ToggleButton>
              </ToggleButtonGroup>
            </GridItem>
          </Grid>

          <Grid container spacing={2}>
            <GridItem item xs={6}>
              <TextField
                label="Strike Price"
                value={strike}
                onChange={(e) => setStrike(e.target.value)}
                size="small"
                fullWidth
                type="number"
                inputProps={{ step: "0.01", min: "0" }}
                sx={inputSx}
                placeholder="0.00"
              />
            </GridItem>
            <GridItem item xs={6}>
              <TextField
                label="Expiry Date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                size="small"
                fullWidth
                type="date"
                InputLabelProps={{ shrink: true }}
                sx={inputSx}
              />
            </GridItem>
          </Grid>

          <TextField
            label="Number of Contracts"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            size="small"
            fullWidth
            type="number"
            inputProps={{ step: "1", min: "1" }}
            sx={inputSx}
          />

          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              backgroundColor: "rgba(59, 130, 246, 0.08)",
              border: `1px solid rgba(59, 130, 246, 0.15)`,
            }}
          >
            <Typography
              sx={{
                color: colors.textSecondary,
                fontSize: "0.75rem",
                lineHeight: 1.6,
              }}
            >
              Each contract controls 100 shares. Premium is calculated automatically
              using the option pricer.
            </Typography>
          </Box>

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            sx={{
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9375rem",
              backgroundColor: colors.accent,
              "&:hover": {
                backgroundColor: colors.accentHover,
              },
              "&:disabled": {
                backgroundColor: "rgba(59, 130, 246, 0.3)",
              },
            }}
          >
            {loading ? "Processing..." : "Buy Options"}
          </Button>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              {success}
            </Alert>
          )}
        </Stack>
      </Box>
    </SectionCard>
  );
};
