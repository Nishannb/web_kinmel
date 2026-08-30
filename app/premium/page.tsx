"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppState } from "@/components/AppProvider";
import { KinmelBrandLink } from "@/components/KinmelLogo";
import { supabase } from "@/lib/supabase";
import {
  PREMIUM_OVERLAY_ANNUAL_NPR,
  PREMIUM_OVERLAY_MONTHLY_NPR,
  fetchPremiumOverlayStatus,
  initPremiumOverlayKhaltiPayment,
  isPremiumOverlayActive,
  resumePremiumCheckout,
} from "@/lib/premiumOverlayClient";

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

function PremiumPageInner() {
  const searchParams = useSearchParams();
  const checkoutToken = (searchParams.get("checkout") || "").trim();
  const { businessId, user } = useAppState();
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [checkoutBusinessName, setCheckoutBusinessName] = useState<string | null>(null);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payBusy, setPayBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLoggedIn = useCallback(async () => {
    if (!businessId) {
      return;
    }
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      return;
    }
    const status = await fetchPremiumOverlayStatus(token, businessId);
    setExpiresAt(status.expires_at);
  }, [businessId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setError(null);
      try {
        if (checkoutToken) {
          const resume = await resumePremiumCheckout(checkoutToken);
          if (cancelled) return;
          if (resume.status === "paid") {
            setExpiresAt(resume.expires_at ?? null);
            setCheckoutReady(false);
          } else {
            setCheckoutBusinessName(resume.business_name ?? null);
            setCheckoutReady(Boolean(resume.payment_url));
            const resumeBusinessId = (resume.business_id || "").trim();
            if (resumeBusinessId && typeof window !== "undefined") {
              window.sessionStorage.setItem(
                PREMIUM_OVERLAY_BUSINESS_ID_KEY,
                resumeBusinessId,
              );
            }
          }
          return;
        }
        if (user && businessId) {
          await refreshLoggedIn();
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, checkoutToken, refreshLoggedIn, user]);

  const active = isPremiumOverlayActive(expiresAt);
  const expiryLabel = formatExpiry(expiresAt);

  const onPay = async () => {
    if (payBusy) return;
    setPayBusy(true);
    setError(null);
    try {
      if (checkoutToken) {
        const resume = await resumePremiumCheckout(checkoutToken);
        if (resume.status === "paid") {
          setExpiresAt(resume.expires_at ?? null);
          return;
        }
        const paymentUrl = (resume.payment_url || "").trim();
        const pidx = (resume.pidx || "").trim();
        const resumeBusinessId = (resume.business_id || "").trim();
        if (!paymentUrl) {
          throw new Error("Payment link is not available.");
        }
        if (typeof window !== "undefined") {
          if (pidx) {
            window.sessionStorage.setItem(PREMIUM_OVERLAY_PIDX_KEY, pidx);
          }
          if (resumeBusinessId) {
            window.sessionStorage.setItem(
              PREMIUM_OVERLAY_BUSINESS_ID_KEY,
              resumeBusinessId,
            );
          }
        }
        window.location.href = paymentUrl;
        return;
      }

      if (!businessId) {
        throw new Error("Open Pay Now from the Kinmel app, or sign in on the web.");
      }
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        throw new Error("Sign in on the web, or use Pay Now in the Kinmel app.");
      }
      const { payment_url, pidx, checkout_token } = await initPremiumOverlayKhaltiPayment(
        token,
        businessId
      );
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(PREMIUM_OVERLAY_PIDX_KEY, pidx);
        window.sessionStorage.setItem(PREMIUM_OVERLAY_BUSINESS_ID_KEY, businessId);
        if (checkout_token) {
          window.sessionStorage.setItem("premium_overlay_checkout", checkout_token);
        }
      }
      window.location.href = payment_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPayBusy(false);
    }
  };

  const canPay = checkoutToken ? checkoutReady : Boolean(businessId && user);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
      <div>
        <KinmelBrandLink className="text-lg font-extrabold" />
        <h1 className="mt-4 text-2xl font-extrabold text-zinc-900">Premium overlay</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Kinmel branded overlay hatauna ko lagi premium user hunu parne cha. Post studio ma
          swipe garera no-overlay mode record garna yo plan chahincha.
        </p>
        {checkoutBusinessName ? (
          <p className="mt-2 text-sm font-semibold text-violet-800">
            Shop: {checkoutBusinessName}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5">
        <p className="text-sm font-semibold text-violet-900">
          Monthly NPR {PREMIUM_OVERLAY_MONTHLY_NPR.toLocaleString("en-NP")}, billed annually
        </p>
        <p className="mt-1 text-2xl font-extrabold text-violet-700">
          NPR {PREMIUM_OVERLAY_ANNUAL_NPR.toLocaleString("en-NP")}{" "}
          <span className="text-base font-semibold text-violet-600">/ year</span>
        </p>
        <p className="mt-2 text-xs text-violet-800/80">Pay with Khalti (eSewa coming soon)</p>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : active && expiryLabel ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Premium active until <strong>{expiryLabel}</strong>.
        </div>
      ) : checkoutToken ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          Secure checkout link — no web sign-in needed. Tap Pay with Khalti to continue.
        </div>
      ) : user && businessId ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          You do not have an active premium overlay plan yet.
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          Use <strong>Pay Now</strong> in the Kinmel app, or{" "}
          <Link href="/login?next=%2Fpremium" className="font-semibold text-violet-700 underline">
            sign in
          </Link>{" "}
          on the web.
        </div>
      )}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => void onPay()}
          disabled={payBusy || !canPay}
          className="inline-flex flex-1 items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {payBusy ? "Opening Khalti…" : active ? "Renew with Khalti" : "Pay with Khalti"}
        </button>
        {user ? (
          <Link
            href="/live-selling"
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700"
          >
            Back to console
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
          Loading…
        </div>
      }
    >
      <PremiumPageInner />
    </Suspense>
  );
}
