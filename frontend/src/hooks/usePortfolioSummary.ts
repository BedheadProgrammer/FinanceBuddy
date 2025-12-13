// frontend/src/hooks/usePortfolioSummary.ts

import { useState, useEffect, useCallback } from "react";
import type { PortfolioSummaryPayload } from "../types/portfolio";

type UsePortfolioSummaryOptions = {
  portfolioId?: number | null;
};

export function usePortfolioSummary(
  options: UsePortfolioSummaryOptions = {},
) {
  const { portfolioId } = options;

  const [summary, setSummary] = useState<PortfolioSummaryPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setError(null);
    setLoading(true);

    const url =
      portfolioId != null
        ? `/api/portfolio/summary/?portfolio_id=${portfolioId}`
        : "/api/portfolio/summary/";

    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });

      const json = (await res.json()) as PortfolioSummaryPayload & {
        error?: string;
      };

      if (!res.ok || (json as any).error) {
        setError(json.error || (json as any).error || "Failed to load summary.");
        setSummary(null);
      } else {
        setSummary(json);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load summary.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}
