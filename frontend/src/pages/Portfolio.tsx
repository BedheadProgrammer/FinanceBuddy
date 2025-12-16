import { useEffect, type ChangeEvent } from "react";
import {
  Box,
  Grid,
  Typography,
  Stack,
  Container,
  TextField,
  MenuItem,
  Chip,
} from "@mui/material";
import { usePageMeta } from "../hooks/usePageMeta";
import { usePortfolioSummary } from "../hooks/usePortfolioSummary";
import { useStockTrade, useSellStock } from "../hooks/useStockTrade";
import { useOptionPositions } from "../hooks/useOptionPositions";
import { useOptionTrade, useSellOption } from "../hooks/useOptionTrade";
import { useOptionExercise } from "../hooks/useOptionExercise";
import { useCryptoAssets } from "../hooks/useCryptoAssets";
import { useCryptoPositions } from "../hooks/useCryptoPositions";
import { useCryptoTrade, useSellCrypto } from "../hooks/useCryptoTrade";
import { usePortfolioAssistant } from "../hooks/usePortfolioAssistant";
import { colors, typography } from "../constants/theme";
import { GridItem } from "../components/common";
import { BuyStockForm, BuyOptionsForm, BuyCryptoForm, PortfolioOverview } from "../components/portfolio";
import { usePortfolioContext } from "../store/portfolio";

export default function Portfolio() {
  usePageMeta("Portfolio | FinanceBuddy", "Virtual Stock Exchange Portfolio");

  useEffect(() => {
    const originalBackground = document.body.style.background;
    const originalAnimation = document.body.style.animation;

    document.body.style.background = colors.pageBg;
    document.body.style.animation = "none";

    return () => {
      document.body.style.background = originalBackground;
      document.body.style.animation = originalAnimation;
    };
  }, []);

  const {
    portfolios,
    activePortfolioId,
    setActivePortfolioId,
    loading: portfoliosLoading,
    error: portfoliosError,
  } = usePortfolioContext();

  const {
    summary,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = usePortfolioSummary({
    portfolioId: activePortfolioId ?? undefined,
  });

  const {
    positions: optionPositions,
    loading: optionPositionsLoading,
    error: optionPositionsError,
    fetchPositions: fetchOptionPositions,
  } = useOptionPositions();

  const {
    positions: cryptoPositions,
    loading: cryptoPositionsLoading,
    error: cryptoPositionsError,
    fetchPositions: fetchCryptoPositions,
  } = useCryptoPositions();

  const {
    assets: cryptoAssets,
    loading: cryptoAssetsLoading,
    error: cryptoAssetsError,
  } = useCryptoAssets();

  const stockTrade = useStockTrade({
    portfolioId: summary?.portfolio.id,
    onSuccess: refetchSummary,
  });

  const sellStock = useSellStock({
    portfolioId: summary?.portfolio.id,
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

  const cryptoTrade = useCryptoTrade({
    portfolioId: summary?.portfolio.id,
    onSuccess: async () => {
      await refetchSummary();
      if (summary?.portfolio.id) {
        await fetchCryptoPositions(summary.portfolio.id);
      }
    },
  });

  const sellCrypto = useSellCrypto({
    portfolioId: summary?.portfolio.id,
    onSuccess: async () => {
      await refetchSummary();
      if (summary?.portfolio.id) {
        await fetchCryptoPositions(summary.portfolio.id);
      }
    },
  });

  const assistant = usePortfolioAssistant();

  useEffect(() => {
    if (summary?.portfolio.id) {
      fetchOptionPositions(summary.portfolio.id);
      fetchCryptoPositions(summary.portfolio.id);
    }
  }, [summary?.portfolio.id, fetchOptionPositions, fetchCryptoPositions]);

  const currency = summary?.portfolio.currency || "USD";

  const handlePortfolioChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const nextId = Number(event.target.value);
    if (!Number.isNaN(nextId)) {
      setActivePortfolioId(nextId);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: colors.pageBg,
        py: 5,
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          transform: "scale(0.8)",
          transformOrigin: "top center",
        }}
      >
        <Box
          sx={{
            mb: 5,
            textAlign: "center",
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontFamily: typography.sans,
              fontSize: { xs: "1.9rem", md: "2.4rem" },
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: colors.textPrimary,
              mb: 1,
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

        {portfoliosError && (
          <Box sx={{ mb: 2, textAlign: "center" }}>
            <Typography
              sx={{
                color: colors.negative,
                fontSize: "0.9rem",
              }}
            >
              {portfoliosError}
            </Typography>
          </Box>
        )}

        {portfolios.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="center"
            >
              <Typography
                sx={{
                  color: colors.textSecondary,
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                Active portfolio
              </Typography>
              <TextField
                select
                size="small"
                value={activePortfolioId ?? ""}
                onChange={handlePortfolioChange}
                sx={{ minWidth: 220 }}
                disabled={portfoliosLoading}
              >
                {portfolios.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography sx={{ fontSize: "0.9rem" }}>{p.name}</Typography>
                      {p.is_default && (
                        <Chip
                          label="Default"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.7rem",
                          }}
                        />
                      )}
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Box>
        )}

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
                onSubmit={(e, snapshot) => optionTrade.handleSubmitTrade(e, snapshot)}
                summary={summary}
              />

              <BuyCryptoForm
                assets={cryptoAssets}
                assetsLoading={cryptoAssetsLoading}
                assetsError={cryptoAssetsError}
                symbol={cryptoTrade.symbol}
                setSymbol={cryptoTrade.setSymbol}
                quantity={cryptoTrade.quantity}
                setQuantity={cryptoTrade.setQuantity}
                loading={cryptoTrade.loading}
                error={cryptoTrade.error}
                success={cryptoTrade.success}
                onSubmit={cryptoTrade.handleSubmitTrade}
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
              onSellOption={(pos, qty) =>
                sellOption.handleSellOption(pos, qty, summary)
              }
              optionExerciseLoadingId={optionExercise.loadingId}
              optionExerciseError={optionExercise.error}
              optionExerciseSuccess={optionExercise.success}
              onExerciseOption={(pos) => optionExercise.handleExerciseOption(pos, summary)}
              cryptoPositions={cryptoPositions}
              cryptoPositionsLoading={cryptoPositionsLoading}
              cryptoPositionsError={cryptoPositionsError}
              sellCryptoSymbol={sellCrypto.sellSymbol}
              sellCryptoQuantity={sellCrypto.sellQuantity}
              setSellCryptoQuantity={sellCrypto.setSellQuantity}
              sellCryptoMaxQuantity={sellCrypto.maxQuantity}
              sellCryptoLoading={sellCrypto.loading}
              sellCryptoError={sellCrypto.error}
              sellCryptoSuccess={sellCrypto.success}
              onCryptoRowClick={sellCrypto.selectPosition}
              onCryptoClearSelection={sellCrypto.clearSelection}
              onSellCrypto={sellCrypto.handleSellCrypto}
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