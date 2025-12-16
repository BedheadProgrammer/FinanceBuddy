import { useState, useCallback } from "react";
import type {
  CryptoPosition,
  CryptoPositionApi,
  CryptoPositionsApiResponse,
} from "../types/portfolio";

type UseCryptoPositionsResult = {
  positions: CryptoPosition[];
  loading: boolean;
  error: string | null;
  fetchPositions: (portfolioId: number) => Promise<void>;
};

function mapApiToPosition(api: CryptoPositionApi): CryptoPosition {
  return {
    symbol: api.symbol,
    quantity: parseFloat(api.quantity),
    avg_cost: parseFloat(api.avg_cost),
    market_price: api.market_price !== null ? parseFloat(api.market_price) : null,
    market_value: api.market_value !== null ? parseFloat(api.market_value) : null,
    unrealized_pnl: api.unrealized_pnl !== null ? parseFloat(api.unrealized_pnl) : null,
  };
}

export function useCryptoPositions(): UseCryptoPositionsResult {
  const [positions, setPositions] = useState<CryptoPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async (portfolioId: number) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/crypto/positions/?portfolio_id=${portfolioId}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });

      const json = (await res.json()) as CryptoPositionsApiResponse;

      if (!res.ok || json.error) {
        setError(json.error || "Failed to fetch crypto positions.");
        setPositions([]);
      } else {
        setPositions(json.positions.map(mapApiToPosition));
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch crypto positions.");
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { positions, loading, error, fetchPositions };
}