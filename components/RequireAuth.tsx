"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppState } from "@/components/AppProvider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAppState();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isReady || user) {
      return;
    }
    const path = pathname || "/live-selling";
    const next = encodeURIComponent(path);
    router.replace(`/login?next=${next}`);
  }, [isReady, pathname, router, user]);

  if (!isReady) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600"
          aria-hidden
        />
        <p className="text-sm text-zinc-500">Loading your workspace…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12">
        <p className="text-sm text-zinc-500">Redirecting to sign in…</p>
      </div>
    );
  }

  return <>{children}</>;
}
