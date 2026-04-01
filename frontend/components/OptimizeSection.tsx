"use client";

import { useState } from "react";
import { User } from "firebase/auth";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import MetricCard from "@/components/MetricCard";
import AuthButton from "@/components/AuthButton";
import {
  getCachedOptimization,
  saveOptimization,
  OptimizeResult,
} from "@/lib/optimizations";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/copy";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function makeExampleFrontier() {
  return Array.from({ length: 60 }, (_, i) => {
    const ti = i / 59;
    const vol = 0.11 + ti * 0.14;
    const ret = -3.5 * (vol - 0.17) ** 2 + 0.10;
    const nv = Math.sin(i * 7.3) * 0.008;
    const nr = Math.cos(i * 3.7) * 0.012;
    return {
      volatility: parseFloat((vol + nv).toFixed(4)),
      expected_return: parseFloat((ret + nr).toFixed(4)),
      sharpe: parseFloat(((ret + nr - 0.05) / (vol + nv)).toFixed(4)),
    };
  });
}

const EXAMPLE_RESULT: OptimizeResult = {
  optimal_weights: { "BNP.PA": 0.4021, "AI.PA": 0.3489, "OR.PA": 0.249 },
  expected_return: 0.1243,
  expected_volatility: 0.1421,
  sharpe_ratio: 0.5232,
  frontier: makeExampleFrontier(),
};

type Props = {
  user: User | null;
  currentTickers: string[];
};

export default function OptimizeSection({ user, currentTickers }: Props) {
  const { lang } = useLang();
  const c = t(lang);

  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [showHow, setShowHow] = useState(false);

  const validTickers = currentTickers.filter(Boolean);

  async function handleOptimize() {
    if (!user || validTickers.length < 2) return;
    setError(null);
    setLoading(true);
    setFromCache(false);

    try {
      const cached = await getCachedOptimization(user.uid, validTickers);
      if (cached) {
        setResult(cached.result);
        setFromCache(true);
        return;
      }

      const res = await fetch(`${API_URL}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers: validTickers }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "Optimization failed.");
      }

      const data: OptimizeResult = await res.json();
      await saveOptimization(user.uid, validTickers, data);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10">
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1">
          <h2 className="font-semibold">{c.optimizerTitle}</h2>
          <p className="text-gray-400 text-sm mt-0.5">{c.optimizerSubtitle}</p>
          <button
            onClick={() => setShowHow((v) => !v)}
            className="text-xs text-gray-500 hover:text-gray-300 mt-1 underline underline-offset-2 transition-colors"
          >
            {c.howItWorksLabel}
          </button>
          {showHow && (
            <p className="text-xs text-gray-500 mt-1 max-w-md leading-relaxed">
              {c.howItWorksBody}
            </p>
          )}
        </div>
        {fromCache && (
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded mt-1 shrink-0">
            {c.cached}
          </span>
        )}
      </div>

      <div className="mt-3">
        {user ? (
          <>
            <button
              onClick={handleOptimize}
              disabled={loading || validTickers.length < 2}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? c.optimizeButtonLoading : c.optimizeButton}
            </button>
            {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
            {result && <OptimizationResult result={result} />}
          </>
        ) : (
          <div className="relative">
            <div className="blur-sm pointer-events-none select-none opacity-60">
              <OptimizationResult result={EXAMPLE_RESULT} />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900/70 rounded-lg">
              <p className="text-sm font-medium text-gray-200">{c.optimizerSignInPrompt}</p>
              <AuthButton user={null} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OptimizationResult({ result }: { result: OptimizeResult }) {
  const { lang } = useLang();
  const c = t(lang);

  const frontierDots = result.frontier
    .filter((_, i) => i % 4 === 0)
    .map((p) => ({
      vol: parseFloat((p.volatility * 100).toFixed(2)),
      ret: parseFloat((p.expected_return * 100).toFixed(2)),
    }));

  const optimalDot = [
    {
      vol: parseFloat((result.expected_volatility * 100).toFixed(2)),
      ret: parseFloat((result.expected_return * 100).toFixed(2)),
    },
  ];

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label={c.projectedReturn}
          value={`${(result.expected_return * 100).toFixed(2)}%`}
          description={c.projectedReturnDesc}
        />
        <MetricCard
          label={c.portfolioRisk}
          value={`${(result.expected_volatility * 100).toFixed(2)}%`}
          description={c.portfolioRiskDesc}
        />
        <MetricCard
          label={c.riskAdjustedScore}
          value={result.sharpe_ratio.toFixed(2)}
          description={c.riskAdjustedScoreDesc}
        />
      </div>

      {frontierDots.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-1">{c.frontierTitle}</h3>
          <p className="text-xs text-gray-500 mb-4">{c.frontierSubtitle}</p>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
              <XAxis
                dataKey="vol"
                name="Volatility"
                unit="%"
                type="number"
                domain={["auto", "auto"]}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                label={{
                  value: "Volatility (%)",
                  position: "insideBottom",
                  offset: -15,
                  fill: "#6b7280",
                  fontSize: 11,
                }}
              />
              <YAxis
                dataKey="ret"
                name="Return"
                unit="%"
                type="number"
                domain={["auto", "auto"]}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                width={45}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                formatter={(val) => [`${Number(val).toFixed(2)}%`]}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", color: "#9ca3af", paddingTop: "8px" }}
              />
              <Scatter
                name="Sampled portfolios"
                data={frontierDots}
                fill="#3b82f6"
                opacity={0.35}
                r={2}
              />
              <Scatter
                name="★ Optimal"
                data={optimalDot}
                fill="#f59e0b"
                r={7}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-3">{c.suggestedAllocation}</h3>
        <div className="space-y-2">
          {Object.entries(result.optimal_weights)
            .sort(([, a], [, b]) => b - a)
            .map(([ticker, weight]) => (
              <div key={ticker} className="flex items-center gap-3">
                <span className="text-sm font-medium w-20 shrink-0">{ticker}</span>
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${(weight * 100).toFixed(1)}%` }}
                  />
                </div>
                <span className="text-sm text-gray-300 w-14 text-right shrink-0">
                  {(weight * 100).toFixed(1)}%
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
