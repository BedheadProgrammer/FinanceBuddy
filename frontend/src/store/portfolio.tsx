import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type {
  Portfolio,
  CreatePortfolioInput,
  UpdatePortfolioInput,
  PortfolioListResponse,
  CreatePortfolioResponse,
  DeletePortfolioResponse,
  SetDefaultPortfolioResponse,
  UpdatePortfolioResponse,
} from "../types/portfolio";

const ACTIVE_PORTFOLIO_KEY = "financebuddy_active_portfolio_id";

interface PortfolioContextValue {
  portfolios: Portfolio[];
  activePortfolioId: number | null;
  activePortfolio: Portfolio | null;
  loading: boolean;
  error: string | null;
  setActivePortfolioId: (id: number) => void;
  refreshPortfolios: () => Promise<void>;
  createPortfolio: (input: CreatePortfolioInput) => Promise<Portfolio | null>;
  updatePortfolio: (id: number, input: UpdatePortfolioInput) => Promise<Portfolio | null>;
  deletePortfolio: (id: number) => Promise<boolean>;
  setDefaultPortfolio: (id: number) => Promise<Portfolio | null>;
  isActiveDefault: boolean;
}

const PortfolioContext = createContext<PortfolioContextValue | undefined>(undefined);

interface PortfolioProviderProps {
  children: ReactNode;
}

export function PortfolioProvider({ children }: PortfolioProviderProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activePortfolioId, setActivePortfolioIdState] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ACTIVE_PORTFOLIO_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
    }
    return null;
  });

  const setActivePortfolioId = useCallback((id: number) => {
    setActivePortfolioIdState(id);
    localStorage.setItem(ACTIVE_PORTFOLIO_KEY, String(id));
  }, []);

  const activePortfolio = useMemo((): Portfolio | null => {
    if (activePortfolioId === null) {
      return null;
    }
    return portfolios.find((p: Portfolio) => p.id === activePortfolioId) ?? null;
  }, [activePortfolioId, portfolios]);

  const fetchPortfolios = useCallback(async (includeStats = false) => {
    setError(null);
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (includeStats) {
        params.set("include_stats", "true");
      }

      const url = `/api/portfolios/${params.toString() ? `?${params.toString()}` : ""}`;

      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });

      const json = (await res.json()) as PortfolioListResponse & { error?: string };

      if (!res.ok || json.error) {
        setError(json.error || "Failed to load portfolios");
        setPortfolios([]);
      } else {
        setPortfolios(json.portfolios);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load portfolios";
      setError(message);
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPortfolios = useCallback(async () => {
    await fetchPortfolios(true);
  }, [fetchPortfolios]);

  const createPortfolio = useCallback(async (input: CreatePortfolioInput): Promise<Portfolio | null> => {
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
        setError(json.error || "Failed to create portfolio");
        return null;
      }

      setPortfolios((prev: Portfolio[]) => {
        if (json.portfolio.is_default) {
          return [
            json.portfolio,
            ...prev.map((p: Portfolio) => ({ ...p, is_default: false })),
          ];
        }
        return [...prev, json.portfolio];
      });

      if (json.portfolio.is_default || portfolios.length === 0) {
        setActivePortfolioId(json.portfolio.id);
      }

      return json.portfolio;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create portfolio";
      setError(message);
      return null;
    }
  }, [portfolios.length, setActivePortfolioId]);

  const updatePortfolio = useCallback(async (
    id: number,
    input: UpdatePortfolioInput
  ): Promise<Portfolio | null> => {
    setError(null);

    try {
      const res = await fetch(`/api/portfolios/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(input),
      });

      const json = (await res.json()) as UpdatePortfolioResponse;

      if (!res.ok || json.error) {
        setError(json.error || "Failed to update portfolio");
        return null;
      }

      setPortfolios((prev: Portfolio[]) =>
        prev.map((p: Portfolio) => (p.id === id ? json.portfolio : p))
      );

      return json.portfolio;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update portfolio";
      setError(message);
      return null;
    }
  }, []);

  const deletePortfolio = useCallback(async (id: number): Promise<boolean> => {
    setError(null);

    try {
      const res = await fetch(`/api/portfolios/${id}/`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });

      const json = (await res.json()) as DeletePortfolioResponse;

      if (!res.ok || json.error) {
        setError(json.error || "Failed to delete portfolio");
        return false;
      }

      setPortfolios((prev: Portfolio[]) => {
        const filtered = prev.filter((p: Portfolio) => p.id !== id);

        if (json.new_default_id) {
          return filtered.map((p: Portfolio) => ({
            ...p,
            is_default: p.id === json.new_default_id,
          }));
        }

        return filtered;
      });

      if (id === activePortfolioId) {
        if (json.new_default_id) {
          setActivePortfolioId(json.new_default_id);
        } else {
          const remaining = portfolios.filter((p: Portfolio) => p.id !== id);
          if (remaining.length > 0) {
            setActivePortfolioId(remaining[0].id);
          } else {
            setActivePortfolioIdState(null);
            localStorage.removeItem(ACTIVE_PORTFOLIO_KEY);
          }
        }
      }

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete portfolio";
      setError(message);
      return false;
    }
  }, [activePortfolioId, portfolios, setActivePortfolioId]);

  const setDefaultPortfolio = useCallback(async (id: number): Promise<Portfolio | null> => {
    setError(null);

    try {
      const res = await fetch(`/api/portfolios/${id}/set_default/`, {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });

      const json = (await res.json()) as SetDefaultPortfolioResponse;

      if (!res.ok || json.error) {
        setError(json.error || "Failed to set default portfolio");
        return null;
      }

      setPortfolios((prev: Portfolio[]) =>
        prev.map((p: Portfolio) => ({
          ...p,
          is_default: p.id === id,
        }))
      );

      return json.portfolio;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to set default portfolio";
      setError(message);
      return null;
    }
  }, []);

  const isActiveDefault = useMemo(() => {
    return activePortfolio?.is_default ?? false;
  }, [activePortfolio]);

  useEffect(() => {
    refreshPortfolios();
  }, []);

  useEffect(() => {
    if (portfolios.length === 0) {
      return;
    }

    if (activePortfolioId === null) {
      const defaultPortfolio = portfolios.find((p: Portfolio) => p.is_default);
      if (defaultPortfolio) {
        setActivePortfolioId(defaultPortfolio.id);
      } else {
        setActivePortfolioId(portfolios[0].id);
      }
      return;
    }

    const exists = portfolios.some((p: Portfolio) => p.id === activePortfolioId);
    if (!exists) {
      const defaultPortfolio = portfolios.find((p: Portfolio) => p.is_default);
      if (defaultPortfolio) {
        setActivePortfolioId(defaultPortfolio.id);
      } else if (portfolios.length > 0) {
        setActivePortfolioId(portfolios[0].id);
      }
    }
  }, [portfolios, activePortfolioId, setActivePortfolioId]);

  const value = useMemo<PortfolioContextValue>(
    () => ({
      portfolios,
      activePortfolioId,
      activePortfolio,
      loading,
      error,
      setActivePortfolioId,
      refreshPortfolios,
      createPortfolio,
      updatePortfolio,
      deletePortfolio,
      setDefaultPortfolio,
      isActiveDefault,
    }),
    [
      portfolios,
      activePortfolioId,
      activePortfolio,
      loading,
      error,
      setActivePortfolioId,
      refreshPortfolios,
      createPortfolio,
      updatePortfolio,
      deletePortfolio,
      setDefaultPortfolio,
      isActiveDefault,
    ]
  );

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolioContext() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error("usePortfolioContext must be used within PortfolioProvider");
  }
  return ctx;
}