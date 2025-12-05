import { useState, useCallback } from "react";
import type {
  OptionPosition,
  OptionPositionsApiResponse,
} from "../types/portfolio";


export function useOptionPositions() {
  const [positions, setPositions] = useState<OptionPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async (portfolioId: number) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/options/positions/?portfolio_id=${portfolioId}`, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const json = (await res.json()) as OptionPositionsApiResponse;
      if (!res.ok || (json as any).error) {
        const msg = json.error || (json as any).error || "Failed to load option positions.";
        setError(msg);
        setPositions([]);
      } else {
        const mapped: OptionPosition[] = json.positions.map((p) => ({
          id: p.id,
          contract_id: p.contract_id,
          underlying_symbol: p.underlying_symbol,
          option_side: p.option_side,
          option_style: p.option_style,
          strike: Number(p.strike),
          expiry: p.expiry,
          multiplier: p.multiplier,
          quantity: Number(p.quantity),
          avg_cost: Number(p.avg_cost),
        }));
        setPositions(mapped);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load option positions.");
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    positions,
    loading,
    error,
    fetchPositions,
  };
}
