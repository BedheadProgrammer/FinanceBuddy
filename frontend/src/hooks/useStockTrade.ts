import { useState } from "react";
import type { TradeSide, TradeResponse } from "../types/portfolio";


type UseStockTradeOptions = {
  onSuccess?: () => void;
};

export function useStockTrade({ onSuccess }: UseStockTradeOptions = {}) {
  const [symbol, setSymbol] = useState("AAPL");
  const [quantity, setQuantity] = useState("10");
  const [price, setPrice] = useState("");
  const [useMarketPrice, setUseMarketPrice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmitTrade(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const quantityTrimmed = quantity.trim();
    if (!symbol.trim() || !quantityTrimmed) {
      setError("Symbol and quantity are required.");
      return;
    }

    const body: any = {
      symbol: symbol.trim().toUpperCase(),
      side: "BUY" as TradeSide,
      quantity: Number(quantityTrimmed),
    };

    if (!useMarketPrice && price.trim()) {
      body.price = Number(price.trim());
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
      const json = (await res.json()) as TradeResponse;

      if (!res.ok || !json.ok) {
        const msg = json.error || (json as any).error || "Trade failed.";
        setError(msg);
      } else {
        setSuccess(
          `Bought ${json.trade.quantity} ${json.trade.symbol} @ $${json.trade.price.toFixed(2)}`
        );
        setQuantity("10");
        if (!useMarketPrice) {
          setPrice("");
        }
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

export function useSellStock({ onSuccess }: UseStockTradeOptions = {}) {
  const [sellSymbol, setSellSymbol] = useState<string | null>(null);
  const [sellQuantity, setSellQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSellStock(symbol: string, quantity: number) {
    setError(null);
    setSuccess(null);

    if (quantity <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    const body: any = {
      symbol: symbol.toUpperCase(),
      side: "SELL" as TradeSide,
      quantity: quantity,
    };

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
      const json = (await res.json()) as TradeResponse;

      if (!res.ok || !json.ok) {
        const msg = json.error || (json as any).error || "Sell failed.";
        setError(msg);
      } else {
        setSuccess(
          `Sold ${json.trade.quantity} ${json.trade.symbol} @ $${json.trade.price.toFixed(2)}`
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

  const selectPosition = (symbol: string, maxQty: number) => {
    setSellSymbol(symbol);
    setSellQuantity(maxQty);
    setError(null);
    setSuccess(null);
  };

  const clearSelection = () => {
    setSellSymbol(null);
    setSellQuantity(0);
  };

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
