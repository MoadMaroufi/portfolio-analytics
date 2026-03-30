"use client";

import { useState } from "react";
import MetricCard from "@/components/MetricCard";
import TickerInput from "@/components/TickerInput";

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
      <h1 className="text-3xl font-bold mb-2">Portfolio Analytics</h1>
      <p className="text-gray-400 mb-8">Enter your holdings and get key risk metrics instantly.</p>

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
