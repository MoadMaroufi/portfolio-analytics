"use client";

import { useSearchParams } from "next/navigation";
import DiscoverPage from "@/components/DiscoverPage";
import { LangProvider } from "@/lib/lang";
import { useAuth } from "@/lib/useAuth";

export default function DiscoverRoute() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  return (
    <LangProvider>
      <DiscoverPage user={user} authLoading={loading} initialQuery={initialQuery} />
    </LangProvider>
  );
}
