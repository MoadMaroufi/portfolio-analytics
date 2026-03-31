"use client";

import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  savePortfolio,
  loadPortfolios,
  deletePortfolio,
  SavedPortfolio,
} from "@/lib/portfolios";

type Row = { ticker: string; weight: string };
type Props = {
  user: User;
  currentRows: Row[];
  onLoad: (rows: Row[]) => void;
};

export default function PortfolioManager({ user, currentRows, onLoad }: Props) {
  const [portfolios, setPortfolios] = useState<SavedPortfolio[]>([]);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const data = await loadPortfolios(user.uid);
    setPortfolios(data);
  };

  useEffect(() => {
    refresh();
  }, [user.uid]);

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    await savePortfolio(user.uid, saveName.trim(), currentRows);
    setSaveName("");
    setSaving(false);
    await refresh();
  };

  const handleDelete = async (id: string) => {
    await deletePortfolio(user.uid, id);
    await refresh();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3 mt-6">
      <h3 className="font-semibold text-sm">My Portfolios</h3>

      {/* Save current portfolio */}
      <div className="flex gap-2">
        <input
          className="bg-gray-700 rounded px-3 py-1.5 text-sm flex-1"
          placeholder="Portfolio name..."
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <button
          onClick={handleSave}
          disabled={saving || !saveName.trim()}
          className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-sm disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Saved portfolios list */}
      {portfolios.length === 0 ? (
        <p className="text-gray-500 text-xs">No saved portfolios yet.</p>
      ) : (
        <ul className="space-y-1">
          {portfolios.map((p) => (
            <li key={p.id} className="flex justify-between items-center text-sm">
              <button
                onClick={() => onLoad(p.rows)}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                {p.name}
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-gray-600 hover:text-red-400 text-xs transition-colors"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
