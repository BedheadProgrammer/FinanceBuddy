import React from "react";
import {
  Box,
  Grid,
  Typography,
  Divider,
  Button,
  Alert,
  Chip,
} from "@mui/material";
import { colors } from "../../constants/theme";
import { SectionCard, StatCard, GridItem } from "../common";
import { StockPositionsTable } from "./StockPositionsTable";
import { OptionsPositionsTable } from "./OptionsPositionsTable";
import { PortfolioAssistant } from "./PortfolioAssistant";
import type {
  PortfolioSummaryPayload,
  OptionPosition,
  AssistantMessage,
} from "../../types/portfolio";

type PortfolioOverviewProps = {
  summary: PortfolioSummaryPayload | null;
  summaryLoading: boolean;
  summaryError: string | null;
  currency: string;
  // Stock sell state
  sellStockSymbol: string | null;
  sellStockQuantity: number;
  setSellStockQuantity: (val: number) => void;
  sellStockLoading: boolean;
  sellStockError: string | null;
  sellStockSuccess: string | null;
  onStockRowClick: (symbol: string, maxQty: number) => void;
  onStockClearSelection: () => void;
  onSellStock: (symbol: string, quantity: number) => void;
  // Option positions
  optionPositions: OptionPosition[];
  optionPositionsLoading: boolean;
  optionPositionsError: string | null;
  // Option sell state
  sellOptionId: number | null;
  sellOptionQuantity: number;
  setSellOptionQuantity: (val: number) => void;
  sellOptionLoading: boolean;
  sellOptionError: string | null;
  sellOptionSuccess: string | null;
  onOptionRowClick: (id: number, maxQty: number) => void;
  onOptionClearSelection: () => void;
  onSellOption: (pos: OptionPosition, quantity: number) => void;
  // Option exercise
  optionExerciseLoadingId: number | null;
  optionExerciseError: string | null;
  optionExerciseSuccess: string | null;
  onExerciseOption: (pos: OptionPosition) => void;
  // Assistant
  assistantOpen: boolean;
  assistantMessages: AssistantMessage[];
  assistantInput: string;
  setAssistantInput: (val: string) => void;
  assistantLoading: boolean;
  assistantError: string | null;
  onOpenAssistant: () => void;
  onSendAssistantMessage: (e: React.FormEvent, snapshot: PortfolioSummaryPayload | null) => void;
};

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  summary,
  summaryLoading,
  summaryError,
  currency,
  sellStockSymbol,
  sellStockQuantity,
  setSellStockQuantity,
  sellStockLoading,
  sellStockError,
  sellStockSuccess,
  onStockRowClick,
  onStockClearSelection,
  onSellStock,
  optionPositions,
  optionPositionsLoading,
  optionPositionsError,
  sellOptionId,
  sellOptionQuantity,
  setSellOptionQuantity,
  sellOptionLoading,
  sellOptionError,
  sellOptionSuccess,
  onOptionRowClick,
  onOptionClearSelection,
  onSellOption,
  optionExerciseLoadingId,
  optionExerciseError,
  optionExerciseSuccess,
  onExerciseOption,
  assistantOpen,
  assistantMessages,
  assistantInput,
  setAssistantInput,
  assistantLoading,
  assistantError,
  onOpenAssistant,
  onSendAssistantMessage,
}) => {
  return (
    <SectionCard>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: colors.textPrimary,
              mb: 0.5,
            }}
          >
            Portfolio Overview
          </Typography>
          <Typography
            sx={{
              color: colors.textMuted,
              fontSize: "0.8125rem",
            }}
          >
            Live snapshot of your simulated account
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          onClick={onOpenAssistant}
          disabled={!summary || summaryLoading || !!summaryError}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 500,
            borderColor: colors.border,
            color: colors.textPrimary,
            px: 2.5,
            "&:hover": {
              borderColor: colors.accent,
              backgroundColor: "rgba(59, 130, 246, 0.08)",
            },
          }}
        >
          Ask FinanceBud
        </Button>
      </Box>

      <Divider sx={{ borderColor: colors.border, mb: 3 }} />

      {summaryLoading && (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Typography sx={{ color: colors.textSecondary }}>
            Loading portfolio...
          </Typography>
        </Box>
      )}

      {summaryError && !summaryLoading && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {summaryError}
        </Alert>
      )}

      {!summaryLoading && !summaryError && summary && (
        <>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <GridItem item xs={12} sm={4}>
              <StatCard
                label="Cash Balance"
                value={summary.portfolio.cash_balance}
                currency={currency}
              />
            </GridItem>
            <GridItem item xs={12} sm={4}>
              <StatCard
                label="Positions Value"
                value={summary.portfolio.positions_value}
                currency={currency}
              />
            </GridItem>
            <GridItem item xs={12} sm={4}>
              <StatCard
                label="Total Equity"
                value={summary.portfolio.total_equity}
                currency={currency}
                highlight
              />
            </GridItem>
          </Grid>

          {summary.market_error && (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              Market data warning: {summary.market_error}
            </Alert>
          )}

          {sellStockError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {sellStockError}
            </Alert>
          )}
          {sellStockSuccess && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              {sellStockSuccess}
            </Alert>
          )}

          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  color: colors.textPrimary,
                  fontSize: "1rem",
                }}
              >
                Stock Positions
              </Typography>
              <Chip
                label={summary.positions.length}
                size="small"
                sx={{
                  backgroundColor: "rgba(59, 130, 246, 0.15)",
                  color: colors.accent,
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              />
            </Box>

            <StockPositionsTable
              positions={summary.positions}
              currency={currency}
              sellSymbol={sellStockSymbol}
              sellQuantity={sellStockQuantity}
              setSellQuantity={setSellStockQuantity}
              sellLoading={sellStockLoading}
              onRowClick={onStockRowClick}
              onClearSelection={onStockClearSelection}
              onSell={onSellStock}
            />
          </Box>

          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  color: colors.textPrimary,
                  fontSize: "1rem",
                }}
              >
                Options Positions
              </Typography>
              <Chip
                label={optionPositions.length}
                size="small"
                sx={{
                  backgroundColor: "rgba(59, 130, 246, 0.15)",
                  color: colors.accent,
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              />
            </Box>

            {optionPositionsError && (
              <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                {optionPositionsError}
              </Alert>
            )}

            {optionExerciseError && (
              <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                {optionExerciseError}
              </Alert>
            )}

            {optionExerciseSuccess && (
              <Alert severity="success" sx={{ borderRadius: 2, mb: 2 }}>
                {optionExerciseSuccess}
              </Alert>
            )}

            {sellOptionError && (
              <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                {sellOptionError}
              </Alert>
            )}

            {sellOptionSuccess && (
              <Alert severity="success" sx={{ borderRadius: 2, mb: 2 }}>
                {sellOptionSuccess}
              </Alert>
            )}

            <OptionsPositionsTable
              positions={optionPositions}
              currency={currency}
              loading={optionPositionsLoading}
              error={optionPositionsError}
              sellOptionId={sellOptionId}
              sellQuantity={sellOptionQuantity}
              setSellQuantity={setSellOptionQuantity}
              sellLoading={sellOptionLoading}
              exerciseLoadingId={optionExerciseLoadingId}
              onRowClick={onOptionRowClick}
              onClearSelection={onOptionClearSelection}
              onSell={onSellOption}
              onExercise={onExerciseOption}
            />
          </Box>

          {assistantOpen && (
            <PortfolioAssistant
              messages={assistantMessages}
              input={assistantInput}
              setInput={setAssistantInput}
              loading={assistantLoading}
              error={assistantError}
              onSendMessage={onSendAssistantMessage}
              summary={summary}
            />
          )}
        </>
      )}
    </SectionCard>
  );
};
