import React from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { colors } from "../../constants/theme";
import { SectionCard } from "../common";
import type { CryptoAsset } from "../../types/portfolio";

type BuyCryptoFormProps = {
  assets: CryptoAsset[];
  assetsLoading: boolean;
  assetsError: string | null;
  symbol: string;
  setSymbol: (val: string) => void;
  quantity: string;
  setQuantity: (val: string) => void;
  loading: boolean;
  error: string | null;
  success: string | null;
  onSubmit: (e: React.FormEvent) => void;
  embedded?: boolean;
};

export const BuyCryptoForm: React.FC<BuyCryptoFormProps> = ({
  assets,
  assetsLoading,
  assetsError,
  symbol,
  setSymbol,
  quantity,
  setQuantity,
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
          mb: 0.5,
        }}
      >
        Buy Crypto
      </Typography>
      <Typography
        sx={{
          color: colors.textMuted,
          fontSize: "0.8125rem",
          mb: 3,
        }}
      >
        Purchase cryptocurrency with a market order
      </Typography>

      {assetsError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {assetsError}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      <Box component="form" onSubmit={onSubmit}>
        <TextField
          select
          label="Crypto Pair"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          fullWidth
          size="small"
          sx={{ mb: 2 }}
          disabled={assetsLoading || loading}
        >
          {assetsLoading ? (
            <MenuItem value={symbol} disabled>
              Loading...
            </MenuItem>
          ) : assets.length === 0 ? (
            <MenuItem value="" disabled>
              No tradable pairs
            </MenuItem>
          ) : (
            assets.map((asset) => (
              <MenuItem key={asset.symbol} value={asset.symbol}>
                {asset.symbol} — {asset.name}
              </MenuItem>
            ))
          )}
        </TextField>

        <TextField
          label="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          fullWidth
          size="small"
          type="text"
          inputMode="decimal"
          placeholder="0.001"
          sx={{ mb: 3 }}
          disabled={loading}
          helperText="Fractional quantities allowed"
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading || assetsLoading || !symbol}
          sx={{
            py: 1.5,
            fontWeight: 600,
            textTransform: "none",
            borderRadius: 2,
            backgroundColor: "#f59e0b",
            "&:hover": {
              backgroundColor: "#d97706",
            },
          }}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: "inherit" }} />
          ) : (
            "Buy Crypto"
          )}
        </Button>
      </Box>
    </>
  );

  if (embedded) {
    return <Box>{content}</Box>;
  }

  return <SectionCard>{content}</SectionCard>;
};