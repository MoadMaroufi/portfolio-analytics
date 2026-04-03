"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DiscoverPage from "@/components/DiscoverPage";
import { LangProvider } from "@/lib/lang";
import { useAuth } from "@/lib/useAuth";

function DiscoverContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  return (
    <DiscoverPage user={user} authLoading={loading} initialQuery={initialQuery} />
  );
}

export default function DiscoverRoute() {
  return (
    <LangProvider>
      <Suspense fallback={null}>
        <DiscoverContent />
      </Suspense>
    </LangProvider>
  );
}
