"use client";

import { useLang } from "@/lib/lang";
import { t } from "@/lib/copy";

export default function ResultDisclaimer() {
  const { lang } = useLang();
  const c = t(lang);

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
      <p>{c.legalResults}</p>
    </div>
  );
}
