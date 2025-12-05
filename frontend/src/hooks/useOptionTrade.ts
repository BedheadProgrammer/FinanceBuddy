import { useState } from "react";
import type {
  OptionSide,
  OptionStyle,
  TradeSide,
  OptionTradeResponse,
  OptionPosition,
  PortfolioSummaryPayload,
} from "../types/portfolio";


type UseOptionTradeOptions = {
  onSuccess?: (portfolioId: number) => void;
};

export function useOptionTrade({ onSuccess }: UseOptionTradeOptions = {}) {
  const [symbol, setSymbol] = useState("AAPL");
  const [side, setSide] = useState<OptionSide>("CALL");
  const [style, setStyle] = useState<OptionStyle>("AMERICAN");
  const [strike, setStrike] = useState("");
  const [expiry, setExpiry] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmitTrade(e: React.FormEvent, summary: PortfolioSummaryPayload | null) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!summary) {
      setError("Portfolio is not loaded yet.");
      return;
    }

    const symbolTrimmed = symbol.trim();
    const quantityTrimmed = quantity.trim();
    const strikeTrimmed = strike.trim();
    const expiryTrimmed = expiry.trim();

    if (!symbolTrimmed || !strikeTrimmed || !expiryTrimmed || !quantityTrimmed) {
      setError(
        "Underlying symbol, strike, expiry date, and contracts quantity are required."
      );
      return;
    }

    const quantityNum = Number(quantityTrimmed);
    const strikeNum = Number(strikeTrimmed);

    if (!Number.isFinite(strikeNum) || strikeNum <= 0) {
      setError("Strike must be a positive number.");
      return;
    }

    if (!Number.isFinite(quantityNum) || quantityNum <= 0) {
      setError("Contracts must be a positive number.");
      return;
    }

    setLoading(true);
    try {
      const symbolUpper = symbolTrimmed.toUpperCase();

      const params = new URLSearchParams({
        symbol: symbolUpper,
        side: side,
        strike: strikeTrimmed,
        expiry: expiryTrimmed,
      });

      const quoteUrl =
        style === "EUROPEAN"
          ? `/api/euro/price/?${params.toString()}`
          : `/api/american/price/?${params.toString()}`;

      const quoteResp = await fetch(quoteUrl, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const quoteJson = await quoteResp.json();

      if (!quoteResp.ok || (quoteJson as any).error) {
        const msg = (quoteJson as any).error || "Failed to calculate option fair value.";
        setError(msg);
        return;
      }

      let fairPrice: number;

      if (style === "EUROPEAN") {
        const greeks = (quoteJson as any).price_and_greeks;
        fairPrice = Number(greeks?.fair_value);
      } else {
        const americanResult = (quoteJson as any).american_result;
        fairPrice = Number(americanResult?.american_price);
      }

      if (!Number.isFinite(fairPrice) || fairPrice <= 0) {
        setError("Could not compute a valid fair value for this option.");
        return;
      }

      const body = {
        portfolio_id: summary.portfolio.id,
        symbol: symbolUpper,
        option_side: side,
        option_style: style,
        strike: strikeNum,
        expiry: expiryTrimmed,
        quantity: quantityNum,
        price: fairPrice,
        side: "BUY" as TradeSide,
      };

      const res = await fetch("/api/options/trade/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as OptionTradeResponse;

      if (!res.ok || (json as any).error) {
        const msg = json.error || (json as any).error || "Options trade failed.";
        setError(msg);
      } else {
        const contract = json.contract;
        const trade = json.trade;
        setSuccess(
          `Bought ${Number(trade.quantity)} ${contract.underlying_symbol} ${contract.option_side} @ strike $${Number(
            contract.strike
          ).toFixed(2)} exp ${contract.expiry}`
        );
        setQuantity("1");
        onSuccess?.(json.portfolio.id);
      }
    } catch (err: any) {
      setError(err?.message || "Options trade failed.");
    } finally {
      setLoading(false);
    }
  }

  return {
    symbol,
    setSymbol,
    side,
    setSide,
    style,
    setStyle,
    strike,
    setStrike,
    expiry,
    setExpiry,
    quantity,
    setQuantity,
    loading,
    error,
    success,
    handleSubmitTrade,
  };
}

type UseSellOptionOptions = {
  onSuccess?: (portfolioId: number) => void;
};

export function useSellOption({ onSuccess }: UseSellOptionOptions = {}) {
  const [sellOptionId, setSellOptionId] = useState<number | null>(null);
  const [sellQuantity, setSellQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSellOption(
    pos: OptionPosition,
    quantity: number,
    summary: PortfolioSummaryPayload | null
  ) {
    setError(null);
    setSuccess(null);

    if (!summary) {
      setError("Portfolio is not loaded yet.");
      return;
    }

    if (quantity <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    setLoading(true);
    try {
      const symbolUpper = pos.underlying_symbol.toUpperCase();

      const params = new URLSearchParams({
        symbol: symbolUpper,
        side: pos.option_side,
        strike: pos.strike.toString(),
        expiry: pos.expiry,
      });

      const quoteUrl =
        pos.option_style === "EUROPEAN"
          ? `/api/euro/price/?${params.toString()}`
          : `/api/american/price/?${params.toString()}`;

      const quoteResp = await fetch(quoteUrl, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const quoteJson = await quoteResp.json();

      if (!quoteResp.ok || (quoteJson as any).error) {
        const msg = (quoteJson as any).error || "Failed to calculate option fair value.";
        setError(msg);
        return;
      }

      let fairPrice: number;

      if (pos.option_style === "EUROPEAN") {
        const greeks = (quoteJson as any).price_and_greeks;
        fairPrice = Number(greeks?.fair_value);
      } else {
        const americanResult = (quoteJson as any).american_result;
        fairPrice = Number(americanResult?.american_price);
      }

      if (!Number.isFinite(fairPrice) || fairPrice <= 0) {
        setError("Could not compute a valid fair value for this option.");
        return;
      }

      const body = {
        portfolio_id: summary.portfolio.id,
        symbol: symbolUpper,
        option_side: pos.option_side,
        option_style: pos.option_style,
        strike: pos.strike,
        expiry: pos.expiry,
        quantity: quantity,
        price: fairPrice,
        side: "SELL" as TradeSide,
      };

      const res = await fetch("/api/options/trade/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as OptionTradeResponse;

      if (!res.ok || (json as any).error) {
        const msg = json.error || (json as any).error || "Options sell failed.";
        setError(msg);
      } else {
        const contract = json.contract;
        const trade = json.trade;
        setSuccess(
          `Sold ${Number(trade.quantity)} ${contract.underlying_symbol} ${contract.option_side} @ strike $${Number(
            contract.strike
          ).toFixed(2)} exp ${contract.expiry}`
        );
        setSellOptionId(null);
        setSellQuantity(0);
        onSuccess?.(summary.portfolio.id);
      }
    } catch (err: any) {
      setError(err?.message || "Options sell failed.");
    } finally {
      setLoading(false);
    }
  }

  const selectPosition = (id: number, maxQty: number) => {
    setSellOptionId(id);
    setSellQuantity(maxQty);
    setError(null);
    setSuccess(null);
  };

  const clearSelection = () => {
    setSellOptionId(null);
    setSellQuantity(0);
  };

  return {
    sellOptionId,
    sellQuantity,
    setSellQuantity,
    loading,
    error,
    success,
    handleSellOption,
    selectPosition,
    clearSelection,
  };
}
