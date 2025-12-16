import { useState, useEffect, useCallback } from "react";
import type { CryptoAsset, CryptoAssetApi, CryptoAssetsApiResponse } from "../types/portfolio";

type UseCryptoAssetsResult = {
  assets: CryptoAsset[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

function mapApiToAsset(api: CryptoAssetApi): CryptoAsset {
  return {
    id: api.id,
    symbol: api.symbol,
    name: api.name,
    status: api.status,
    tradable: api.tradable,
    min_order_size: parseFloat(api.min_order_size),
    min_trade_increment: parseFloat(api.min_trade_increment),
    price_increment: parseFloat(api.price_increment),
  };
}

export function useCryptoAssets(): UseCryptoAssetsResult {
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/crypto/assets/", {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });

      const json = (await res.json()) as CryptoAssetsApiResponse;

      if (!res.ok || json.error) {
        setError(json.error || "Failed to fetch crypto assets.");
        setAssets([]);
      } else {
        const mapped = json.assets
          .filter((a) => a.tradable)
          .map(mapApiToAsset)
          .sort((a, b) => a.symbol.localeCompare(b.symbol));
        setAssets(mapped);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch crypto assets.");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return { assets, loading, error, refetch: fetchAssets };
}