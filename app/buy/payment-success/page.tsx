"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { postEsewaVerify, postKhaltiVerify } from "@/lib/checkoutClient";
import { KinmelBrandLink } from "@/components/KinmelLogo";

function PaymentSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data");
  const pidxParam = searchParams.get("pidx");
  const [status, setStatus] = useState<"working" | "ok" | "err">("working");
  const [message, setMessage] = useState("Verifying payment…");
  /** From verify response (URLs no longer carry product_id for wallet redirects). */
  const [contextProductId, setContextProductId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (dataParam) {
      (async () => {
        try {
          const result = await postEsewaVerify(dataParam);
          if (cancelled) return;
          const pid = (result.product_id ?? "").trim() || null;
          if (pid) setContextProductId(pid);
          if (result.ok && result.status === "paid") {
            setStatus("ok");
            setMessage("Payment confirmed. Redirecting…");
            const sp = new URLSearchParams({
              payment: "esewa",
              order_id: result.order_id ?? "",
              total: String(result.total ?? ""),
              currency: result.currency ?? "NPR",
              business_id: result.business_id ?? "",
            });
            if (pid) sp.set("product_id", pid);
            if (result.quantity != null && result.quantity > 0) {
              sp.set("quantity", String(result.quantity));
            }
            router.replace(`/buy/thank-you?${sp.toString()}`);
            return;
          }
          setStatus("err");
          setMessage(
            result.status
              ? `Payment not completed (status: ${result.status}).`
              : "Payment could not be confirmed."
          );
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
    }

    if (pidxParam) {
      (async () => {
        try {
          const result = await postKhaltiVerify(pidxParam);
          if (cancelled) return;
          const pid = (result.product_id ?? "").trim() || null;
          if (pid) setContextProductId(pid);
          if (result.ok && result.status === "paid") {
            setStatus("ok");
            setMessage("Payment confirmed. Redirecting…");
            const sp = new URLSearchParams({
              payment: "khalti",
              order_id: result.order_id ?? "",
              total: String(result.total ?? ""),
              currency: result.currency ?? "NPR",
              business_id: result.business_id ?? "",
            });
            if (pid) sp.set("product_id", pid);
            if (result.quantity != null && result.quantity > 0) {
              sp.set("quantity", String(result.quantity));
            }
            router.replace(`/buy/thank-you?${sp.toString()}`);
            return;
          }
          setStatus("err");
          setMessage(
            result.khalti_status
              ? `Payment not completed (Khalti: ${result.khalti_status}).`
              : result.status
                ? `Payment not completed (status: ${result.status}).`
                : "Payment could not be confirmed."
          );
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
    }

    setStatus("err");
    setMessage("Missing payment data. Return from the payment page was incomplete.");
    return () => {
      cancelled = true;
    };
  }, [dataParam, pidxParam, router]);

  return (
    <main className="mx-auto flex max-w-lg flex-1 flex-col gap-6 p-6">
      <KinmelBrandLink size="sm" tone="neutral" showWordmark={false} className="self-start" />
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
      {contextProductId ? (
        <Link
          href={`/buy/${encodeURIComponent(contextProductId)}`}
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
