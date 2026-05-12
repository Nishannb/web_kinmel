"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { fetchPublicProductJson } from "@/lib/backendFetch";
import { postCodCheckout, postEsewaInit, type EsewaInitResponse } from "@/lib/checkoutClient";

const COD_SURCHARGE = 0.05;

function money(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
}

export default function PublicBuyPage() {
  const params = useParams();
  const productId = typeof params?.productId === "string" ? params.productId : "";
  const formRef = useRef<HTMLFormElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<{
    name: string;
    price: number;
    currency: string;
    image_url: string;
    product_url: string;
  } | null>(null);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [codSuccess, setCodSuccess] = useState<string | null>(null);
  const [esewaPost, setEsewaPost] = useState<EsewaInitResponse | null>(null);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      setError("Missing product id.");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPublicProductJson(productId);
        if (!cancelled) {
          setProduct(data.product);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setProduct(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    if (!esewaPost || !formRef.current) return;
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("esewa_txn", esewaPost.transaction_uuid);
      }
    } catch {
      /* ignore */
    }
    formRef.current.submit();
  }, [esewaPost]);

  const payloadBase = () => ({
    product_id: productId,
    customer_name: customerName.trim(),
    phone: phone.trim(),
    address: address.trim(),
    city: city.trim(),
  });

  const onCod = async () => {
    setFormError(null);
    setCodSuccess(null);
    const p = payloadBase();
    if (!p.customer_name || !p.phone || !p.address) {
      setFormError("Please fill in your name, phone, and address.");
      return;
    }
    setBusy(true);
    try {
      const res = await postCodCheckout(p);
      setCodSuccess(res.message);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onEsewa = async () => {
    setFormError(null);
    setCodSuccess(null);
    const p = payloadBase();
    if (!p.customer_name || !p.phone || !p.address) {
      setFormError("Please fill in your name, phone, and address.");
      return;
    }
    setBusy(true);
    try {
      const res = await postEsewaInit(p);
      setEsewaPost(res);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto flex max-w-lg flex-1 flex-col gap-4 p-6">
        <p className="text-zinc-600">Loading product…</p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="mx-auto flex max-w-lg flex-1 flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold text-zinc-900">Product</h1>
        <p className="text-red-600">{error || "Not found."}</p>
      </main>
    );
  }

  const esewaAmount = product.price;
  const codAmount = Math.round(product.price * (1 + COD_SURCHARGE) * 100) / 100;

  return (
    <main className="mx-auto flex max-w-lg flex-1 flex-col gap-6 p-6">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt=""
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-zinc-100 text-zinc-400">
            No image
          </div>
        )}
        <div className="space-y-4 p-5">
          <h1 className="text-2xl font-semibold text-zinc-900">{product.name}</h1>

          <div className="space-y-1 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm">
            <p className="font-medium text-zinc-800">Pay with eSewa</p>
            <p className="text-lg font-semibold text-zinc-900">
              {money(esewaAmount, product.currency)}
            </p>
            <p className="mt-3 font-medium text-zinc-800">Cash on delivery</p>
            <p className="text-lg font-semibold text-zinc-900">
              {money(codAmount, product.currency)}
              <span className="ml-2 text-xs font-normal text-zinc-500">
                (includes {Math.round(COD_SURCHARGE * 100)}% COD fee)
              </span>
            </p>
          </div>

          {!checkoutOpen ? (
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Continue to checkout
            </button>
          ) : (
            <div className="space-y-4 border-t border-zinc-200 pt-4">
              <h2 className="text-sm font-semibold text-zinc-900">Delivery details</h2>
              <div className="space-y-3">
                <label className="block text-xs font-medium text-zinc-600">
                  Full name
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                    autoComplete="name"
                  />
                </label>
                <label className="block text-xs font-medium text-zinc-600">
                  Phone
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                    autoComplete="tel"
                  />
                </label>
                <label className="block text-xs font-medium text-zinc-600">
                  Address
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                    autoComplete="street-address"
                  />
                </label>
                <label className="block text-xs font-medium text-zinc-600">
                  City (optional)
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                    autoComplete="address-level2"
                  />
                </label>
              </div>

              {formError ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </p>
              ) : null}
              {codSuccess ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {codSuccess}
                </p>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onEsewa}
                  className="flex-1 rounded-lg bg-[#2FB344] px-4 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                >
                  Pay with eSewa ({money(esewaAmount, product.currency)})
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onCod}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
                >
                  Cash on delivery ({money(codAmount, product.currency)})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {esewaPost ? (
        <form
          ref={formRef}
          method="POST"
          action={esewaPost.payment_url}
          className="hidden"
          aria-hidden
        >
          {Object.entries(esewaPost.form_fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        </form>
      ) : null}
    </main>
  );
}
