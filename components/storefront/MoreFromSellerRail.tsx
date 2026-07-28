"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchPublicCatalogJson,
  type PublicCatalogProduct,
} from "@/lib/backendFetch";
import { formatStorefrontPrice } from "@/lib/formatNpr";
import { sellerShopUrl } from "@/lib/sellerShop";

function IconBag() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 7h12l-1 13H7L6 7z" />
      <path d="M9 7V5a3 3 0 016 0v2" />
    </svg>
  );
}

export function MoreFromSellerRail({
  businessId,
  excludeProductId,
  sellerName,
  sellerUsername,
}: {
  businessId: string;
  excludeProductId: string;
  sellerName: string;
  sellerUsername?: string;
}) {
  const [catalog, setCatalog] = useState<PublicCatalogProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchPublicCatalogJson({
          businessId,
          excludeProductId,
          limit: 12,
        });
        if (!cancelled) setCatalog(data.products ?? []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, excludeProductId]);

  if (!businessId) return null;
  if (!error && catalog.length === 0) return null;

  const viewAllHref = sellerUsername
    ? sellerShopUrl(sellerUsername)
    : `/buy/${encodeURIComponent(excludeProductId)}`;

  return (
    <section aria-labelledby="more-seller-heading" className="mt-6 border-t border-zinc-100 pt-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2
          id="more-seller-heading"
          className="flex min-w-0 items-center gap-2 text-sm font-semibold text-zinc-900"
        >
          <span className="shrink-0 text-violet-600">
            <IconBag />
          </span>
          <span className="truncate">More from {sellerName}</span>
        </h2>
        {sellerUsername ? (
          <Link
            href={viewAllHref}
            className="shrink-0 text-xs font-semibold text-violet-600 hover:text-violet-700"
          >
            View all ›
          </Link>
        ) : null}
      </div>
      {error ? <p className="mb-3 text-sm text-amber-700">{error}</p> : null}
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
            <div className="p-2.5">
              <p className="line-clamp-2 text-xs font-semibold text-zinc-900">{p.name}</p>
              <p className="mt-1 text-sm font-bold text-violet-600">
                {formatStorefrontPrice(p.price, p.currency)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
