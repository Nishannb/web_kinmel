"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KinmelBrandLink } from "@/components/KinmelLogo";
import { RegisterFormLegacy } from "@/components/RegisterFormLegacy";
import { RequestKinmelAccessCard } from "@/components/RequestKinmelAccessCard";
import { useAppState } from "@/components/AppProvider";
import { PUBLIC_REGISTRATION_ENABLED } from "@/lib/siteConfig";

function safeNextPath(): string {
  if (typeof window === "undefined") return "/live-selling";
  const raw = new URLSearchParams(window.location.search).get("next");
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/live-selling";
}

export default function RegisterPage() {
  const router = useRouter();
  const { user, isReady } = useAppState();

  useEffect(() => {
    if (isReady && user) {
      router.replace(safeNextPath());
    }
  }, [isReady, router, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-white to-sky-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="flex flex-col items-center gap-4">
          <KinmelBrandLink size="lg" />
          <Link
            href="/"
            className="inline-block text-sm font-semibold text-violet-700 underline-offset-4 hover:underline"
          >
            ← Back to home
          </Link>
        </div>
        {PUBLIC_REGISTRATION_ENABLED ? (
          <RegisterFormLegacy />
        ) : (
          <div className="mt-6">
            <RequestKinmelAccessCard />
            <p className="mt-6 text-center text-sm text-zinc-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-violet-700 underline">
                Log in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
