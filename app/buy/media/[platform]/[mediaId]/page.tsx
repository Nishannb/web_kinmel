"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  fetchPublicMediaProductsJson,
  type PublicMediaProduct,
} from "@/lib/backendFetch";
import {
  loadCheckoutBuyerDetails,
  saveCheckoutBuyerDetails,
} from "@/lib/checkoutBuyerDetails";
import { postCartCodCheckout } from "@/lib/checkoutClient";
import { formatStorefrontPrice } from "@/lib/formatNpr";
import { KinmelLogoMark } from "@/components/KinmelLogo";
import { LocationAddressInput } from "@/components/checkout/LocationAddressInput";
import { nepalCities } from "@/lib/nepalCities";

const COD_FLAT_FEE = 5;

type CartLine = {
  productId: string;
  quantity: number;
  variantId?: string;
};

function MediaCartPageInner() {
  const params = useParams<{ platform: string; mediaId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const platform = String(params.platform || "").trim().toLowerCase();
  const mediaId = String(params.mediaId || "").trim();
  const buyerKey = (search.get("bk") || "").trim();
  const affFromUrl = (search.get("aff") || "").trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<PublicMediaProduct[]>([]);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [phase, setPhase] = useState<"browse" | "checkout" | "done">("browse");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderIds, setOrderIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = loadCheckoutBuyerDetails();
    if (saved) {
      setName(saved.customerName || "");
      setPhone(saved.phone || "");
      setAddress(saved.address || "");
      setCity(saved.city || "");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!platform || !mediaId) {
        setError("Missing media link.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPublicMediaProductsJson({ platform, mediaId });
        if (cancelled) return;
        setProducts(data.products);
        // Pre-select all products so shoppers can deselect.
        const next: Record<string, CartLine> = {};
        for (const p of data.products) {
          const id = String(p.id || "").trim();
          if (!id) continue;
          const variants = p.variants || [];
          const firstInStock = variants.find((v) => v.stock_quantity > 0);
          next[id] = {
            productId: id,
            quantity: 1,
            variantId: firstInStock?.id,
          };
        }
        setCart(next);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load products.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [platform, mediaId]);

  const affiliateId = useMemo(() => {
    if (affFromUrl) return affFromUrl;
    for (const p of products) {
      const a = String(p.affiliate_influencer_business_id || "").trim();
      if (a) return a;
    }
    return "";
  }, [affFromUrl, products]);

  const selectedLines = useMemo(() => {
    return products
      .map((p) => {
        const line = cart[p.id];
        if (!line) return null;
        return { product: p, line };
      })
      .filter(Boolean) as Array<{ product: PublicMediaProduct; line: CartLine }>;
  }, [products, cart]);

  const subtotal = useMemo(() => {
    return selectedLines.reduce((sum, { product, line }) => {
      return sum + Number(product.price || 0) * Math.max(1, line.quantity);
    }, 0);
  }, [selectedLines]);

  const estimatedTotal = Math.round((subtotal + COD_FLAT_FEE) * 100) / 100;

  const toggleProduct = (productId: string) => {
    setCart((prev) => {
      if (prev[productId]) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      const product = products.find((p) => p.id === productId);
      const variants = product?.variants || [];
      const firstInStock = variants.find((v) => v.stock_quantity > 0);
      return {
        ...prev,
        [productId]: {
          productId,
          quantity: 1,
          variantId: firstInStock?.id,
        },
      };
    });
  };

  const setQty = (productId: string, quantity: number) => {
    setCart((prev) => {
      const line = prev[productId];
      if (!line) return prev;
      return {
        ...prev,
        [productId]: {
          ...line,
          quantity: Math.min(99, Math.max(1, quantity)),
        },
      };
    });
  };

  const setVariant = (productId: string, variantId: string) => {
    setCart((prev) => {
      const line = prev[productId];
      if (!line) return prev;
      return {
        ...prev,
        [productId]: { ...line, variantId },
      };
    });
  };

  const placeOrder = async () => {
    if (selectedLines.length < 1) {
      setSubmitError("Select at least one product.");
      return;
    }
    for (const { product, line } of selectedLines) {
      if ((product.variants || []).length > 0 && !line.variantId) {
        setSubmitError(`Choose a size for ${product.name}.`);
        return;
      }
    }
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      setSubmitError("Fill name, phone, address, and city.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      saveCheckoutBuyerDetails({
        customerName: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
      });
      const res = await postCartCodCheckout({
        items: selectedLines.map(({ line }) => ({
          product_id: line.productId,
          quantity: line.quantity,
          variant_id: line.variantId,
        })),
        customer_name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        buyer_key: buyerKey || undefined,
        affiliate_influencer_business_id: affiliateId || undefined,
      });
      const ids = (res.orders || [])
        .map((o) => o.order_id)
        .filter(Boolean);
      setOrderIds(ids);
      setPhase("done");
      if (ids.length === 1) {
        router.push(`/buy/thank-you?order_id=${encodeURIComponent(ids[0])}`);
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4">
        <p className="text-sm text-zinc-500">Loading products…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-zinc-700">{error}</p>
        <Link href="/" className="text-sm font-medium text-violet-600">
          Back to Kinmel
        </Link>
      </main>
    );
  }

  if (products.length === 0) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-zinc-700">No products are tagged on this video yet.</p>
        <Link href="/" className="text-sm font-medium text-violet-600">
          Back to Kinmel
        </Link>
      </main>
    );
  }

  if (phase === "done") {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900">Order placed</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Pay cash on delivery. {orderIds.length > 1 ? `${orderIds.length} orders created.` : ""}
        </p>
        <ul className="mt-4 space-y-1 text-sm text-zinc-700">
          {orderIds.map((id) => (
            <li key={id} className="font-mono text-xs">
              {id}
            </li>
          ))}
        </ul>
        <Link href="/" className="mt-6 inline-block text-sm font-medium text-violet-600">
          Continue shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-zinc-50 px-4 pb-28 pt-6">
      <header className="mb-5 flex items-center justify-between">
        <KinmelLogoMark className="h-8 w-auto" />
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          From this video
        </span>
      </header>

      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        {products.length === 1 ? "Buy this product" : "Shop products in this video"}
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Add what you want, then checkout with cash on delivery.
      </p>

      <ul className="mt-6 space-y-3">
        {products.map((product) => {
          const selected = Boolean(cart[product.id]);
          const line = cart[product.id];
          const variants = product.variants || [];
          return (
            <li
              key={product.id}
              className={`overflow-hidden rounded-2xl border bg-white ${
                selected ? "border-violet-300 ring-2 ring-violet-100" : "border-zinc-200"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleProduct(product.id)}
                className="flex w-full gap-3 p-3 text-left"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-900">{product.name}</p>
                    <span
                      className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                        selected
                          ? "border-violet-600 bg-violet-600 text-white"
                          : "border-zinc-300 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </div>
                  {product.seller?.business_name ? (
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {product.seller.business_name}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm font-medium text-violet-700">
                    {formatStorefrontPrice(product.price, product.currency || "NPR")}
                  </p>
                </div>
              </button>

              {selected && line ? (
                <div className="space-y-2 border-t border-zinc-100 px-3 py-3">
                  {variants.length > 0 ? (
                    <label className="block text-xs font-medium text-zinc-600">
                      Size
                      <select
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-2 text-sm"
                        value={line.variantId || ""}
                        onChange={(e) => setVariant(product.id, e.target.value)}
                      >
                        <option value="">Select size</option>
                        {variants.map((v) => (
                          <option
                            key={v.id}
                            value={v.id}
                            disabled={v.stock_quantity <= 0}
                          >
                            {v.label}
                            {v.stock_quantity <= 0 ? " (sold out)" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-600">Qty</span>
                    <div className="inline-flex items-center rounded-full border border-zinc-200">
                      <button
                        type="button"
                        className="px-3 py-1 text-sm"
                        onClick={() => setQty(product.id, line.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm font-semibold">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        className="px-3 py-1 text-sm"
                        onClick={() => setQty(product.id, line.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <Link
                    href={`/buy/${encodeURIComponent(product.id)}${
                      buyerKey || affiliateId
                        ? `?${new URLSearchParams({
                            ...(buyerKey ? { bk: buyerKey } : {}),
                            ...(affiliateId ? { aff: affiliateId } : {}),
                          }).toString()}`
                        : ""
                    }`}
                    className="inline-block text-xs font-medium text-violet-600"
                  >
                    Open full product page
                  </Link>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {phase === "checkout" ? (
        <section className="mt-6 space-y-3 rounded-2xl border border-zinc-200 bg-white p-4">
          <h2 className="text-base font-semibold text-zinc-900">Delivery details</h2>
          <input
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
          />
          <LocationAddressInput
            id="media-cart-address"
            value={address}
            onChange={setAddress}
          />
          <LocationAddressInput
            id="media-cart-city"
            as="input"
            replaceEntireValue
            tokens={nepalCities}
            value={city}
            onChange={setCity}
            placeholder="City"
          />
          <p className="text-xs text-zinc-500">
            COD fee NPR {COD_FLAT_FEE} per seller order. Estimated total{" "}
            <span className="font-semibold text-zinc-800">
              {formatStorefrontPrice(estimatedTotal, "NPR")}
            </span>
            {selectedLines.length > 1 ? " (may split by seller)." : "."}
          </p>
          {submitError ? (
            <p className="text-sm text-red-600">{submitError}</p>
          ) : null}
          <button
            type="button"
            disabled={submitting}
            onClick={() => void placeOrder()}
            className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Placing order…" : "Place COD order"}
          </button>
          <button
            type="button"
            className="w-full py-2 text-sm text-zinc-600"
            onClick={() => setPhase("browse")}
          >
            Back to products
          </button>
        </section>
      ) : null}

      {phase === "browse" ? (
        <div className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <div>
              <p className="text-xs text-zinc-500">
                {selectedLines.length} selected · est.{" "}
                {formatStorefrontPrice(estimatedTotal, "NPR")}
              </p>
            </div>
            <button
              type="button"
              disabled={selectedLines.length < 1}
              onClick={() => {
                setSubmitError(null);
                setPhase("checkout");
              }}
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Checkout
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function MediaBuyPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4">
          <p className="text-sm text-zinc-500">Loading…</p>
        </main>
      }
    >
      <MediaCartPageInner />
    </Suspense>
  );
}
