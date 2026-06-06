"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchPublicCatalogJson, fetchPublicProductJson, type PublicCatalogProduct } from "@/lib/backendFetch";
import { formatStorefrontPrice } from "@/lib/formatNpr";
import { KinmelBrandLink } from "@/components/KinmelLogo";

const accent = {
  text: "text-emerald-600",
  bgSoft: "bg-emerald-50/90",
  borderSoft: "border-emerald-200",
};

function StepperComplete() {
  const steps = ["Review", "Payment", "Confirm"];
  return (
    <div className="mb-8 flex items-center justify-center gap-1 sm:gap-3">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-1 sm:gap-3">
          <div className="flex flex-col items-center gap-1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white ring-4 ring-emerald-100">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            <span className="whitespace-nowrap text-center text-[11px] font-medium text-zinc-900 sm:text-sm">{label}</span>
          </div>
          {i < steps.length - 1 ? (
            <div className="mb-5 hidden h-px w-6 shrink-0 bg-emerald-400 sm:block sm:w-12 md:w-16" aria-hidden />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ThankYouContent() {
  const searchParams = useSearchParams();
  const fetchSeq = useRef(0);

  const payment = searchParams.get("payment") || "";
  const isCod = payment === "cod";
  const total = Number.parseFloat(searchParams.get("total") || "0") || 0;
  const currencyParam = (searchParams.get("currency") || "").trim();
  const orderCurrency = currencyParam || "NPR";
  const businessIdParam = searchParams.get("business_id") || "";
  const productIdParam = searchParams.get("product_id") || "";
  const quantityParam = Math.min(
    99,
    Math.max(1, Math.floor(Number.parseInt(searchParams.get("quantity") || "1", 10) || 1))
  );

  const [catalog, setCatalog] = useState<PublicCatalogProduct[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    const seq = ++fetchSeq.current;
    (async () => {
      try {
        let bid = businessIdParam;
        if (!bid && productIdParam) {
          const data = await fetchPublicProductJson(productIdParam);
          if (seq !== fetchSeq.current) return;
          bid = data.product.business_id || "";
        }
        if (!bid) {
          if (seq === fetchSeq.current) setCatalog([]);
          return;
        }
        const { products } = await fetchPublicCatalogJson({
          businessId: bid,
          excludeProductId: productIdParam || undefined,
          limit: 24,
        });
        if (seq !== fetchSeq.current) return;
        setCatalog(products);
        setCatalogError(null);
      } catch (e) {
        if (seq !== fetchSeq.current) return;
        setCatalogError(e instanceof Error ? e.message : String(e));
        setCatalog([]);
      }
    })();
  }, [businessIdParam, productIdParam]);

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="border-b border-zinc-100 bg-white/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <KinmelBrandLink size="sm" tone="neutral" />
          <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-zinc-800">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="hidden sm:inline">Secure checkout </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-12 pt-6">
        <StepperComplete />

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">Thank you for your order!</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-600 md:text-base">
            The seller will prepare and deliver your product soon. You&apos;ll receive updates from them as your order moves along.
          </p>
          {quantityParam > 1 ? (
            <p className="mx-auto mt-2 max-w-lg text-sm font-medium text-zinc-800">
              {quantityParam} units in this order
            </p>
          ) : null}
        </div>

        {isCod && total > 0 ? (
          <div
            className={`mx-auto mb-10 max-w-lg rounded-2xl border px-6 py-6 text-center ${accent.borderSoft} ${accent.bgSoft}`}
          >
            <p className="text-sm font-medium text-zinc-700">Total to pay on delivery</p>
            <p className={`mt-2 text-4xl font-bold tabular-nums md:text-5xl ${accent.text}`}>
              {formatStorefrontPrice(total, orderCurrency)}
            </p>
            <p className="mt-2 text-xs text-zinc-600">
              Cash on delivery — total for {quantityParam} unit{quantityParam === 1 ? "" : "s"}. Please have this amount ready
              for the courier.
            </p>
          </div>
        ) : null}

        {!isCod && (payment === "esewa" || payment === "khalti") ? (
          <div className="mx-auto mb-10 max-w-lg space-y-4 text-center">
            {total > 0 ? (
              <div
                className={`rounded-2xl border px-6 py-6 text-center ${accent.borderSoft} ${accent.bgSoft}`}
              >
                <p className="text-sm font-medium text-zinc-700">Amount paid</p>
                <p className={`mt-2 text-3xl font-bold tabular-nums md:text-4xl ${accent.text}`}>
                  {formatStorefrontPrice(total, orderCurrency)}
                </p>
                {quantityParam > 1 ? (
                  <p className="mt-2 text-xs text-zinc-600">For {quantityParam} units (order total).</p>
                ) : null}
              </div>
            ) : null}
            <p className="text-sm text-zinc-600">
              {payment === "khalti"
                ? "Your Khalti payment was confirmed. The seller will ship your order according to their timeline."
                : "Your eSewa payment was confirmed. The seller will ship your order according to their timeline."}
            </p>
          </div>
        ) : null}

        {catalog.length > 0 ? (
          <section aria-labelledby="more-heading">
            <h2 id="more-heading" className="mb-4 text-lg font-semibold text-zinc-900">
              More you might like
            </h2>
            {catalogError ? <p className="mb-4 text-sm text-amber-700">{catalogError}</p> : null}
            <div className="columns-2 gap-4 sm:columns-3 md:columns-4">
              {catalog.map((p) => (
                <Link
                  key={String(p.id)}
                  href={`/buy/${encodeURIComponent(String(p.id))}`}
                  className="mb-4 block break-inside-avoid overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="bg-zinc-100">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt="" className="w-full object-cover" style={{ maxHeight: "280px" }} />
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center text-zinc-400">No image</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-medium text-zinc-900">{p.name}</p>
                    <p className={`mt-1 text-sm font-semibold ${accent.text}`}>
                      {formatStorefrontPrice(p.price, p.currency)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-10 text-center">
          <Link href="/" className={`text-sm font-medium ${accent.text} hover:underline`}>
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-white p-8">
          <p className="text-zinc-500">Loading…</p>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
