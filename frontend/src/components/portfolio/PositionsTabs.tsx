import React from "react";
import {
  Box,
  Grid,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Button,
  Alert,
} from "@mui/material";
import { colors } from "../../constants/theme";
import { SectionCard, StatCard, GridItem } from "../common";
import { StockPositionsTable } from "./StockPositionsTable";
import { OptionsPositionsTable } from "./OptionsPositionsTable";
import { CryptoPositionsTable } from "./CryptoPositionsTable";
import { PortfolioAssistant } from "./PortfolioAssistant";
import type {
  PortfolioSummaryPayload,
  OptionPosition,
  CryptoPosition,
  AssistantMessage,
} from "../../types/portfolio";

type PositionsTabsProps = {
  activeTab: number;
  onTabChange: (tab: number) => void;
  summary: PortfolioSummaryPayload | null;
  summaryLoading: boolean;
  summaryError: string | null;
  currency: string;
  sellStockSymbol: string | null;
  sellStockQuantity: number;
  setSellStockQuantity: (val: number) => void;
  sellStockLoading: boolean;
  sellStockError: string | null;
  sellStockSuccess: string | null;
  onStockRowClick: (symbol: string, maxQty: number) => void;
  onStockClearSelection: () => void;
  onSellStock: (symbol: string, quantity: number) => void;
  optionPositions: OptionPosition[];
  optionPositionsLoading: boolean;
  optionPositionsError: string | null;
  sellOptionId: number | null;
  sellOptionQuantity: number;
  setSellOptionQuantity: (val: number) => void;
  sellOptionLoading: boolean;
  sellOptionError: string | null;
  sellOptionSuccess: string | null;
  onOptionRowClick: (id: number, maxQty: number) => void;
  onOptionClearSelection: () => void;
  onSellOption: (pos: OptionPosition, quantity: number) => void;
  optionExerciseLoadingId: number | null;
  optionExerciseError: string | null;
  optionExerciseSuccess: string | null;
  onExerciseOption: (pos: OptionPosition) => void;
  cryptoPositions: CryptoPosition[];
  cryptoPositionsLoading: boolean;
  cryptoPositionsError: string | null;
  sellCryptoSymbol: string | null;
  sellCryptoQuantity: number;
  setSellCryptoQuantity: (val: number) => void;
  sellCryptoMaxQuantity: number;
  sellCryptoLoading: boolean;
  sellCryptoError: string | null;
  sellCryptoSuccess: string | null;
  onCryptoRowClick: (symbol: string, maxQty: number) => void;
  onCryptoClearSelection: () => void;
  onSellCrypto: (symbol: string, quantity: number) => void;
  assistantOpen: boolean;
  assistantMessages: AssistantMessage[];
  assistantInput: string;
  setAssistantInput: (val: string) => void;
  assistantLoading: boolean;
  assistantError: string | null;
  onOpenAssistant: () => void;
  onSendAssistantMessage: (e: React.FormEvent, snapshot: PortfolioSummaryPayload | null) => void;
};

export const PositionsTabs: React.FC<PositionsTabsProps> = ({
  activeTab,
  onTabChange,
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
  cryptoPositions,
  cryptoPositionsLoading,
  cryptoPositionsError,
  sellCryptoSymbol,
  sellCryptoQuantity,
  setSellCryptoQuantity,
  sellCryptoMaxQuantity,
  sellCryptoLoading,
  sellCryptoError,
  sellCryptoSuccess,
  onCryptoRowClick,
  onCryptoClearSelection,
  onSellCrypto,
  assistantOpen,
  assistantMessages,
  assistantInput,
  setAssistantInput,
  assistantLoading,
  assistantError,
  onOpenAssistant,
  onSendAssistantMessage,
}) => {
  const handleTabChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: number | null,
  ) => {
    if (newValue !== null) {
      onTabChange(newValue);
    }
  };

  const stockCount = summary?.positions.length ?? 0;
  const optionCount = optionPositions.length;
  const cryptoCount = cryptoPositions.length;

  const renderButtonLabel = (label: string, count: number, accentColor: string) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {label}
      {count > 0 && (
        <Box
          sx={{
            minWidth: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: accentColor,
            color: "#fff",
            fontSize: "0.7rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 0.5,
          }}
        >
          {count}
        </Box>
      )}
    </Box>
  );

  return (
    <SectionCard sx={{ p: 0, overflow: "hidden" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          py: 2,
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: "rgba(15, 23, 42, 0.3)",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: colors.textPrimary,
            fontSize: "1rem",
          }}
        >
          Portfolio Overview
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={onOpenAssistant}
          disabled={!summary || summaryLoading || !!summaryError}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.8rem",
            borderColor: colors.border,
            color: colors.textPrimary,
            px: 2,
            "&:hover": {
              borderColor: colors.accent,
              backgroundColor: "rgba(59, 130, 246, 0.08)",
            },
          }}
        >
          Ask FinanceBud
        </Button>
      </Box>

      {summaryLoading && (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Typography sx={{ color: colors.textSecondary }}>
            Loading portfolio...
          </Typography>
        </Box>
      )}

      {summaryError && !summaryLoading && (
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {summaryError}
          </Alert>
        </Box>
      )}

      {!summaryLoading && !summaryError && summary && (
        <>
          <Box sx={{ px: 3, py: 2, backgroundColor: "rgba(15, 23, 42, 0.2)" }}>
            <Grid container spacing={2}>
              <GridItem item xs={4}>
                <StatCard
                  label="Cash"
                  value={summary.portfolio.cash_balance}
                  currency={currency}
                />
              </GridItem>
              <GridItem item xs={4}>
                <StatCard
                  label="Positions"
                  value={summary.portfolio.positions_value}
                  currency={currency}
                />
              </GridItem>
              <GridItem item xs={4}>
                <StatCard
                  label="Total Equity"
                  value={summary.portfolio.total_equity}
                  currency={currency}
                  highlight
                />
              </GridItem>
            </Grid>
          </Box>

          {(summary.market_error || summary.crypto_market_error) && (
            <Box sx={{ px: 3, pt: 2 }}>
              {summary.market_error && (
                <Alert severity="warning" sx={{ mb: 1, borderRadius: 2 }}>
                  Market data: {summary.market_error}
                </Alert>
              )}
              {summary.crypto_market_error && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  Crypto data: {summary.crypto_market_error}
                </Alert>
              )}
            </Box>
          )}

          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: "rgba(15, 23, 42, 0.5)",
            }}
          >
            <ToggleButtonGroup
              value={activeTab}
              exclusive
              onChange={handleTabChange}
              fullWidth
              sx={{
                "& .MuiToggleButtonGroup-grouped": {
                  border: "none",
                  borderRadius: "8px !important",
                  mx: 0.5,
                  py: 1,
                  px: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: colors.textSecondary,
                  backgroundColor: "transparent",
                  "&:hover": {
                    backgroundColor: "rgba(59, 130, 246, 0.08)",
                  },
                  "&.Mui-selected": {
                    color: colors.accent,
                    backgroundColor: "rgba(59, 130, 246, 0.15)",
                    "&:hover": {
                      backgroundColor: "rgba(59, 130, 246, 0.2)",
                    },
                  },
                },
              }}
            >
              <ToggleButton value={0}>
                {renderButtonLabel("Stocks", stockCount, colors.accent)}
              </ToggleButton>
              <ToggleButton value={1}>
                {renderButtonLabel("Options", optionCount, colors.accent)}
              </ToggleButton>
              <ToggleButton value={2}>
                {renderButtonLabel("Crypto", cryptoCount, "#f59e0b")}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <>
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
              </>
            )}

            {activeTab === 1 && (
              <>
                {optionPositionsError && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {optionPositionsError}
                  </Alert>
                )}
                {optionExerciseError && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {optionExerciseError}
                  </Alert>
                )}
                {optionExerciseSuccess && (
                  <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                    {optionExerciseSuccess}
                  </Alert>
                )}
                {sellOptionError && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {sellOptionError}
                  </Alert>
                )}
                {sellOptionSuccess && (
                  <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
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
              </>
            )}

            {activeTab === 2 && (
              <CryptoPositionsTable
                positions={cryptoPositions}
                currency={currency}
                loading={cryptoPositionsLoading}
                error={cryptoPositionsError}
                sellSymbol={sellCryptoSymbol}
                sellQuantity={sellCryptoQuantity}
                setSellQuantity={setSellCryptoQuantity}
                maxQuantity={sellCryptoMaxQuantity}
                sellLoading={sellCryptoLoading}
                sellError={sellCryptoError}
                sellSuccess={sellCryptoSuccess}
                onRowClick={onCryptoRowClick}
                onClearSelection={onCryptoClearSelection}
                onSell={onSellCrypto}
              />
            )}
          </Box>

          {assistantOpen && (
            <Box sx={{ px: 3, pb: 3 }}>
              <Divider sx={{ borderColor: colors.border, mb: 3 }} />
              <PortfolioAssistant
                messages={assistantMessages}
                input={assistantInput}
                setInput={setAssistantInput}
                loading={assistantLoading}
                error={assistantError}
                onSendMessage={onSendAssistantMessage}
                summary={summary}
              />
            </Box>
          )}
        </>
      )}
    </SectionCard>
  );
};