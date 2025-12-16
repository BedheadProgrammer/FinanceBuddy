import React from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
} from "@mui/material";
import { colors, inputSx } from "../../constants/theme";
import { SectionCard, GridItem } from "../common";

type BuyStockFormProps = {
  symbol: string;
  setSymbol: (val: string) => void;
  quantity: string;
  setQuantity: (val: string) => void;
  price: string;
  setPrice: (val: string) => void;
  useMarketPrice: boolean;
  setUseMarketPrice: (val: boolean) => void;
  loading: boolean;
  error: string | null;
  success: string | null;
  onSubmit: (e: React.FormEvent) => void;
  embedded?: boolean;
};

export const BuyStockForm: React.FC<BuyStockFormProps> = ({
  symbol,
  setSymbol,
  quantity,
  setQuantity,
  price,
  setPrice,
  useMarketPrice,
  setUseMarketPrice,
  loading,
  error,
  success,
  onSubmit,
  embedded = false,
}) => {
  const content = (
    <>
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
            backgroundColor: colors.positive,
          }}
        />
        Buy Stock
      </Typography>

      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2.5}>
          <TextField
            label="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            size="small"
            fullWidth
            sx={inputSx}
            placeholder="e.g. AAPL"
          />

          <Grid container spacing={2}>
            <GridItem item xs={6}>
              <TextField
                label="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                size="small"
                fullWidth
                type="number"
                inputProps={{ step: "1", min: "1" }}
                sx={inputSx}
              />
            </GridItem>
            <GridItem item xs={6}>
              <TextField
                label={useMarketPrice ? "Price (Market)" : "Limit Price"}
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  if (e.target.value.trim()) {
                    setUseMarketPrice(false);
                  } else {
                    setUseMarketPrice(true);
                  }
                }}
                size="small"
                fullWidth
                type="number"
                placeholder={useMarketPrice ? "Auto" : "0.00"}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: "0.01", min: "0" }}
                sx={inputSx}
              />
            </GridItem>
          </Grid>

          <Typography
            sx={{
              color: colors.textMuted,
              fontSize: "0.75rem",
            }}
          >
            Leave price blank to use live market data
          </Typography>

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            sx={{
              mt: 1,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9375rem",
              backgroundColor: colors.positive,
              "&:hover": {
                backgroundColor: "#16a34a",
              },
              "&:disabled": {
                backgroundColor: "rgba(34, 197, 94, 0.3)",
              },
            }}
          >
            {loading ? "Processing..." : "Buy Stock"}
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
    </>
  );

  if (embedded) {
    return <Box>{content}</Box>;
  }

  return <SectionCard>{content}</SectionCard>;
};