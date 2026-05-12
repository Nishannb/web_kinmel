"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { postEsewaVerify } from "@/lib/checkoutClient";

function PaymentSuccessInner() {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data");
  const productId = searchParams.get("product_id");
  const [status, setStatus] = useState<"working" | "ok" | "err">("working");
  const [message, setMessage] = useState("Verifying payment…");

  useEffect(() => {
    if (!dataParam) {
      setStatus("err");
      setMessage("Missing payment data. Return from eSewa was incomplete.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await postEsewaVerify(dataParam);
        if (cancelled) return;
        if (result.ok && result.status === "paid") {
          setStatus("ok");
          setMessage("Payment confirmed. Thank you for your order.");
        } else {
          setStatus("err");
          setMessage(
            result.status
              ? `Payment not completed (status: ${result.status}).`
              : "Payment could not be confirmed."
          );
        }
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
  }, [dataParam]);

  return (
    <main className="mx-auto flex max-w-lg flex-1 flex-col gap-6 p-6">
      <h1 className="text-xl font-semibold text-zinc-900">Payment</h1>
      <p
        className={
          status === "ok"
            ? "text-emerald-700"
            : status === "err"
              ? "text-red-600"
              : "text-zinc-600"
        }
      >
        {message}
      </p>
      {productId ? (
        <Link
          href={`/buy/${encodeURIComponent(productId)}`}
          className="text-sm font-medium text-zinc-900 underline"
        >
          Back to product
        </Link>
      ) : null}
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto p-6">
          <p className="text-zinc-600">Loading…</p>
        </main>
      }
    >
      <PaymentSuccessInner />
    </Suspense>
  );
}
