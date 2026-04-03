const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Recommendation = {
  ticker: string;
  name: string;
  weight: number;
  rationale: string;
  description: string;
  sector: string;
  industry: string;
  country: string;
  exchange: string;
  score: number;
};

export type SemanticSearchResponse = {
  query: string;
  top_k: number;
  retrieved_count: number;
  recommendations: Recommendation[];
  explanation: string;
};

export async function runSemanticSearch(
  query: string,
  topK = 5
): Promise<SemanticSearchResponse> {
  const res = await fetch(`${API_URL}/semantic-search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: topK }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail ?? "Failed to fetch recommendations.");
  }

  return res.json();
}

export type PortfolioDraftRow = { ticker: string; weight: string };

const DRAFT_STORAGE_KEY = "discover-portfolio-draft";

export function saveRecommendationDraft(recommendations: Recommendation[]): void {
  if (typeof window === "undefined") return;

  const rows: PortfolioDraftRow[] = recommendations.map((item) => ({
    ticker: item.ticker,
    weight: (item.weight * 100).toFixed(2),
  }));

  window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(rows));
}

export function consumeRecommendationDraft(): PortfolioDraftRow[] | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    return parsed.filter(
      (row): row is PortfolioDraftRow =>
        typeof row?.ticker === "string" && typeof row?.weight === "string"
    );
  } catch {
    return null;
  }
}
