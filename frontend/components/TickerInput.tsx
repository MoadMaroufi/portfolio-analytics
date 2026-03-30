"use client";

import { useState } from "react";
import { searchCompanies } from "@/lib/companies";

type Props = {
  value: string;
  onChange: (ticker: string) => void;
};

export default function TickerInput({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const suggestions = value.length > 0 ? searchCompanies(value) : [];

  return (
    <div className="relative w-40">
      <input
        className="bg-gray-800 rounded px-3 py-2 w-full uppercase"
        placeholder="LVMH, Sanofi…"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)} // delay so click on suggestion registers
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-56 bg-gray-700 rounded shadow-lg text-sm">
          {suggestions.map((c) => (
            <li
              key={c.ticker}
              className="px-3 py-2 hover:bg-gray-600 cursor-pointer flex justify-between"
              onMouseDown={() => { onChange(c.ticker); setOpen(false); }}
            >
              <span className="text-white">{c.name}</span>
              <span className="text-gray-400 ml-2">{c.ticker}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
