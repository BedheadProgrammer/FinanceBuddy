import { useEffect } from "react";
import { Box, Grid, Typography, Stack, Container } from "@mui/material";
import { usePageMeta } from "../hooks/usePageMeta";
import { usePortfolioSummary } from "../hooks/usePortfolioSummary";
import { useStockTrade, useSellStock } from "../hooks/useStockTrade";
import { useOptionPositions } from "../hooks/useOptionPositions";
import { useOptionTrade, useSellOption } from "../hooks/useOptionTrade";
import { useOptionExercise } from "../hooks/useOptionExercise";
import { usePortfolioAssistant } from "../hooks/usePortfolioAssistant";
import { colors, typography } from "../constants/theme";
import { GridItem } from "../components/common";
import { BuyStockForm, BuyOptionsForm, PortfolioOverview } from "../components/portfolio";

export default function Portfolio() {
  usePageMeta("Portfolio | FinanceBuddy", "Virtual Stock Exchange Portfolio");


  const {
    summary,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = usePortfolioSummary();

  const {
    positions: optionPositions,
    loading: optionPositionsLoading,
    error: optionPositionsError,
    fetchPositions: fetchOptionPositions,
  } = useOptionPositions();

  const stockTrade = useStockTrade({
    onSuccess: refetchSummary,
  });

  const sellStock = useSellStock({
    onSuccess: refetchSummary,
  });


  const optionTrade = useOptionTrade({
    onSuccess: async (portfolioId: number) => {
      await refetchSummary();
      await fetchOptionPositions(portfolioId);
    },
  });


  const sellOption = useSellOption({
    onSuccess: async (portfolioId: number) => {
      await refetchSummary();
      await fetchOptionPositions(portfolioId);
    },
  });


  const optionExercise = useOptionExercise({
    onSuccess: async (portfolioId: number) => {
      await refetchSummary();
      await fetchOptionPositions(portfolioId);
    },
  });


  const assistant = usePortfolioAssistant();


  useEffect(() => {
    if (summary?.portfolio.id) {
      fetchOptionPositions(summary.portfolio.id);
    }
  }, [summary?.portfolio.id, fetchOptionPositions]);

  const currency = summary?.portfolio.currency || "USD";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: colors.pageBg,
        backgroundImage: "none",
        py: 5,
        position: "relative",
        "&::before": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.pageBg,
          zIndex: -1,
          pointerEvents: "none",
        },
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          transform: "scale(0.8)",
          transformOrigin: "top center",
        }}
      >
        <Box sx={{ mb: 5, textAlign: "center" }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: colors.textPrimary,
              fontFamily: typography.sans,
              letterSpacing: "-0.02em",
              mb: 1.5,
            }}
          >
            Virtual Stock Portfolio
          </Typography>
          <Typography
            sx={{
              color: colors.textSecondary,
              fontSize: "1rem",
              maxWidth: 500,
              mx: "auto",
            }}
          >
            Track your cash, holdings, and live P/L while placing simulated trades
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          <GridItem item xs={12} lg={5}>
            <Stack spacing={3}>
              <BuyStockForm
                symbol={stockTrade.symbol}
                setSymbol={stockTrade.setSymbol}
                quantity={stockTrade.quantity}
                setQuantity={stockTrade.setQuantity}
                price={stockTrade.price}
                setPrice={stockTrade.setPrice}
                useMarketPrice={stockTrade.useMarketPrice}
                setUseMarketPrice={stockTrade.setUseMarketPrice}
                loading={stockTrade.loading}
                error={stockTrade.error}
                success={stockTrade.success}
                onSubmit={stockTrade.handleSubmitTrade}
              />

              <BuyOptionsForm
                symbol={optionTrade.symbol}
                setSymbol={optionTrade.setSymbol}
                side={optionTrade.side}
                setSide={optionTrade.setSide}
                style={optionTrade.style}
                setStyle={optionTrade.setStyle}
                strike={optionTrade.strike}
                setStrike={optionTrade.setStrike}
                expiry={optionTrade.expiry}
                setExpiry={optionTrade.setExpiry}
                quantity={optionTrade.quantity}
                setQuantity={optionTrade.setQuantity}
                loading={optionTrade.loading}
                error={optionTrade.error}
                success={optionTrade.success}
                onSubmit={optionTrade.handleSubmitTrade}
                summary={summary}
              />
            </Stack>
          </GridItem>

          <GridItem item xs={12} lg={7}>
            <PortfolioOverview
              summary={summary}
              summaryLoading={summaryLoading}
              summaryError={summaryError}
              currency={currency}

              sellStockSymbol={sellStock.sellSymbol}
              sellStockQuantity={sellStock.sellQuantity}
              setSellStockQuantity={sellStock.setSellQuantity}
              sellStockLoading={sellStock.loading}
              sellStockError={sellStock.error}
              sellStockSuccess={sellStock.success}
              onStockRowClick={sellStock.selectPosition}
              onStockClearSelection={sellStock.clearSelection}
              onSellStock={sellStock.handleSellStock}

              optionPositions={optionPositions}
              optionPositionsLoading={optionPositionsLoading}
              optionPositionsError={optionPositionsError}

              sellOptionId={sellOption.sellOptionId}
              sellOptionQuantity={sellOption.sellQuantity}
              setSellOptionQuantity={sellOption.setSellQuantity}
              sellOptionLoading={sellOption.loading}
              sellOptionError={sellOption.error}
              sellOptionSuccess={sellOption.success}
              onOptionRowClick={sellOption.selectPosition}
              onOptionClearSelection={sellOption.clearSelection}
              onSellOption={(pos, qty) => sellOption.handleSellOption(pos, qty, summary)}

              optionExerciseLoadingId={optionExercise.loadingId}
              optionExerciseError={optionExercise.error}
              optionExerciseSuccess={optionExercise.success}
              onExerciseOption={(pos) => optionExercise.handleExerciseOption(pos, summary)}

              assistantOpen={assistant.open}
              assistantMessages={assistant.messages}
              assistantInput={assistant.input}
              setAssistantInput={assistant.setInput}
              assistantLoading={assistant.loading}
              assistantError={assistant.error}
              onOpenAssistant={() => assistant.handleOpen(summary)}
              onSendAssistantMessage={assistant.handleSendMessage}
            />
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
}
