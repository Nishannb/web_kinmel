"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { KinmelBrandLink } from "@/components/KinmelLogo";

/**
 * eSewa redirected the user to failure_url, so the payment did not succeed.
 * We do NOT call Status Check here — success_url is where verification happens
 * (it carries the `data` payload). The failure page just shows a "Try again"
 * link to the same product page using the product_id we stashed before the form
 * POST (localStorage is shared across tabs of the same origin, so this works
 * even when eSewa opened in a new tab).
 */
function PaymentFailureInner() {
  const [productId, setProductId] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const pid = window.localStorage.getItem("kinmel_last_buy_product_id");
        if (pid) setProductId(pid);
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <main className="mx-auto flex max-w-lg flex-1 flex-col gap-6 p-6">
      <KinmelBrandLink size="sm" tone="neutral" showWordmark={false} className="self-start" />
      <h1 className="text-xl font-semibold text-zinc-900">Payment cancelled</h1>
      <p className="text-zinc-600">
        eSewa reported that the payment did not complete. You can try again from the product page.
      </p>
      {productId ? (
        <Link
          href={`/buy/${encodeURIComponent(productId)}`}
          className="inline-flex w-fit rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Try again
        </Link>
      ) : (
        <Link href="/" className="text-sm font-medium text-zinc-900 underline">
          Home
        </Link>
      )}
    </main>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto p-6">
          <p className="text-zinc-600">Loading…</p>
        </main>
      }
    >
      <PaymentFailureInner />
    </Suspense>
  );
}
