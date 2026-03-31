"use client";

import { useState } from "react";
import MetricCard from "@/components/MetricCard";
import TickerInput from "@/components/TickerInput";
import AuthButton from "@/components/AuthButton";
import PortfolioManager from "@/components/PortfolioManager";
import { useAuth } from "@/lib/useAuth";

// Shape of what the API returns
type Result = {
  tickers: string[];
  annualized_return: number;
  annualized_volatility: number;
  sharpe_ratio: number;
  max_drawdown: number;
  correlation_matrix: Record<string, Record<string, number>>;
};

// One row in the form: a ticker + its weight
type Row = { ticker: string; weight: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function Home() {
  const { user, loading: authLoading } = useAuth();

  const [rows, setRows] = useState<Row[]>([
    { ticker: "AAPL", weight: "50" },
    { ticker: "MSFT", weight: "50" },
  ]);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateRow(i: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { ticker: "", weight: "" }]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    // Build the weights dict the API expects: { "AAPL": 0.5, "MSFT": 0.5 }
    const weights: Record<string, number> = {};
    for (const row of rows) {
      if (row.ticker && row.weight) {
        weights[row.ticker.toUpperCase()] = parseFloat(row.weight);
      }
    }

    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "Something went wrong.");
      }

      setResult(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Portfolio Analytics</h1>
          <p className="text-gray-400">Enter your holdings and get key risk metrics instantly.</p>
        </div>
        <div className="flex flex-col items-end gap-1 text-sm text-gray-400">
          {!authLoading && <AuthButton user={user} />}
          <span className="font-medium text-white">Moaad MAAROUFI</span>
          <div className="flex gap-3 mt-1">
            <a href="https://www.linkedin.com/in/moaad-maaroufi-903964242/?locale=en" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="LinkedIn">
              {/* LinkedIn logo SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452H17.21v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.987V9h3.102v1.561h.046c.432-.818 1.487-1.681 3.062-1.681 3.274 0 3.878 2.155 3.878 4.958v6.614zM5.337 7.433a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6zm1.603 13.019H3.734V9h3.206v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a href="https://github.com/MoadMaroufi" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="GitHub">
              {/* GitHub logo SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-3 items-center">
            <TickerInput
              value={row.ticker}
              onChange={(val) => updateRow(i, "ticker", val)}
            />
            <input
              className="bg-gray-800 rounded px-3 py-2 w-24"
              placeholder="Weight %"
              type="number"
              min="0"
              value={row.weight}
              onChange={(e) => updateRow(i, "weight", e.target.value)}
              required
            />
            {/* Only show remove button if more than 2 rows */}
            {rows.length > 2 && (
              <button type="button" onClick={() => removeRow(i)} className="text-gray-500 hover:text-red-400">
                ✕
              </button>
            )}
          </div>
        ))}

        <div className="flex gap-4 pt-2">
          <button type="button" onClick={addRow} className="text-sm text-gray-400 hover:text-white">
            + Add ticker
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded font-medium disabled:opacity-50"
          >
            {loading ? "Analyzing…" : "Analyze"}
          </button>
        </div>
      </form>

      {/* Save/load portfolios — only visible when signed in */}
      {user && (
        <PortfolioManager user={user} currentRows={rows} onLoad={setRows} />
      )}

      {error && <p className="mt-6 text-red-400">{error}</p>}

      {result && (
        <div className="mt-10 space-y-6">
          <p className="text-gray-400 text-sm">
            Results for: <span className="text-white">{result.tickers.join(", ")}</span> — last 12 months
          </p>

          {/* Key metrics grid */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="Annualized Return"
              value={`${(result.annualized_return * 100).toFixed(2)}%`}
              description="Compound yearly return of the portfolio"
            />
            <MetricCard
              label="Annualized Volatility"
              value={`${(result.annualized_volatility * 100).toFixed(2)}%`}
              description="Yearly standard deviation of returns"
            />
            <MetricCard
              label="Sharpe Ratio"
              value={result.sharpe_ratio.toFixed(2)}
              description="Return per unit of risk (vs 5% risk-free rate)"
            />
            <MetricCard
              label="Max Drawdown"
              value={`${(result.max_drawdown * 100).toFixed(2)}%`}
              description="Worst peak-to-trough loss over the period"
            />
          </div>

          {/* Correlation matrix */}
          <div>
            <h2 className="font-semibold mb-3">Correlation Matrix</h2>
            <CorrelationTable matrix={result.correlation_matrix} />
          </div>
        </div>
      )}
    </main>
  );
}

// Inline — too small to deserve its own file
function CorrelationTable({ matrix }: { matrix: Record<string, Record<string, number>> }) {
  const tickers = Object.keys(matrix);
  return (
    <div className="overflow-x-auto">
      <table className="text-sm w-full">
        <thead>
          <tr>
            <th className="p-2" />
            {tickers.map((t) => <th key={t} className="p-2 text-gray-400">{t}</th>)}
          </tr>
        </thead>
        <tbody>
          {tickers.map((row) => (
            <tr key={row}>
              <td className="p-2 text-gray-400 font-medium">{row}</td>
              {tickers.map((col) => {
                const val = matrix[row][col];
                // Color: green for low correlation, red for high (except diagonal)
                const isdiag = row === col;
                const color = isdiag ? "text-gray-500" : val > 0.7 ? "text-red-400" : val < 0.3 ? "text-green-400" : "text-white";
                return <td key={col} className={`p-2 text-center ${color}`}>{val.toFixed(2)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
