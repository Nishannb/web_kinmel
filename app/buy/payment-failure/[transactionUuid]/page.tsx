"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Older Kinmel builds set failure_url to `/buy/payment-failure/{transaction_uuid}`.
 * Current backend uses `/buy/payment-failure` only. This route keeps old eSewa
 * redirects from 404ing — we send users to the flat failure page (Try again uses
 * localStorage set on checkout).
 */
export default function LegacyPaymentFailureRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/buy/payment-failure");
  }, [router]);

  return (
    <main className="mx-auto flex max-w-lg flex-1 flex-col gap-6 p-6">
      <p className="text-center text-zinc-600">Redirecting…</p>
    </main>
  );
}
