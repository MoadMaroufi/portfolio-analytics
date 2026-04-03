"use client";

import Link from "next/link";
import type { User } from "firebase/auth";
import AuthButton from "@/components/AuthButton";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/copy";

type Props = {
  user: User | null;
  authLoading: boolean;
};

export default function DiscoverPromo({ user, authLoading }: Props) {
  const { lang } = useLang();
  const c = t(lang);
  const exampleSearches = [
    c.discoverPromoExamplePrompt,
    c.discoverPromoSearchTwo,
    c.discoverPromoSearchThree,
  ];

  return (
    <section className="mb-12 overflow-hidden rounded-[2rem] border border-blue-500/20 bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950 shadow-[0_24px_80px_-40px_rgba(59,130,246,0.5)]">
      <div className="grid gap-10 px-6 py-8 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:px-10 lg:py-10">
        <div>
          <div className="inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-blue-200">
            {c.discoverPromoEyebrow}
          </div>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {c.discoverPromoTitle}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
            {c.discoverPromoBody}
          </p>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
              {c.discoverPromoExamplesTitle}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {exampleSearches.map((search, index) => (
                <Link
                  key={`${index}-${search}`}
                  href={`/discover?q=${encodeURIComponent(search)}`}
                  className="rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-100 transition-colors hover:border-blue-300/40 hover:bg-blue-400/15 hover:text-white"
                >
                  {search}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
            <StepChip label={c.discoverPromoStepOne} />
            <StepChip label={c.discoverPromoStepTwo} />
            <StepChip label={c.discoverPromoStepThree} />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {user ? (
              <Link
                href="/discover"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-200"
              >
                {c.discoverPromoOpen}
              </Link>
            ) : !authLoading ? (
              <>
                <div className="rounded-full bg-white text-slate-950">
                  <AuthButton user={null} />
                </div>
                <p className="text-sm text-slate-400">{c.discoverPromoLocked}</p>
              </>
            ) : null}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-black/30 p-6 backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-500">
            {c.discoverPromoExampleLabel}
          </p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{c.discoverPromoExamplePromptLabel}</p>
            <p className="mt-2 text-base font-medium text-white">{c.discoverPromoExamplePrompt}</p>
          </div>

          <div className="mt-4 space-y-3">
            <ExampleRow ticker="MC.PA" weight="24%" rationale={c.discoverPromoExampleOne} />
            <ExampleRow ticker="RMS.PA" weight="21%" rationale={c.discoverPromoExampleTwo} />
            <ExampleRow ticker="CFR.SW" weight="19%" rationale={c.discoverPromoExampleThree} />
          </div>

          <div className="mt-4 rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-200">{c.discoverPromoWhyLabel}</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">{c.discoverPromoWhyBody}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepChip({ label }: { label: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-slate-300">
      {label}
    </div>
  );
}

function ExampleRow({
  ticker,
  weight,
  rationale,
}: {
  ticker: string;
  weight: string;
  rationale: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">{ticker}</p>
        <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-2.5 py-1 text-xs font-medium text-blue-200">
          {weight}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-300">{rationale}</p>
    </div>
  );
}
