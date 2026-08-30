"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppState } from "@/components/AppProvider";
import { KinmelBrandLink } from "@/components/KinmelLogo";
import { verifyPremiumOverlayKhaltiPayment } from "@/lib/premiumOverlayClient";

const PREMIUM_OVERLAY_PIDX_KEY = "premium_overlay_pidx";
const PREMIUM_OVERLAY_BUSINESS_ID_KEY = "premium_overlay_business_id";

function formatExpiry(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const parsed = Date.parse(expiresAt);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PremiumPaymentSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { businessId: loggedInBusinessId } = useAppState();
  const pidxParam = searchParams.get("pidx");
  const [status, setStatus] = useState<"working" | "ok" | "err">("working");
  const [message, setMessage] = useState("Verifying payment…");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const pidx =
      (pidxParam || "").trim() ||
      (typeof window !== "undefined"
        ? window.sessionStorage.getItem(PREMIUM_OVERLAY_PIDX_KEY) || ""
        : "");
    const businessId =
      (typeof window !== "undefined"
        ? window.sessionStorage.getItem(PREMIUM_OVERLAY_BUSINESS_ID_KEY) || ""
        : "") ||
      (loggedInBusinessId || "").trim();

    if (!pidx) {
      setStatus("err");
      setMessage("Missing payment reference. Try paying again from the premium page.");
      return;
    }
    if (!businessId) {
      setStatus("err");
      setMessage("Missing shop reference. Open Pay Now from the Kinmel app and try again.");
      return;
    }

    (async () => {
      try {
        const result = await verifyPremiumOverlayKhaltiPayment(pidx, businessId);
        if (cancelled) return;
        setExpiresAt(result.expires_at);
        setStatus("ok");
        setMessage("Payment confirmed.");
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(PREMIUM_OVERLAY_PIDX_KEY);
          window.sessionStorage.removeItem(PREMIUM_OVERLAY_BUSINESS_ID_KEY);
        }
        window.setTimeout(() => {
          if (!cancelled) router.replace("/premium");
        }, 1800);
      } catch (e) {
        if (!cancelled) {
          setStatus("err");
          setMessage(e instanceof Error ? e.message : String(e));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loggedInBusinessId, pidxParam, router]);

  const expiryLabel = formatExpiry(expiresAt);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <KinmelBrandLink className="text-lg font-extrabold" />
      {status === "working" ? (
        <>
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600"
            aria-hidden
          />
          <p className="text-sm text-zinc-600">{message}</p>
        </>
      ) : null}
      {status === "ok" ? (
        <>
          <p className="text-lg font-bold text-emerald-700">{message}</p>
          {expiryLabel ? (
            <p className="text-sm text-zinc-600">
              Premium active until <strong>{expiryLabel}</strong>.
            </p>
          ) : null}
          <p className="text-xs text-zinc-500">Redirecting to premium page…</p>
        </>
      ) : null}
      {status === "err" ? (
        <>
          <p className="text-sm text-red-700">{message}</p>
          <Link
            href="/premium"
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white"
          >
            Back to premium
          </Link>
        </>
      ) : null}
    </div>
  );
}

export default function PremiumPaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
          Loading…
        </div>
      }
    >
      <PremiumPaymentSuccessInner />
    </Suspense>
  );
}
