"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  fetchPublicCatalogJson,
  fetchPublicProductJson,
  type PublicCatalogProduct,
} from "@/lib/backendFetch";
import { formatStorefrontPrice } from "@/lib/formatNpr";
import { KinmelBrandLink } from "@/components/KinmelLogo";

function IconShield({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function IconCash() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

function IconBagPaid() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function IconBag() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 7h12l-1 13H7L6 7z" />
      <path d="M9 7V5a3 3 0 016 0v2" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function ConfettiBurst() {
  const bits = [
    { className: "left-1 top-2 size-1.5 bg-pink-400", rotate: "rotate-12" },
    { className: "right-2 top-1 size-1.5 bg-amber-400", rotate: "-rotate-6" },
    { className: "left-0 top-8 size-1 bg-violet-400", rotate: "rotate-45" },
    { className: "right-0 top-7 size-1.5 bg-sky-400", rotate: "rotate-12" },
    { className: "-left-1 top-4 size-1 bg-emerald-400", rotate: "-rotate-12" },
    { className: "-right-1 top-5 size-1 bg-rose-400", rotate: "rotate-6" },
    { className: "left-3 -top-0.5 size-1 bg-fuchsia-400", rotate: "rotate-45" },
    { className: "right-4 -top-1 size-1 bg-yellow-400", rotate: "-rotate-12" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          className={`absolute rounded-sm ${b.className} ${b.rotate}`}
        />
      ))}
    </div>
  );
}

function WalletArt() {
  return (
    <div className="relative h-16 w-16 shrink-0" aria-hidden>
      <div className="absolute inset-x-1 bottom-1 top-4 rounded-xl bg-emerald-500 shadow-sm" />
      <div className="absolute inset-x-2 top-2 h-8 rounded-lg border-2 border-emerald-300 bg-emerald-100" />
      <div className="absolute -right-0.5 top-5 h-5 w-5 rounded-full bg-amber-300 shadow-sm ring-2 ring-amber-200" />
      <div className="absolute right-3 top-0.5 h-4 w-7 rounded-md bg-emerald-400/90" />
      <div className="absolute left-3 top-1 h-3.5 w-6 rounded-md bg-lime-300/90" />
    </div>
  );
}

function formatSellerName(seller?: {
  business_name?: string;
  instagram_username?: string;
}): string {
  const name = (seller?.business_name || "").trim();
  if (name) return name;
  const ig = (seller?.instagram_username || "").trim().replace(/^@/, "");
  if (ig) return `@${ig}`;
  return "Kinmel store";
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
    Math.max(1, Math.floor(Number.parseInt(searchParams.get("quantity") || "1", 10) || 1)),
  );

  const [catalog, setCatalog] = useState<PublicCatalogProduct[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [sellerName, setSellerName] = useState("Kinmel store");

  useEffect(() => {
    const seq = ++fetchSeq.current;
    (async () => {
      try {
        let bid = businessIdParam;
        if (productIdParam) {
          const data = await fetchPublicProductJson(productIdParam);
          if (seq !== fetchSeq.current) return;
          bid = bid || data.product.business_id || "";
          setSellerName(formatSellerName(data.product.seller));
        }
        if (!bid) {
          if (seq === fetchSeq.current) setCatalog([]);
          return;
        }
        const { products } = await fetchPublicCatalogJson({
          businessId: bid,
          excludeProductId: productIdParam || undefined,
          limit: 12,
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

  const paymentLabel = isCod
    ? "Pay on delivery"
    : payment === "khalti"
      ? "Paid with Khalti"
      : payment === "esewa"
        ? "Paid with eSewa"
        : "Payment confirmed";

  const paymentHint = isCod
    ? `Cash on delivery — total for ${quantityParam} unit${quantityParam === 1 ? "" : "s"}. Please have this amount ready for the courier.`
    : payment === "khalti"
      ? "Your Khalti payment was confirmed. The seller will prepare your order soon."
      : payment === "esewa"
        ? "Your eSewa payment was confirmed. The seller will prepare your order soon."
        : "Your order was placed successfully.";

  const viewAllHref = "/";

  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      <header className="border-b border-zinc-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4 py-3">
          <KinmelBrandLink size="sm" tone="brand" />
          <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-violet-700">
            <span>Secure Checkout</span>
            <IconShield className="text-violet-600" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-10 pt-6">
        <div className="mb-5 text-center">
          <div className="relative mx-auto mb-4 flex size-16 items-center justify-center">
            <ConfettiBurst />
            <div className="relative flex size-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
              <IconCheck />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Thank you!</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
            Your order has been placed successfully. The seller will prepare and deliver your product soon.
          </p>
        </div>

        {total > 0 ? (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-4 shadow-sm">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              {isCod ? <IconCash /> : <IconBagPaid />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-700">{paymentLabel}</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-emerald-600">
                {formatStorefrontPrice(total, orderCurrency)}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-zinc-600">{paymentHint}</p>
            </div>
            {isCod ? <WalletArt /> : null}
          </div>
        ) : (
          <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-4 text-sm text-zinc-600 shadow-sm">
            {paymentHint}
          </div>
        )}

        {catalog.length > 0 ? (
          <section aria-labelledby="more-heading" className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2
                id="more-heading"
                className="flex min-w-0 items-center gap-2 text-sm font-semibold text-zinc-900"
              >
                <span className="shrink-0 text-violet-600">
                  <IconBag />
                </span>
                <span className="truncate">More from {sellerName}</span>
              </h2>
              <Link
                href={viewAllHref}
                className="shrink-0 text-xs font-semibold text-violet-600 hover:text-violet-700"
              >
                View all ›
              </Link>
            </div>
            {catalogError ? (
              <p className="mb-3 text-sm text-amber-700">{catalogError}</p>
            ) : null}
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {catalog.map((p) => (
                <Link
                  key={String(p.id)}
                  href={`/buy/${encodeURIComponent(String(p.id))}`}
                  className="w-36 shrink-0 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:border-violet-200"
                >
                  <div className="aspect-square bg-zinc-100">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="relative p-2.5">
                    <p className="line-clamp-2 min-h-[2.5rem] text-xs font-semibold text-zinc-900">
                      {p.name}
                    </p>
                    <div className="mt-1 flex items-end justify-between gap-2">
                      <p className="text-sm font-bold text-emerald-600">
                        {formatStorefrontPrice(p.price, p.currency)}
                      </p>
                      <span className="flex size-7 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                        <IconPlus />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <Link
          href="/"
          className="mt-2 flex w-full items-center justify-between rounded-2xl bg-violet-600 px-5 py-4 text-sm font-semibold text-white shadow-md shadow-violet-200/60 hover:bg-violet-700"
        >
          <span className="inline-flex items-center gap-2">
            <IconBag />
            Continue Shopping
          </span>
          <IconChevron />
        </Link>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-zinc-500">
          <IconShield />
          Your information is secure and encrypted
        </p>
      </main>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-zinc-50 p-8">
          <p className="text-zinc-500">Loading…</p>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
