// Page: European option pricer with Tailwind layout and chart navigation.
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

type EuroApiResponse = {
  inputs: {
    symbol: string;
    side: "CALL" | "PUT";
    S: number;
    K: number;
    r: number;
    q?: number;
    sigma: number;
    T: number;
    as_of: string;
    expiry: string;
  };
  price_and_greeks: {
    fair_value: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  };
  error?: string;
};

export default function EuroOptionsPricing() {
  const [symbol, setSymbol] = useState("AAPL");
  const [side, setSide] = useState<"CALL" | "PUT">("CALL");
  const [strike, setStrike] = useState("200");
  const [expiry, setExpiry] = useState("2026-01-17");
  const [volMode, setVolMode] = useState<"HIST" | "IV">("HIST");
  const [marketOptionPrice, setMarketOptionPrice] = useState("");
  const [constantVol, setConstantVol] = useState("");
  const [useQL, setUseQL] = useState(false);
  const [data, setData] = useState<EuroApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const params = new URLSearchParams({
      symbol: symbol.trim().toUpperCase(),
      side,
      strike: strike.trim(),
      expiry,
      vol_mode: volMode,
    });
    if (volMode === "IV" && marketOptionPrice.trim()) {
      params.set("market_option_price", marketOptionPrice.trim());
    }
    if (constantVol.trim()) {
      params.set("constant_vol", constantVol.trim());
    }
    if (useQL) {
      params.set("use_quantlib_daycount", "true");
    }

    const res = await fetch(`/api/euro/price/?${params.toString()}`, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    const json = (await res.json()) as EuroApiResponse;
    setLoading(false);

    if (!res.ok || json.error) {
      setError(json.error || "Request failed.");
      setData(null);
      return;
    }

    setData(json);
  };

  const handleViewChart = () => {
    if (!data) return;

    const params = new URLSearchParams({
      symbol: symbol.trim().toUpperCase(),
      side,
      strike: strike.trim(),
      expiry,
      vol_mode: volMode,
    });
    if (marketOptionPrice.trim()) params.set("market_option_price", marketOptionPrice.trim());
    if (constantVol.trim()) params.set("constant_vol", constantVol.trim());
    if (useQL) params.set("use_quantlib_daycount", "true");

    navigate(`/tools/euro/greeks?${params.toString()}`, {
      state: { response: data },
    });
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">European Options Pricer</h1>
        <p className="text-sm text-white/60 mt-2 max-w-xl">
          Calculate fair value and Greeks using your Django backend.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white/5 border border-white/5 p-5 space-y-5"
        >
          <div>
            <h2 className="text-base font-semibold mb-1">Inputs</h2>
            <p className="text-xs text-white/45">
              Symbol, option type, strike, expiry, and how to source volatility.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Symbol
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Option Type
              <select
                value={side}
                onChange={(e) => setSide(e.target.value as "CALL" | "PUT")}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
                <option value="CALL">Call</option>
                <option value="PUT">Put</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Strike Price
              <input
                value={strike}
                onChange={(e) => setStrike(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Expiration Date
              <input
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Volatility Mode
              <select
                value={volMode}
                onChange={(e) => setVolMode(e.target.value as "HIST" | "IV")}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
                <option value="HIST">Historical Volatility</option>
                <option value="IV">Implied Volatility (needs market price)</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Constant σ (optional)
              <input
                value={constantVol}
                onChange={(e) => setConstantVol(e.target.value)}
                placeholder="e.g. 0.25"
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>

          {volMode === "IV" && (
            <label className="flex flex-col gap-1 text-sm">
              Market Option Price
              <input
                value={marketOptionPrice}
                onChange={(e) => setMarketOptionPrice(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          )}

          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={useQL}
              onChange={(e) => setUseQL(e.target.checked)}
              className="accent-white"
            />
            Use QuantLib day count convention
          </label>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? "Calculating…" : "Calculate Option Price & Greeks"}
          </button>
        </form>

        <div className="rounded-2xl bg-white/5 border border-white/5 p-5">
          <h2 className="text-base font-semibold mb-4">Result</h2>
          {!data ? (
            <p className="text-sm text-white/50">Run the calculator to see fair value and Greeks.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/40 mb-1">Fair value</p>
                  <p className="text-3xl font-bold">
                    ${data.price_and_greeks.fair_value.toFixed(2)}
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    {data.inputs.side} on {data.inputs.symbol} @ {data.inputs.K}
                  </p>
                </div>
                <button
                  onClick={handleViewChart}
                  className="text-xs px-3 py-1.5 rounded-full bg-black/30 border border-white/10 hover:bg-black/60"
                >
                  View Greeks chart
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
                <div className="bg-black/30 rounded-lg p-3">
                  <p className="text-white/40 text-xs">Delta</p>
                  <p className="text-lg font-semibold">
                    {data.price_and_greeks.delta.toFixed(4)}
                  </p>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <p className="text-white/40 text-xs">Gamma</p>
                  <p className="text-lg font-semibold">
                    {data.price_and_greeks.gamma.toFixed(6)}
                  </p>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <p className="text-white/40 text-xs">Theta</p>
                  <p className="text-lg font-semibold">
                    {data.price_and_greeks.theta.toFixed(4)}
                  </p>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <p className="text-white/40 text-xs">Vega</p>
                  <p className="text-lg font-semibold">
                    {data.price_and_greeks.vega.toFixed(4)}
                  </p>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <p className="text-white/40 text-xs">Rho</p>
                  <p className="text-lg font-semibold">
                    {data.price_and_greeks.rho.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
