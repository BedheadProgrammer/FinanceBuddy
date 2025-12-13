// frontend/src/hooks/useStockTrade.ts

import { useState } from "react";
import type { TradeSide, TradeResponse } from "../types/portfolio";

type UseStockTradeOptions = {
  portfolioId?: number | null;
  onSuccess?: () => void;
};

export function useStockTrade({
  portfolioId,
  onSuccess,
}: UseStockTradeOptions = {}) {
  const [symbol, setSymbol] = useState("AAPL");
  const [quantity, setQuantity] = useState("10");
  const [price, setPrice] = useState("");
  const [useMarketPrice, setUseMarketPrice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetStatus = () => {
    setError(null);
    setSuccess(null);
  };

  async function handleSubmitTrade() {
    resetStatus();

    const symbolTrimmed = symbol.trim().toUpperCase();
    const quantityTrimmed = quantity.trim();

    if (!symbolTrimmed) {
      setError("Symbol is required.");
      return;
    }

    const qtyNum = Number(quantityTrimmed);
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }

    const body: any = {
      symbol: symbolTrimmed,
      side: "BUY" as TradeSide,
      quantity: qtyNum,
    };

    if (!useMarketPrice && price.trim()) {
      const priceNum = Number(price.trim());
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        setError("Limit price must be a positive number.");
        return;
      }
      body.price = priceNum;
    }

    if (portfolioId != null) {
      body.portfolio_id = portfolioId;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/portfolio/trade/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as TradeResponse & { error?: string };

      if (!res.ok || json.error) {
        const msg = json.error || "Trade failed.";
        setError(msg);
      } else {
        setSuccess(
          `Bought ${json.trade.quantity} ${json.trade.symbol} @ $${json.trade.price.toFixed(
            2,
          )}`,
        );
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err?.message || "Trade failed.");
    } finally {
      setLoading(false);
    }
  }

  return {
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
    handleSubmitTrade,
  };
}

export function useSellStock({
  portfolioId,
  onSuccess,
}: UseStockTradeOptions = {}) {
  const [sellSymbol, setSellSymbol] = useState<string | null>(null);
  const [sellQuantity, setSellQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetStatus = () => {
    setError(null);
    setSuccess(null);
  };

  function selectPosition(symbol: string, quantity: number) {
    resetStatus();
    setSellSymbol(symbol);
    setSellQuantity(quantity);
  }

  function clearSelection() {
    resetStatus();
    setSellSymbol(null);
    setSellQuantity(0);
  }

  async function handleSellStock(symbol: string, quantity: number) {
    resetStatus();

    if (quantity <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    const body: any = {
      symbol: symbol.toUpperCase(),
      side: "SELL" as TradeSide,
      quantity,
    };

    if (portfolioId != null) {
      body.portfolio_id = portfolioId;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/portfolio/trade/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as TradeResponse & { error?: string };

      if (!res.ok || json.error) {
        const msg = json.error || "Sell failed.";
        setError(msg);
      } else {
        setSuccess(
          `Sold ${json.trade.quantity} ${json.trade.symbol} @ $${json.trade.price.toFixed(
            2,
          )}`,
        );
        setSellSymbol(null);
        setSellQuantity(0);
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err?.message || "Sell failed.");
    } finally {
      setLoading(false);
    }
  }

  return {
    sellSymbol,
    sellQuantity,
    setSellQuantity,
    loading,
    error,
    success,
    handleSellStock,
    selectPosition,
    clearSelection,
  };
}
