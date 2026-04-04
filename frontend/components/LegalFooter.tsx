"use client";

import { useLang } from "@/lib/lang";
import { t } from "@/lib/copy";

export default function LegalFooter() {
  const { lang } = useLang();
  const c = t(lang);

  return (
    <footer className="border-t border-gray-900 bg-gray-950/95">
      <div className="mx-auto max-w-5xl px-6 py-6 text-xs leading-6 text-gray-500 sm:px-8">
        <p>{c.legalFooter}</p>
      </div>
    </footer>
  );
}
