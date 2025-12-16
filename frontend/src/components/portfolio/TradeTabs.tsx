import React from "react";
import { Box, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { colors } from "../../constants/theme";
import { SectionCard } from "../common";
import { BuyStockForm } from "./BuyStockForm";
import { BuyOptionsForm } from "./BuyOptionsForm";
import { BuyCryptoForm } from "./BuyCryptoForm";
import type {
  PortfolioSummaryPayload,
  OptionSide,
  OptionStyle,
  CryptoAsset,
} from "../../types/portfolio";

type TradeTabsProps = {
  activeTab: number;
  onTabChange: (tab: number) => void;
  stockSymbol: string;
  setStockSymbol: (val: string) => void;
  stockQuantity: string;
  setStockQuantity: (val: string) => void;
  stockPrice: string;
  setStockPrice: (val: string) => void;
  stockUseMarketPrice: boolean;
  setStockUseMarketPrice: (val: boolean) => void;
  stockLoading: boolean;
  stockError: string | null;
  stockSuccess: string | null;
  onStockSubmit: (e: React.FormEvent) => void;
  optionSymbol: string;
  setOptionSymbol: (val: string) => void;
  optionSide: OptionSide;
  setOptionSide: (val: OptionSide) => void;
  optionStyle: OptionStyle;
  setOptionStyle: (val: OptionStyle) => void;
  optionStrike: string;
  setOptionStrike: (val: string) => void;
  optionExpiry: string;
  setOptionExpiry: (val: string) => void;
  optionQuantity: string;
  setOptionQuantity: (val: string) => void;
  optionLoading: boolean;
  optionError: string | null;
  optionSuccess: string | null;
  onOptionSubmit: (e: React.FormEvent, snapshot: PortfolioSummaryPayload | null) => void;
  summary: PortfolioSummaryPayload | null;
  cryptoAssets: CryptoAsset[];
  cryptoAssetsLoading: boolean;
  cryptoAssetsError: string | null;
  cryptoSymbol: string;
  setCryptoSymbol: (val: string) => void;
  cryptoQuantity: string;
  setCryptoQuantity: (val: string) => void;
  cryptoLoading: boolean;
  cryptoError: string | null;
  cryptoSuccess: string | null;
  onCryptoSubmit: (e: React.FormEvent) => void;
};

export const TradeTabs: React.FC<TradeTabsProps> = ({
  activeTab,
  onTabChange,
  stockSymbol,
  setStockSymbol,
  stockQuantity,
  setStockQuantity,
  stockPrice,
  setStockPrice,
  stockUseMarketPrice,
  setStockUseMarketPrice,
  stockLoading,
  stockError,
  stockSuccess,
  onStockSubmit,
  optionSymbol,
  setOptionSymbol,
  optionSide,
  setOptionSide,
  optionStyle,
  setOptionStyle,
  optionStrike,
  setOptionStrike,
  optionExpiry,
  setOptionExpiry,
  optionQuantity,
  setOptionQuantity,
  optionLoading,
  optionError,
  optionSuccess,
  onOptionSubmit,
  summary,
  cryptoAssets,
  cryptoAssetsLoading,
  cryptoAssetsError,
  cryptoSymbol,
  setCryptoSymbol,
  cryptoQuantity,
  setCryptoQuantity,
  cryptoLoading,
  cryptoError,
  cryptoSuccess,
  onCryptoSubmit,
}) => {
  const handleTabChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: number | null,
  ) => {
    if (newValue !== null) {
      onTabChange(newValue);
    }
  };

  return (
    <SectionCard sx={{ p: 0, overflow: "hidden" }}>
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
              fontSize: "0.875rem",
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
          <ToggleButton value={0}>Stocks</ToggleButton>
          <ToggleButton value={1}>Options</ToggleButton>
          <ToggleButton value={2}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              Crypto
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#f59e0b",
                }}
              />
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ p: 3 }}>
        {activeTab === 0 && (
          <BuyStockForm
            symbol={stockSymbol}
            setSymbol={setStockSymbol}
            quantity={stockQuantity}
            setQuantity={setStockQuantity}
            price={stockPrice}
            setPrice={setStockPrice}
            useMarketPrice={stockUseMarketPrice}
            setUseMarketPrice={setStockUseMarketPrice}
            loading={stockLoading}
            error={stockError}
            success={stockSuccess}
            onSubmit={onStockSubmit}
            embedded
          />
        )}

        {activeTab === 1 && (
          <BuyOptionsForm
            symbol={optionSymbol}
            setSymbol={setOptionSymbol}
            side={optionSide}
            setSide={setOptionSide}
            style={optionStyle}
            setStyle={setOptionStyle}
            strike={optionStrike}
            setStrike={setOptionStrike}
            expiry={optionExpiry}
            setExpiry={setOptionExpiry}
            quantity={optionQuantity}
            setQuantity={setOptionQuantity}
            loading={optionLoading}
            error={optionError}
            success={optionSuccess}
            onSubmit={onOptionSubmit}
            summary={summary}
            embedded
          />
        )}

        {activeTab === 2 && (
          <BuyCryptoForm
            assets={cryptoAssets}
            assetsLoading={cryptoAssetsLoading}
            assetsError={cryptoAssetsError}
            symbol={cryptoSymbol}
            setSymbol={setCryptoSymbol}
            quantity={cryptoQuantity}
            setQuantity={setCryptoQuantity}
            loading={cryptoLoading}
            error={cryptoError}
            success={cryptoSuccess}
            onSubmit={onCryptoSubmit}
            embedded
          />
        )}
      </Box>
    </SectionCard>
  );
};