import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Collapse,
  Slider,
  TextField,
  Button,
  Chip,
  Alert,
} from "@mui/material";
import { colors, typography, inputSx } from "../../constants/theme";
import { MoneyDisplay, NumberDisplay, StyledTableCell } from "../common";
import type { OptionPosition } from "../../types/portfolio";

type OptionsPositionsTableProps = {
  positions: OptionPosition[];
  currency: string;
  loading: boolean;
  error: string | null;
  sellOptionId: number | null;
  sellQuantity: number;
  setSellQuantity: (val: number) => void;
  sellLoading: boolean;
  exerciseLoadingId: number | null;
  onRowClick: (id: number, maxQty: number) => void;
  onClearSelection: () => void;
  onSell: (pos: OptionPosition, quantity: number) => void;
  onExercise: (pos: OptionPosition) => void;
};

export const OptionsPositionsTable: React.FC<OptionsPositionsTableProps> = ({
  positions,
  currency,
  loading,
  error,
  sellOptionId,
  sellQuantity,
  setSellQuantity,
  sellLoading,
  exerciseLoadingId,
  onRowClick,
  onClearSelection,
  onSell,
  onExercise,
}) => {
  if (loading) {
    return (
      <Typography sx={{ color: colors.textSecondary, fontSize: "0.875rem" }}>
        Loading options...
      </Typography>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (positions.length === 0) {
    return (
      <Box
        sx={{
          py: 4,
          px: 3,
          textAlign: "center",
          borderRadius: 2,
          border: `1px dashed ${colors.border}`,
          backgroundColor: "rgba(15, 23, 42, 0.3)",
        }}
      >
        <Typography sx={{ color: colors.textMuted, fontSize: "0.875rem" }}>
          No options positions yet. Buy an options contract to get started.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Typography
        sx={{
          color: colors.textMuted,
          fontSize: "0.75rem",
          mb: 1.5,
        }}
      >
        Click a row to sell contracts
      </Typography>
      <Box
        sx={{
          borderRadius: 2,
          border: `1px solid ${colors.border}`,
          overflow: "hidden",
        }}
      >
        <Box sx={{ maxHeight: 320, overflowY: "auto" }}>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: colors.tableBg }}>
                <StyledTableCell isHeader>Contract</StyledTableCell>
                <StyledTableCell isHeader align="center">
                  Type
                </StyledTableCell>
                <StyledTableCell isHeader align="right">
                  Strike
                </StyledTableCell>
                <StyledTableCell isHeader align="right">
                  Expiry
                </StyledTableCell>
                <StyledTableCell isHeader align="right">
                  Qty
                </StyledTableCell>
                <StyledTableCell isHeader align="right">
                  Cost
                </StyledTableCell>
                <StyledTableCell isHeader align="right">
                  Value
                </StyledTableCell>
                <StyledTableCell isHeader align="center">
                  Action
                </StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {positions.map((pos) => {
                const isSelected = sellOptionId === pos.id;
                const maxQty = Math.floor(pos.quantity);

                return [
                  <TableRow
                    key={`${pos.id}-main`}
                    onClick={() => {
                      if (isSelected) {
                        onClearSelection();
                      } else {
                        onRowClick(pos.id, maxQty);
                      }
                    }}
                    sx={{
                      cursor: "pointer",
                      backgroundColor: isSelected
                        ? colors.negativeBg
                        : "transparent",
                      "&:hover": {
                        backgroundColor: isSelected
                          ? colors.negativeBg
                          : colors.tableRowHover,
                      },
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <StyledTableCell>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: colors.textPrimary,
                          fontFamily: typography.mono,
                          fontSize: "0.9375rem",
                        }}
                      >
                        {pos.underlying_symbol}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.75,
                          justifyContent: "center",
                        }}
                      >
                        <Chip
                          label={pos.option_side}
                          size="small"
                          sx={{
                            backgroundColor:
                              pos.option_side === "CALL"
                                ? colors.positiveBg
                                : colors.negativeBg,
                            color:
                              pos.option_side === "CALL"
                                ? colors.positive
                                : colors.negative,
                            fontWeight: 600,
                            fontSize: "0.6875rem",
                            height: 22,
                          }}
                        />
                        <Chip
                          label={pos.option_style === "AMERICAN" ? "US" : "EU"}
                          size="small"
                          sx={{
                            backgroundColor: "rgba(148, 163, 184, 0.15)",
                            color: colors.textSecondary,
                            fontWeight: 500,
                            fontSize: "0.6875rem",
                            height: 22,
                          }}
                        />
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell align="right" isNumber>
                      <MoneyDisplay
                        value={pos.strike}
                        currency={currency}
                        size="small"
                      />
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <Typography
                        sx={{
                          fontFamily: typography.mono,
                          fontSize: "0.8125rem",
                          color: colors.textPrimary,
                        }}
                      >
                        {pos.expiry}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="right" isNumber>
                      <NumberDisplay
                        value={pos.quantity}
                        decimals={0}
                        size="small"
                      />
                    </StyledTableCell>
                    <StyledTableCell align="right" isNumber>
                      <MoneyDisplay
                        value={pos.avg_cost}
                        currency={currency}
                        size="small"
                      />
                    </StyledTableCell>
                    <StyledTableCell align="right" isNumber>
                      <MoneyDisplay
                        value={pos.avg_cost * pos.quantity * pos.multiplier}
                        currency={currency}
                        size="small"
                      />
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          onExercise(pos);
                        }}
                        disabled={exerciseLoadingId === pos.id || pos.quantity <= 0}
                        sx={{
                          textTransform: "none",
                          borderRadius: 1.5,
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          borderColor: colors.border,
                          color: colors.textSecondary,
                          px: 1.5,
                          py: 0.5,
                          "&:hover": {
                            borderColor: colors.accent,
                            color: colors.accent,
                            backgroundColor: "rgba(59, 130, 246, 0.08)",
                          },
                        }}
                      >
                        {exerciseLoadingId === pos.id ? "..." : "Exercise"}
                      </Button>
                    </StyledTableCell>
                  </TableRow>,
                  <TableRow key={`${pos.id}-detail`}>
                    <TableCell
                      colSpan={8}
                      sx={{
                        p: 0,
                        borderBottom: isSelected
                          ? `1px solid ${colors.border}`
                          : "none",
                      }}
                    >
                      <Collapse in={isSelected} timeout="auto" unmountOnExit>
                        <Box
                          sx={{
                            p: 3,
                            backgroundColor: "rgba(239, 68, 68, 0.05)",
                            borderTop: `1px solid ${colors.negativeBg}`,
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: colors.textPrimary,
                              mb: 2,
                              fontSize: "0.9375rem",
                            }}
                          >
                            Sell {pos.underlying_symbol} {pos.option_side} $
                            {pos.strike.toFixed(2)} {pos.expiry}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              flexWrap: "wrap",
                            }}
                          >
                            <Box sx={{ flex: 1, minWidth: 180 }}>
                              <Typography
                                sx={{
                                  color: colors.textSecondary,
                                  fontSize: "0.75rem",
                                  mb: 1,
                                }}
                              >
                                Contracts to sell:{" "}
                                <Box
                                  component="span"
                                  sx={{
                                    fontFamily: typography.mono,
                                    color: colors.textPrimary,
                                    fontWeight: 600,
                                  }}
                                >
                                  {sellQuantity}
                                </Box>
                              </Typography>
                              <Slider
                                value={sellQuantity}
                                onChange={(_, val) =>
                                  setSellQuantity(val as number)
                                }
                                min={1}
                                max={maxQty}
                                step={1}
                                marks={[
                                  { value: 1, label: "1" },
                                  { value: maxQty, label: String(maxQty) },
                                ]}
                                sx={{
                                  color: colors.negative,
                                  "& .MuiSlider-thumb": {
                                    backgroundColor: colors.negative,
                                  },
                                  "& .MuiSlider-track": {
                                    backgroundColor: colors.negative,
                                  },
                                  "& .MuiSlider-rail": {
                                    backgroundColor: "rgba(239, 68, 68, 0.2)",
                                  },
                                  "& .MuiSlider-markLabel": {
                                    color: colors.textMuted,
                                    fontSize: "0.6875rem",
                                  },
                                }}
                              />
                            </Box>
                            <TextField
                              size="small"
                              type="number"
                              value={sellQuantity}
                              onChange={(e) => {
                                const val = Math.min(
                                  Math.max(1, Number(e.target.value)),
                                  maxQty
                                );
                                setSellQuantity(val);
                              }}
                              inputProps={{
                                min: 1,
                                max: maxQty,
                                step: 1,
                              }}
                              sx={{ ...inputSx, width: 90 }}
                            />
                            <Button
                              variant="contained"
                              size="medium"
                              disabled={sellLoading || sellQuantity <= 0}
                              onClick={() => onSell(pos, sellQuantity)}
                              sx={{
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 600,
                                px: 4,
                                py: 1,
                                backgroundColor: colors.negative,
                                "&:hover": {
                                  backgroundColor: "#dc2626",
                                },
                              }}
                            >
                              {sellLoading ? "Selling..." : "Sell"}
                            </Button>
                          </Box>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>,
                ];
              })}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </>
  );
};
