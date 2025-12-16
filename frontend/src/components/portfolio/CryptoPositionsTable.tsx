import React from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableContainer,
  Button,
  Slider,
  TextField,
  Alert,
  CircularProgress,
} from "@mui/material";
import { colors } from "../../constants/theme";
import { StyledTableCell, MoneyDisplay, NumberDisplay, PnLDisplay } from "../common";
import type { CryptoPosition } from "../../types/portfolio";

type CryptoPositionsTableProps = {
  positions: CryptoPosition[];
  currency: string;
  loading: boolean;
  error: string | null;
  sellSymbol: string | null;
  sellQuantity: number;
  setSellQuantity: (val: number) => void;
  maxQuantity: number;
  sellLoading: boolean;
  sellError: string | null;
  sellSuccess: string | null;
  onRowClick: (symbol: string, maxQty: number) => void;
  onClearSelection: () => void;
  onSell: (symbol: string, quantity: number) => void;
};

export const CryptoPositionsTable: React.FC<CryptoPositionsTableProps> = ({
  positions,
  currency,
  loading,
  error,
  sellSymbol,
  sellQuantity,
  setSellQuantity,
  maxQuantity,
  sellLoading,
  sellError,
  sellSuccess,
  onRowClick,
  onClearSelection,
  onSell,
}) => {
  if (loading) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress size={24} />
        <Typography sx={{ mt: 1, color: colors.textSecondary, fontSize: "0.875rem" }}>
          Loading crypto positions...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {error}
      </Alert>
    );
  }

  if (positions.length === 0) {
    return (
      <Box
        sx={{
          py: 4,
          textAlign: "center",
          backgroundColor: "rgba(15, 23, 42, 0.3)",
          borderRadius: 2,
          border: `1px dashed ${colors.border}`,
        }}
      >
        <Typography sx={{ color: colors.textMuted, fontSize: "0.875rem" }}>
          No crypto positions yet
        </Typography>
      </Box>
    );
  }

  const selectedPosition = sellSymbol
    ? positions.find((p) => p.symbol === sellSymbol)
    : null;

  return (
    <Box>
      {sellError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {sellError}
        </Alert>
      )}

      {sellSuccess && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          {sellSuccess}
        </Alert>
      )}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <StyledTableCell isHeader>Pair</StyledTableCell>
              <StyledTableCell isHeader align="right">Quantity</StyledTableCell>
              <StyledTableCell isHeader align="right">Avg Cost</StyledTableCell>
              <StyledTableCell isHeader align="right">Price</StyledTableCell>
              <StyledTableCell isHeader align="right">Value</StyledTableCell>
              <StyledTableCell isHeader align="right">P/L</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {positions.map((pos) => {
              const isSelected = sellSymbol === pos.symbol;
              return (
                <TableRow
                  key={pos.symbol}
                  onClick={() => onRowClick(pos.symbol, pos.quantity)}
                  sx={{
                    cursor: "pointer",
                    backgroundColor: isSelected
                      ? "rgba(59, 130, 246, 0.1)"
                      : "transparent",
                    "&:hover": {
                      backgroundColor: isSelected
                        ? "rgba(59, 130, 246, 0.15)"
                        : "rgba(255, 255, 255, 0.02)",
                    },
                  }}
                >
                  <StyledTableCell>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: colors.textPrimary,
                        fontSize: "0.875rem",
                      }}
                    >
                      {pos.symbol}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell align="right" isNumber>
                    <NumberDisplay value={pos.quantity} decimals={6} />
                  </StyledTableCell>
                  <StyledTableCell align="right" isNumber>
                    <MoneyDisplay value={pos.avg_cost} currency={currency} />
                  </StyledTableCell>
                  <StyledTableCell align="right" isNumber>
                    <MoneyDisplay value={pos.market_price} currency={currency} />
                  </StyledTableCell>
                  <StyledTableCell align="right" isNumber>
                    <MoneyDisplay value={pos.market_value} currency={currency} />
                  </StyledTableCell>
                  <StyledTableCell align="right" isNumber>
                    <PnLDisplay value={pos.unrealized_pnl} currency={currency} />
                  </StyledTableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedPosition && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            backgroundColor: "rgba(59, 130, 246, 0.08)",
            border: `1px solid rgba(59, 130, 246, 0.2)`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
                color: colors.textPrimary,
                fontSize: "0.9rem",
              }}
            >
              Sell {selectedPosition.symbol}
            </Typography>
            <Button
              size="small"
              onClick={onClearSelection}
              sx={{
                textTransform: "none",
                color: colors.textSecondary,
                "&:hover": { color: colors.textPrimary },
              }}
            >
              Cancel
            </Button>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: colors.textSecondary,
                mb: 1,
              }}
            >
              Quantity to sell (max: {maxQuantity.toFixed(6)})
            </Typography>
            <Slider
              value={sellQuantity}
              onChange={(_, val) => setSellQuantity(val as number)}
              min={0}
              max={maxQuantity}
              step={maxQuantity / 1000}
              disabled={sellLoading}
              sx={{ mb: 1 }}
            />
            <TextField
              value={sellQuantity}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (Number.isFinite(val) && val >= 0 && val <= maxQuantity) {
                  setSellQuantity(val);
                }
              }}
              type="number"
              size="small"
              inputProps={{ step: "any", min: 0, max: maxQuantity }}
              sx={{ width: 150 }}
              disabled={sellLoading}
            />
          </Box>

          <Button
            variant="contained"
            onClick={() => onSell(selectedPosition.symbol, sellQuantity)}
            disabled={sellLoading || sellQuantity <= 0}
            sx={{
              py: 1,
              px: 3,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
              backgroundColor: colors.negative,
              "&:hover": {
                backgroundColor: "#dc2626",
              },
            }}
          >
            {sellLoading ? (
              <CircularProgress size={18} sx={{ color: "inherit" }} />
            ) : (
              `Sell ${sellQuantity.toFixed(6)} ${selectedPosition.symbol}`
            )}
          </Button>
        </Box>
      )}
    </Box>
  );
};