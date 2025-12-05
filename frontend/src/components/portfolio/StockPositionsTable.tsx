import React from "react";
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
} from "@mui/material";
import { colors, typography, inputSx } from "../../constants/theme";
import { MoneyDisplay, NumberDisplay,PnLDisplay, StyledTableCell } from "../common";
import type { PortfolioPosition } from "../../types/portfolio";

type StockPositionsTableProps = {
  positions: PortfolioPosition[];
  currency: string;
  sellSymbol: string | null;
  sellQuantity: number;
  setSellQuantity: (val: number) => void;
  sellLoading: boolean;
  onRowClick: (symbol: string, maxQty: number) => void;
  onClearSelection: () => void;
  onSell: (symbol: string, quantity: number) => void;
};

export const StockPositionsTable: React.FC<StockPositionsTableProps> = ({
  positions,
  currency,
  sellSymbol,
  sellQuantity,
  setSellQuantity,
  sellLoading,
  onRowClick,
  onClearSelection,
  onSell,
}) => {
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
          No open positions yet. Place a trade to get started.
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
        Click a row to sell shares
      </Typography>
      <Box
        sx={{
          borderRadius: 2,
          border: `1px solid ${colors.border}`,
          overflow: "hidden",
        }}
      >
        <Box sx={{ maxHeight: 380, overflowY: "auto" }}>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: colors.tableBg }}>
                <StyledTableCell isHeader>Symbol</StyledTableCell>
                <StyledTableCell isHeader align="right">
                  Qty
                </StyledTableCell>
                <StyledTableCell isHeader align="right">
                  Avg Cost
                </StyledTableCell>
                <StyledTableCell isHeader align="right">
                  Price
                </StyledTableCell>
                <StyledTableCell isHeader align="right">
                  Value
                </StyledTableCell>
                <StyledTableCell isHeader align="right">
                  P/L
                </StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {positions.map((pos) => {
                const isSelected = sellSymbol === pos.symbol;
                const maxQty = Math.floor(pos.quantity);
                return (
                  <React.Fragment key={pos.symbol}>
                    <TableRow
                      onClick={() => {
                        if (isSelected) {
                          onClearSelection();
                        } else {
                          onRowClick(pos.symbol, maxQty);
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
                          {pos.symbol}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="right" isNumber>
                        <NumberDisplay value={pos.quantity} decimals={2} />
                      </StyledTableCell>
                      <StyledTableCell align="right" isNumber>
                        <MoneyDisplay value={pos.avg_cost} currency={currency} />
                      </StyledTableCell>
                      <StyledTableCell align="right" isNumber>
                        {pos.error ? (
                          <Typography
                            sx={{
                              color: colors.textMuted,
                              fontSize: "0.875rem",
                            }}
                          >
                            N/A
                          </Typography>
                        ) : (
                          <MoneyDisplay value={pos.market_price} currency={currency} />
                        )}
                      </StyledTableCell>
                      <StyledTableCell align="right" isNumber>
                        <MoneyDisplay value={pos.market_value} currency={currency} />
                      </StyledTableCell>
                      <StyledTableCell align="right" isNumber>
                        <PnLDisplay value={pos.unrealized_pnl} currency={currency} />
                      </StyledTableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        colSpan={6}
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
                              Sell {pos.symbol}
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
                                  Shares to sell:{" "}
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
                                  onChange={(_, val) => setSellQuantity(val as number)}
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
                                onClick={() => onSell(pos.symbol, sellQuantity)}
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
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </>
  );
};
