import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

type Row = { ticker: string; weight: string };

export type SavedPortfolio = {
  id: string;
  name: string;
  rows: Row[];
  createdAt: Date | null;
};

export async function savePortfolio(uid: string, name: string, rows: Row[]) {
  const ref = collection(getFirebaseDb(), "users", uid, "portfolios");
  await addDoc(ref, {
    name,
    rows,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function loadPortfolios(uid: string): Promise<SavedPortfolio[]> {
  const ref = collection(getFirebaseDb(), "users", uid, "portfolios");
  const q = query(ref, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    name: d.data().name,
    rows: d.data().rows,
    createdAt: d.data().createdAt?.toDate() ?? null,
  }));
}

export async function deletePortfolio(uid: string, portfolioId: string) {
  await deleteDoc(doc(getFirebaseDb(), "users", uid, "portfolios", portfolioId));
}
