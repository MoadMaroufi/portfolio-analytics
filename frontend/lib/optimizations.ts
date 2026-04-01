import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

export type OptimizeResult = {
  optimal_weights: Record<string, number>;
  expected_return: number;
  expected_volatility: number;
  sharpe_ratio: number;
  frontier: { volatility: number; expected_return: number; sharpe: number }[];
};

export type CachedOptimization = {
  tickers: string[];
  result: OptimizeResult;
  createdAt: Date | null;
  expiresAt: Date | null;
};

function cacheKey(tickers: string[]): string {
  return [...tickers].sort().join("|");
}

export async function getCachedOptimization(
  uid: string,
  tickers: string[]
): Promise<CachedOptimization | null> {
  const ref = doc(getFirebaseDb(), "users", uid, "optimizations", cacheKey(tickers));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  const expiresAt: Date = data.expiresAt?.toDate() ?? new Date(0);
  if (expiresAt < new Date()) return null;
  return {
    tickers: data.tickers,
    result: data.result,
    createdAt: data.createdAt?.toDate() ?? null,
    expiresAt,
  };
}

export async function saveOptimization(
  uid: string,
  tickers: string[],
  result: OptimizeResult
): Promise<void> {
  const ref = doc(getFirebaseDb(), "users", uid, "optimizations", cacheKey(tickers));
  await setDoc(ref, {
    tickers: [...tickers].sort(),
    result,
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  });
}
