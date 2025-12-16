import { useState } from "react";
import type { CryptoTradeExecutionResponse } from "../types/portfolio";

type UseCryptoTradeOptions = {
  portfolioId?: number | null;
  onSuccess?: () => void;
};

export function useCryptoTrade({ portfolioId, onSuccess }: UseCryptoTradeOptions = {}) {
  const [symbol, setSymbol] = useState("BTC/USD");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetStatus = () => {
    setError(null);
    setSuccess(null);
  };

  async function handleSubmitTrade(e?: React.FormEvent) {
    if (e) e.preventDefault();
    resetStatus();

    const symbolTrimmed = symbol.trim();
    const quantityTrimmed = quantity.trim();

    if (!symbolTrimmed) {
      setError("Crypto pair is required.");
      return;
    }

    const qtyNum = parseFloat(quantityTrimmed);
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }

    const body: Record<string, any> = {
      symbol: symbolTrimmed,
      side: "BUY",
      quantity: qtyNum,
      order_type: "MARKET",
      fees: 0,
    };

    if (portfolioId != null) {
      body.portfolio_id = portfolioId;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/crypto/trade/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as CryptoTradeExecutionResponse;

      if (!res.ok || json.error) {
        setError(json.error || "Crypto trade failed.");
      } else if (json.trade) {
        const price = parseFloat(json.trade.price);
        setSuccess(
          `Bought ${json.trade.quantity} ${json.trade.symbol} @ $${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        );
        setQuantity("");
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err?.message || "Crypto trade failed.");
    } finally {
      setLoading(false);
    }
  }

  return {
    symbol,
    setSymbol,
    quantity,
    setQuantity,
    loading,
    error,
    success,
    handleSubmitTrade,
  };
}

export function useSellCrypto({ portfolioId, onSuccess }: UseCryptoTradeOptions = {}) {
  const [sellSymbol, setSellSymbol] = useState<string | null>(null);
  const [sellQuantity, setSellQuantity] = useState<number>(0);
  const [maxQuantity, setMaxQuantity] = useState<number>(0);
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
    setMaxQuantity(quantity);
  }

  function clearSelection() {
    resetStatus();
    setSellSymbol(null);
    setSellQuantity(0);
    setMaxQuantity(0);
  }

  async function handleSellCrypto(symbol: string, quantity: number) {
    resetStatus();

    if (quantity <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    const body: Record<string, any> = {
      symbol,
      side: "SELL",
      quantity,
      order_type: "MARKET",
      fees: 0,
    };

    if (portfolioId != null) {
      body.portfolio_id = portfolioId;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/crypto/trade/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as CryptoTradeExecutionResponse;

      if (!res.ok || json.error) {
        setError(json.error || "Sell failed.");
      } else if (json.trade) {
        const price = parseFloat(json.trade.price);
        setSuccess(
          `Sold ${json.trade.quantity} ${json.trade.symbol} @ $${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        );
        setSellSymbol(null);
        setSellQuantity(0);
        setMaxQuantity(0);
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
    maxQuantity,
    loading,
    error,
    success,
    handleSellCrypto,
    selectPosition,
    clearSelection,
  };
}