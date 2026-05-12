"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PaymentFailureInner() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product_id");

  return (
    <main className="mx-auto flex max-w-lg flex-1 flex-col gap-6 p-6">
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
