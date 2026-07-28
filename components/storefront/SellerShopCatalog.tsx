import Link from "next/link";
import { fetchPublicCatalogJson, type PublicCatalogProduct } from "@/lib/backendFetch";
import { formatStorefrontPrice } from "@/lib/formatNpr";
import { KinmelBrandLink } from "@/components/KinmelLogo";
import type { SellerRelayResult } from "@/lib/sellerShop";

function sellerDisplayName(relay: SellerRelayResult): string {
  const ig = (relay.instagram_username || relay.seller_username || "").trim().replace(/^@+/, "");
  if (ig) return `@${ig}`;
  return relay.business_name?.trim() || "this seller";
}

export async function SellerShopCatalog({
  relay,
}: {
  relay: SellerRelayResult;
}) {
  const businessId = relay.business_id || "";
  let catalog: PublicCatalogProduct[] = [];
  let catalogError: string | null = null;

  if (businessId) {
    try {
      const data = await fetchPublicCatalogJson({ businessId, limit: 24 });
      catalog = data.products ?? [];
    } catch (e) {
      catalogError = e instanceof Error ? e.message : String(e);
    }
  }

  const name = sellerDisplayName(relay);
  const liveNoProduct = relay.live_active && !relay.product_id;

  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      <header className="border-b border-zinc-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4 py-3">
          <KinmelBrandLink size="sm" tone="brand" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-zinc-900">Shop {name}</h1>
          {relay.live_active ? (
            <p className="mt-2 text-sm text-emerald-600 font-medium">● Live now</p>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">Browse products from {name}</p>
          )}
          {liveNoProduct ? (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              The seller hasn&apos;t put a product on screen yet. Check back in a moment or
              pick from the catalog below.
            </p>
          ) : null}
        </div>

        {catalogError ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {catalogError}
          </p>
        ) : null}

        {catalog.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">No products available right now.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {catalog.map((p) => (
              <Link
                key={String(p.id)}
                href={`/buy/${encodeURIComponent(String(p.id))}`}
                className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:border-violet-200"
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
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-semibold text-zinc-900">{p.name}</p>
                  <p className="mt-1 text-sm font-bold text-violet-600">
                    {formatStorefrontPrice(p.price, p.currency)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
