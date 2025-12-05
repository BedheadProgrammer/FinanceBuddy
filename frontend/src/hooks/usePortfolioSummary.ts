import { useState, useEffect, useCallback } from "react";
import type { PortfolioSummaryPayload } from "../types/portfolio";

export function usePortfolioSummary() {
  const [summary, setSummary] = useState<PortfolioSummaryPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/portfolio/summary/", {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = (json as any).error || "Failed to load portfolio.";
        setError(msg);
        setSummary(null);
      } else {
        setSummary(json as PortfolioSummaryPayload);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load portfolio.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}
