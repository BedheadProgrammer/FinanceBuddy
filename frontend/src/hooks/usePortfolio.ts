// frontend/src/hooks/usePortfolios.ts

import { useCallback, useState } from "react";
import type {
  Portfolio,
  PortfolioListResponse,
  CreatePortfolioInput,
  CreatePortfolioResponse,
  UpdatePortfolioResponse,
  DeletePortfolioResponse,
  SetDefaultPortfolioResponse,
} from "../types/portfolio";

interface UsePortfoliosReturn {
  portfolios: Portfolio[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createPortfolio: (input: CreatePortfolioInput) => Promise<Portfolio | null>;
  renamePortfolio: (id: number, name: string) => Promise<Portfolio | null>;
  deletePortfolio: (id: number) => Promise<boolean>;
  setDefaultPortfolio: (id: number) => Promise<Portfolio | null>;
}

export function usePortfolios(): UsePortfoliosReturn {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/portfolios/", {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const json = (await res.json()) as PortfolioListResponse & { error?: string };

      if (!res.ok || json.error) {
        setError(json.error || "Failed to load portfolios.");
        return;
      }

      setPortfolios(json.portfolios);
    } catch (err: any) {
      setError(err?.message || "Failed to load portfolios.");
    } finally {
      setLoading(false);
    }
  }, []);

  const createPortfolio = useCallback(
    async (input: CreatePortfolioInput): Promise<Portfolio | null> => {
      setError(null);
      try {
        const res = await fetch("/api/portfolios/create/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify(input),
        });

        const json = (await res.json()) as CreatePortfolioResponse;

        if (!res.ok || json.error) {
          setError(json.error || "Failed to create portfolio.");
          return null;
        }

        setPortfolios((prev) => [...prev, json.portfolio]);
        return json.portfolio;
      } catch (err: any) {
        setError(err?.message || "Failed to create portfolio.");
        return null;
      }
    },
    [],
  );

  const renamePortfolio = useCallback(
    async (id: number, name: string): Promise<Portfolio | null> => {
      setError(null);
      try {
        const res = await fetch(`/api/portfolios/${id}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({ name }),
        });

        const json = (await res.json()) as UpdatePortfolioResponse;

        if (!res.ok || json.error) {
          setError(json.error || "Failed to rename portfolio.");
          return null;
        }

        setPortfolios((prev) =>
          prev.map((p) => (p.id === id ? json.portfolio : p)),
        );
        return json.portfolio;
      } catch (err: any) {
        setError(err?.message || "Failed to rename portfolio.");
        return null;
      }
    },
    [],
  );

  const deletePortfolio = useCallback(
    async (id: number): Promise<boolean> => {
      setError(null);
      try {
        const res = await fetch(`/api/portfolios/${id}/`, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
          credentials: "same-origin",
        });

        const json = (await res.json()) as DeletePortfolioResponse;

        if (!res.ok || json.error) {
          setError(json.error || "Failed to delete portfolio.");
          return false;
        }

        setPortfolios((prev) => prev.filter((p) => p.id !== id));
        return true;
      } catch (err: any) {
        setError(err?.message || "Failed to delete portfolio.");
        return false;
      }
    },
    [],
  );

  const setDefaultPortfolio = useCallback(
    async (id: number): Promise<Portfolio | null> => {
      setError(null);
      try {
        const res = await fetch(`/api/portfolios/${id}/set_default/`, {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          credentials: "same-origin",
        });

        const json = (await res.json()) as SetDefaultPortfolioResponse;

        if (!res.ok || json.error) {
          setError(json.error || "Failed to set default portfolio.");
          return null;
        }

        setPortfolios((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...json.portfolio }
              : { ...p, is_default: false },
          ),
        );

        return json.portfolio;
      } catch (err: any) {
        setError(err?.message || "Failed to set default portfolio.");
        return null;
      }
    },
    [],
  );

  return {
    portfolios,
    loading,
    error,
    refresh,
    createPortfolio,
    renamePortfolio,
    deletePortfolio,
    setDefaultPortfolio,
  };
}
