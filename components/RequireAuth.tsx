"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/AppProvider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isReady } = useAppState();

  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login");
    }
  }, [isReady, router, user]);

  if (!isReady) {
    return <p className="text-sm text-zinc-500">Loading...</p>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
