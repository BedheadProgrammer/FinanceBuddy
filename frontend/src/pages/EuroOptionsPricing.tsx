import React, { useMemo, useState } from "react";

type PriceGreeks = { fair_value: number; delta: number; gamma: number; theta: number; vega: number; rho: number; };
type Inputs = {
  S: number; K: number; r: number; q: number; sigma: number; T: number;
  d1: number; d2: number; side: "CALL"|"PUT"; symbol: string; as_of: string; expiry: string;
};
type ApiResponse = { inputs: Inputs; price_and_greeks: PriceGreeks } | { error: string };
type AmericanResult = { 
  american_price: number; 
  european_price: number; 
  early_exercise_premium: number; 
  critical_price: number; 
};
type AmericanApiResponse = { inputs: Inputs; american_result: AmericanResult } | { error: string };

export default function EuroOptionsPricing() {
  const todayISO = useMemo(() => new Date().toISOString().slice(0,10), []);
  
  // European Option State
  const [symbol, setSymbol] = useState("AAPL");
  const [side, setSide] = useState<"CALL"|"PUT">("CALL");
  const [strike, setStrike] = useState("200");
  const [expiry, setExpiry] = useState("2026-01-17");
  const [volMode, setVolMode] = useState<"HIST"|"IV">("HIST");
  const [marketOptionPrice, setMarketOptionPrice] = useState("");
  const [constantVol, setConstantVol] = useState("");
  const [useQL, setUseQL] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [data, setData] = useState<ApiResponse>();

  // American Option State
  const [amSymbol, setAmSymbol] = useState("AAPL");
  const [amSide, setAmSide] = useState<"CALL"|"PUT">("CALL");
  const [amStrike, setAmStrike] = useState("200");
  const [amExpiry, setAmExpiry] = useState("2026-01-17");
  const [amVolMode, setAmVolMode] = useState<"HIST"|"IV">("HIST");
  const [amMarketOptionPrice, setAmMarketOptionPrice] = useState("");
  const [amConstantVol, setAmConstantVol] = useState("");
  const [amUseQL, setAmUseQL] = useState(false);
  const [amLoading, setAmLoading] = useState(false);
  const [amError, setAmError] = useState<string>();
  const [amData, setAmData] = useState<AmericanApiResponse>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined); setData(undefined); setLoading(true);

    const params = new URLSearchParams({
      symbol: symbol.trim().toUpperCase(), side, strike: strike.trim(), expiry, vol_mode: volMode
    });
    if (volMode === "IV" && marketOptionPrice.trim()) params.set("market_option_price", marketOptionPrice.trim());
    if (constantVol.trim()) params.set("constant_vol", constantVol.trim());
    if (useQL) params.set("use_quantlib_daycount", "true");

    try {
      // [FIX] use API mount: /api/euro/  (works in dev via Vite proxy and in prod via reverse-proxy)
     const res = await fetch(`/api/euro/price/?${params.toString()}`, {
          headers: { "Accept": "application/json" },
          credentials: "same-origin",
        });
      const json = await res.json();
      if (!res.ok || (json as any).error) {
        setError((json as any).error || `HTTP ${res.status}`);
      } else {
        setData(json as ApiResponse);
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function submitAmerican(e: React.FormEvent) {
    e.preventDefault();
    setAmError(undefined); setAmData(undefined); setAmLoading(true);

    const params = new URLSearchParams({
      symbol: amSymbol.trim().toUpperCase(), 
      side: amSide, 
      strike: amStrike.trim(), 
      expiry: amExpiry, 
      vol_mode: amVolMode
    });
    if (amVolMode === "IV" && amMarketOptionPrice.trim()) params.set("market_option_price", amMarketOptionPrice.trim());
    if (amConstantVol.trim()) params.set("constant_vol", amConstantVol.trim());
    if (amUseQL) params.set("use_quantlib_daycount", "true");

    try {
      const res = await fetch(`/api/american/price/?${params.toString()}`, {
        headers: { "Accept": "application/json" },
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok || (json as any).error) {
        setAmError((json as any).error || `HTTP ${res.status}`);
      } else {
        setAmData(json as AmericanApiResponse);
      }
    } catch (err: any) {
      setAmError(err?.message || String(err));
    } finally {
      setAmLoading(false);
    }
  }

  const validIV = volMode === "IV" ? marketOptionPrice.trim().length > 0 : true;
  const validAmIV = amVolMode === "IV" ? amMarketOptionPrice.trim().length > 0 : true;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">European Option — Price &amp; Greeks</h1>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <div><label className="block font-medium">Symbol</label>
          <input className="border p-2 w-full" value={symbol} onChange={e=>setSymbol(e.target.value)} /></div>
        <div><label className="block font-medium">Side</label>
          <select className="border p-2 w-full" value={side} onChange={e=>setSide(e.target.value as any)}>
            <option value="CALL">CALL</option><option value="PUT">PUT</option></select></div>
        <div><label className="block font-medium">Strike</label>
          <input className="border p-2 w-full" inputMode="decimal" value={strike} onChange={e=>setStrike(e.target.value)} /></div>
        <div><label className="block font-medium">Expiry</label>
          <input className="border p-2 w-full" type="date" value={expiry} min={todayISO} onChange={e=>setExpiry(e.target.value)} /></div>
        <div><label className="block font-medium">Volatility mode</label>
          <select className="border p-2 w-full" value={volMode} onChange={e=>setVolMode(e.target.value as any)}>
            <option value="HIST">Historical volatility</option><option value="IV">Implied volatility</option></select></div>
        {volMode === "IV" && (
          <div><label className="block font-medium">Market option price</label>
            <input className="border p-2 w-full" inputMode="decimal" value={marketOptionPrice} onChange={e=>setMarketOptionPrice(e.target.value)} />
            <p className="text-sm text-gray-600 mt-1">Required for IV solve.</p></div>
        )}
        <div><label className="block font-medium">Constant σ (optional)</label>
          <input className="border p-2 w-full" placeholder="e.g. 0.25" inputMode="decimal" value={constantVol} onChange={e=>setConstantVol(e.target.value)} /></div>
        <div className="flex items-center gap-2 mt-6"><input id="useQL" type="checkbox" checked={useQL} onChange={e=>setUseQL(e.target.checked)} />
          <label htmlFor="useQL">Use QuantLib day count</label></div>
        <div className="md:col-span-2"><button disabled={loading || !validIV} className="px-4 py-2 bg-black text-white disabled:opacity-50" type="submit">
          {loading ? "Computing…" : "Compute"}</button>
          {!validIV && <span className="ml-3 text-red-600">Market option price required for IV.</span>}</div>
      </form>

      {error && <div className="mt-6 p-3 border border-red-300 bg-red-50 text-red-800">{error}</div>}

      {data && (data as any).price_and_greeks && (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section><h2 className="font-semibold mb-2">Inputs</h2>
            <table className="w-full text-sm"><tbody>
              {Object.entries((data as any).inputs).map(([k,v]) => (
                <tr key={k}><td className="py-1 pr-3 text-gray-600">{k}</td><td className="py-1 font-mono">{String(v)}</td></tr>
              ))}</tbody></table></section>
          <section><h2 className="font-semibold mb-2">Fair Value &amp; Greeks</h2>
            <table className="w-full text-sm"><tbody>
              {Object.entries((data as any).price_and_greeks).map(([k,v]) => (
                <tr key={k}><td className="py-1 pr-3 text-gray-600">{k}</td><td className="py-1 font-mono">{Number(v as number).toFixed(6)}</td></tr>
              ))}</tbody></table></section>
        </div>
      )}

      {/* American Option Section */}
      <div className="mt-12 pt-8 border-t-2">
        <h1 className="text-2xl font-semibold mb-4">American Option — Price &amp; Greeks</h1>
        <form onSubmit={submitAmerican} className="grid gap-4 md:grid-cols-2">
          <div><label className="block font-medium">Symbol</label>
            <input className="border p-2 w-full" value={amSymbol} onChange={e=>setAmSymbol(e.target.value)} /></div>
          <div><label className="block font-medium">Side</label>
            <select className="border p-2 w-full" value={amSide} onChange={e=>setAmSide(e.target.value as any)}>
              <option value="CALL">CALL</option><option value="PUT">PUT</option></select></div>
          <div><label className="block font-medium">Strike</label>
            <input className="border p-2 w-full" inputMode="decimal" value={amStrike} onChange={e=>setAmStrike(e.target.value)} /></div>
          <div><label className="block font-medium">Expiry</label>
            <input className="border p-2 w-full" type="date" value={amExpiry} min={todayISO} onChange={e=>setAmExpiry(e.target.value)} /></div>
          <div><label className="block font-medium">Volatility mode</label>
            <select className="border p-2 w-full" value={amVolMode} onChange={e=>setAmVolMode(e.target.value as any)}>
              <option value="HIST">Historical volatility</option><option value="IV">Implied volatility</option></select></div>
          {amVolMode === "IV" && (
            <div><label className="block font-medium">Market option price</label>
              <input className="border p-2 w-full" inputMode="decimal" value={amMarketOptionPrice} onChange={e=>setAmMarketOptionPrice(e.target.value)} />
              <p className="text-sm text-gray-600 mt-1">Required for IV solve.</p></div>
          )}
          <div><label className="block font-medium">Constant σ (optional)</label>
            <input className="border p-2 w-full" placeholder="e.g. 0.25" inputMode="decimal" value={amConstantVol} onChange={e=>setAmConstantVol(e.target.value)} /></div>
          <div className="flex items-center gap-2 mt-6"><input id="useQLAm" type="checkbox" checked={amUseQL} onChange={e=>setAmUseQL(e.target.checked)} />
            <label htmlFor="useQLAm">Use QuantLib day count</label></div>
          <div className="md:col-span-2"><button disabled={amLoading || !validAmIV} className="px-4 py-2 bg-black text-white disabled:opacity-50" type="submit">
            {amLoading ? "Computing…" : "Compute American"}</button>
            {!validAmIV && <span className="ml-3 text-red-600">Market option price required for IV.</span>}</div>
        </form>

        {amError && <div className="mt-6 p-3 border border-red-300 bg-red-50 text-red-800">{amError}</div>}

        {amData && (amData as any).american_result && (
          <div className="mt-8">
            <section><h2 className="font-semibold mb-2">American Option Results</h2>
              <table className="w-full text-sm"><tbody>
                {Object.entries((amData as any).american_result).map(([k,v]) => (
                  <tr key={k}><td className="py-1 pr-3 text-gray-600">{k}</td><td className="py-1 font-mono">{Number(v as number).toFixed(6)}</td></tr>
                ))}</tbody></table></section>
          </div>
        )}
      </div>
    </div>
  );
}
