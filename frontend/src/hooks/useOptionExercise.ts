import { useState } from "react";
import type {
  OptionPosition,
  OptionExerciseResponse,
  PortfolioSummaryPayload,
} from "../types/portfolio";

type UseOptionExerciseOptions = {
  onSuccess?: (portfolioId: number) => void;
};

export function useOptionExercise({ onSuccess }: UseOptionExerciseOptions = {}) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleExerciseOption(
    pos: OptionPosition,
    summary: PortfolioSummaryPayload | null
  ) {
    if (!summary) {
      setError("Portfolio is not loaded yet.");
      return;
    }

    const underlyingSymbol = pos.underlying_symbol.toUpperCase();
    const stockPos = summary.positions.find(
      (p) => p.symbol.toUpperCase() === underlyingSymbol
    );
    const underlyingPrice = stockPos?.market_price;

    if (
      underlyingPrice === null ||
      underlyingPrice === undefined ||
      !Number.isFinite(underlyingPrice)
    ) {
      setError(
        `No valid market price available for ${underlyingSymbol}; cannot exercise this contract.`
      );
      return;
    }

    if (pos.quantity <= 0) {
      setError("No contracts available to exercise for this position.");
      return;
    }

    setError(null);
    setSuccess(null);
    setLoadingId(pos.id);

    try {
      const body = {
        portfolio_id: summary.portfolio.id,
        symbol: underlyingSymbol,
        option_side: pos.option_side,
        option_style: pos.option_style,
        strike: pos.strike,
        expiry: pos.expiry,
        quantity: pos.quantity,
        underlying_price: underlyingPrice,
      };

      const res = await fetch("/api/options/exercise/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as OptionExerciseResponse;

      if (!res.ok || (json as any).error) {
        const msg = json.error || (json as any).error || "Option exercise failed.";
        setError(msg);
      } else {
        const ex = json.exercise;
        const contract = json.contract;
        const intrinsicPer = Number(ex.intrinsic_value_per_contract);
        const intrinsicTotal = Number(ex.intrinsic_value_total);
        setSuccess(
          `Exercised ${Number(ex.quantity)} ${contract.underlying_symbol} ${contract.option_side} @ strike $${Number(
            contract.strike
          ).toFixed(2)} for intrinsic $${intrinsicPer.toFixed(
            2
          )} ($${intrinsicTotal.toFixed(2)} total)`
        );
        onSuccess?.(summary.portfolio.id);
      }
    } catch (err: any) {
      setError(err?.message || "Option exercise failed.");
    } finally {
      setLoadingId(null);
    }
  }

  return {
    loadingId,
    error,
    success,
    handleExerciseOption,
  };
}
