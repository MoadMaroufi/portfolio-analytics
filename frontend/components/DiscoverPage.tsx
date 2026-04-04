"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import AuthButton from "@/components/AuthButton";
import ResultDisclaimer from "@/components/ResultDisclaimer";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/copy";
import {
  runSemanticSearch,
  saveRecommendationDraft,
  type Recommendation,
  type SemanticSearchResponse,
} from "@/lib/semanticSearch";
import { savePortfolio } from "@/lib/portfolios";

// Typing cursor animation component
function ThinkingAnimation({
  messages,
  isLoading,
}: {
  messages: string[];
  isLoading: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setCurrentIndex(0);
      setVisibleChars(0);
      return;
    }

    const message = messages[currentIndex] ?? "";

    // Typewriter effect for active message
    if (visibleChars < message.length) {
      const typingTimeout = setTimeout(() => {
        setVisibleChars((prev) => prev + 1);
      }, 28);
      return () => clearTimeout(typingTimeout);
    }

    // Pause before switching to the next message
    const messageTimeout = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
      setVisibleChars(0);
    }, 850);
    return () => clearTimeout(messageTimeout);
  }, [currentIndex, isLoading, messages, visibleChars]);

  useEffect(() => {
    if (!isLoading) return;

    // Blink cursor every 450ms
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 450);

    return () => clearInterval(cursorInterval);
  }, [isLoading]);

  if (!isLoading) return null;

  const message = messages[currentIndex] ?? "";

  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative inline-flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400/40 animate-ping" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-300" />
      </span>
      <span className="min-w-[16ch] text-left text-blue-200">
        {message.slice(0, visibleChars)}
      </span>
      <span
        className={`inline-block h-4 w-0.5 bg-blue-200 transition-opacity ${
          showCursor ? "opacity-100" : "opacity-0"
        }`}
      />
      <span className="inline-flex items-center gap-0.5">
        <span
          className="h-1.5 w-1.5 rounded-full bg-blue-300/80 animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-blue-300/80 animate-bounce"
          style={{ animationDelay: "120ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-blue-300/80 animate-bounce"
          style={{ animationDelay: "240ms" }}
        />
      </span>
    </span>
  );
}

type Props = {
  user: User | null;
  authLoading: boolean;
  initialQuery?: string;
};

export default function DiscoverPage({ user, authLoading, initialQuery = "" }: Props) {
  const { lang, setLang } = useLang();
  const c = t(lang);

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<string | null>(null);
  const [results, setResults] = useState<SemanticSearchResponse | null>(null);
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<"quick" | "smart" | null>(null);
  const hasAutoRun = useRef(false);

  const canSubmit = user && query.trim() && !loading;
  const recommendationCount = results?.recommendations.length ?? 0;

  const summary = useMemo(() => {
    if (!results) return null;
    return `${results.retrieved_count} ${c.discoverRetrievedSuffix} ${recommendationCount} ${c.discoverSelectedSuffix}`;
  }, [c.discoverRetrievedSuffix, c.discoverSelectedSuffix, recommendationCount, results]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!user || !initialQuery || hasAutoRun.current) return;
    hasAutoRun.current = true;
    void executeSearch(initialQuery, true); // Default to smart search for auto-run
  }, [initialQuery, user]);

  async function executeSearch(nextQuery: string, useLlm: boolean) {
    if (!user || !nextQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSaveState(null);
    setResults(null);
    setExpandedTicker(null);
    setSearchMode(useLlm ? "smart" : "quick");

    try {
      const response = await runSemanticSearch(nextQuery.trim(), 5, useLlm);
      setResults(response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : c.discoverUnknownError);
    } finally {
      setLoading(false);
      setSearchMode(null);
    }
  }

  async function handleQuickSearch(e: React.FormEvent) {
    e.preventDefault();
    hasAutoRun.current = true;
    await executeSearch(query, false);
  }

  async function handleSmartSearch(e: React.FormEvent) {
    e.preventDefault();
    hasAutoRun.current = true;
    await executeSearch(query, true);
  }

  async function handleSave() {
    if (!user || !results) return;

    setSaveState(c.discoverSaving);
    try {
      // Convert recommendations to portfolio rows format
      const rows = results.recommendations.map((rec) => ({
        ticker: rec.ticker,
        weight: (rec.weight * 100).toFixed(2),
      }));

      // Save as a portfolio with the query as the name
      await savePortfolio(user.uid, results.query, rows);
      setSaveState(c.discoverSaved);
    } catch {
      setSaveState(c.discoverSaveFailed);
    }
  }

  function handleApply() {
    if (!results) return;
    saveRecommendationDraft(results.recommendations);
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <Link href="/" className="mb-4 inline-flex text-sm text-gray-400 transition-colors hover:text-white">
              {c.discoverBack}
            </Link>
            <h1 className="text-4xl font-semibold tracking-tight">{c.discoverTitle}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">{c.discoverSubtitle}</p>
          </div>
          <div className="flex flex-col items-end gap-2 text-sm text-gray-400">
            <div className="flex overflow-hidden rounded border border-gray-700 text-xs">
              {(["en", "fr"] as const).map((language) => (
                <button
                  key={language}
                  onClick={() => setLang(language)}
                  className={`px-2.5 py-1 uppercase transition-colors ${
                    lang === language ? "bg-gray-700 text-white" : "text-gray-500 hover:text-white"
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>
            {!authLoading && <AuthButton user={user} />}
          </div>
        </div>

        {!authLoading && !user ? (
          <section className="rounded-3xl border border-gray-800 bg-gray-900/70 p-8 text-center shadow-2xl shadow-black/20">
            <p className="text-sm uppercase tracking-[0.25em] text-blue-300">{c.discoverLockedEyebrow}</p>
            <h2 className="mt-3 text-2xl font-semibold">{c.discoverLockedTitle}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-400">{c.discoverLockedBody}</p>
            <div className="mt-6 flex justify-center">
              <AuthButton user={null} />
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-3xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-6 shadow-2xl shadow-black/20">
              <div className="mb-6 max-w-2xl">
                <p className="text-sm uppercase tracking-[0.25em] text-blue-300">{c.discoverPromptLabel}</p>
                <h2 className="mt-3 text-2xl font-semibold">{c.discoverSearchTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-400">{c.discoverSearchBody}</p>
              </div>

            <form className="space-y-4">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={c.discoverPlaceholder}
                className="min-h-32 w-full rounded-2xl border border-gray-800 bg-gray-950/80 px-5 py-4 text-base outline-none transition-colors placeholder:text-gray-500 focus:border-blue-500"
              />
              <div className="flex flex-wrap items-center gap-4">
                {/* Quick Search Button */}
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={handleQuickSearch}
                    disabled={!canSubmit || loading}
                    className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading && searchMode === "quick" ? (
                      c.discoverQuickSearchLoading
                    ) : (
                      <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        {c.discoverQuickSearch}
                      </span>
                    )}
                  </button>
                  <span className="text-xs text-emerald-400/70">{c.discoverQuickSearchHint}</span>
                </div>

                {/* Smart Search Button */}
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={handleSmartSearch}
                    disabled={!canSubmit || loading}
                    className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading && searchMode === "smart" ? (
                      <ThinkingAnimation
                        messages={[
                          c.discoverThinkingStep1,
                          c.discoverThinkingStep2,
                          c.discoverThinkingStep3,
                        ]}
                        isLoading={loading}
                      />
                    ) : (
                      <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
                          <path d="M8.5 8.5v.01"/>
                          <path d="M16 15.5v.01"/>
                          <path d="M12 12v.01"/>
                          <path d="M11 17v.01"/>
                          <path d="M7 14v.01"/>
                        </svg>
                        {c.discoverSmartSearch}
                      </span>
                    )}
                  </button>
                  <span className="text-xs text-blue-300/70">{c.discoverSmartSearchHint}</span>
                </div>
              </div>
            </form>
            </section>

            {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

            {results && (
              <section className="mt-8 space-y-6">
                <div className="rounded-3xl border border-gray-800 bg-gray-900/70 p-7 shadow-xl shadow-black/20">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                      <p className="text-xs uppercase tracking-[0.25em] text-gray-500">{c.discoverResultsLabel}</p>
                      <h2 className="mt-2 text-3xl font-semibold">{c.discoverRecommendationTitle}</h2>
                      <p className="mt-3 text-base leading-7 text-gray-300">{results.explanation}</p>
                      {summary && <p className="mt-4 text-xs text-gray-500">{summary}</p>}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleSave}
                        className="rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-200 transition-colors hover:border-gray-500 hover:text-white"
                      >
                        {c.discoverSave}
                      </button>
                      <button
                        type="button"
                        onClick={handleApply}
                        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-950 transition-colors hover:bg-gray-200"
                      >
                        {c.discoverApply}
                      </button>
                    </div>
                  </div>
                  {saveState && <p className="mt-4 text-sm text-gray-400">{saveState}</p>}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {results.recommendations.map((recommendation) => (
                    <RecommendationCard
                      key={recommendation.ticker}
                      recommendation={recommendation}
                      expanded={expandedTicker === recommendation.ticker}
                      onToggle={() =>
                        setExpandedTicker((current) =>
                          current === recommendation.ticker ? null : recommendation.ticker
                        )
                      }
                    />
                  ))}
                </div>

                {results.recommendations.length === 0 && (
                  <div className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6 text-sm text-gray-400">
                    {c.discoverEmpty}
                  </div>
                )}

                <ResultDisclaimer />
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function RecommendationCard({
  recommendation,
  expanded,
  onToggle,
}: {
  recommendation: Recommendation;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { lang } = useLang();
  const c = t(lang);

  return (
    <article className="rounded-3xl border border-gray-800 bg-gray-900/70 p-5 shadow-xl shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{recommendation.ticker}</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{recommendation.name}</h3>
        </div>
        <div className="rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-200">
          {(recommendation.weight * 100).toFixed(0)}%
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-gray-300">{recommendation.rationale}</p>

      <button
        type="button"
        onClick={onToggle}
        className="mt-4 text-sm text-blue-300 transition-colors hover:text-blue-200"
      >
        {expanded ? c.discoverHideContext : c.discoverViewContext}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 rounded-2xl border border-gray-800 bg-gray-950/70 p-4 text-sm text-gray-300">
          <p className="leading-6 text-gray-400">{recommendation.description}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ContextField label={c.discoverSector} value={recommendation.sector} />
            <ContextField label={c.discoverIndustry} value={recommendation.industry} />
            <ContextField label={c.discoverCountry} value={recommendation.country} />
            <ContextField label={c.discoverExchange} value={recommendation.exchange} />
          </div>
          <ContextField label={c.discoverSimilarity} value={recommendation.score.toFixed(4)} />
        </div>
      )}
    </article>
  );
}

function ContextField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{label}</p>
      <p className="mt-1 text-sm text-gray-200">{value || "-"}</p>
    </div>
  );
}
