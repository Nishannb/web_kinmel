"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { fetchPublicProductJson } from "@/lib/backendFetch";
import { postCodCheckout, postEsewaInit, postKhaltiInit, type EsewaInitResponse } from "@/lib/checkoutClient";
import { formatStorefrontPrice, isNepalRupeesCurrency } from "@/lib/formatNpr";
import { KinmelBrandLink, KinmelLogoMark } from "@/components/KinmelLogo";

function persistEsewaCheckoutContext(productId: string, transactionUuid: string) {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(`esewa_form_posted:${transactionUuid}`, "1");
    window.sessionStorage.setItem("esewa_txn", transactionUuid);
    window.localStorage.setItem("kinmel_last_buy_product_id", productId);
  } catch {
    /* ignore */
  }
}

/** POST signed fields to eSewa in the same window (required on mobile Safari / Instagram). */
function submitEsewaPaymentGateway(res: EsewaInitResponse) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = res.payment_url;
  form.target = "_self";
  form.style.display = "none";
  for (const [name, value] of Object.entries(res.form_fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

const COD_SURCHARGE = 0.05;

/** Light green accent (emerald) for checkout UI */
const accent = {
  btn: "bg-emerald-500 hover:bg-emerald-600",
  btnText: "text-white",
  ring: "ring-emerald-100",
  border: "border-emerald-500",
  borderSoft: "border-emerald-200",
  bgSoft: "bg-emerald-50/90",
  text: "text-emerald-600",
  textDark: "text-emerald-700",
  focus: "focus:border-emerald-400 focus:ring-emerald-500/20",
  stepDone: "bg-emerald-500",
  stepLine: "bg-emerald-400",
  link: "text-emerald-600 hover:text-emerald-700",
};

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function formatSellerLine(seller?: {
  business_name?: string;
  instagram_username?: string;
}): string | null {
  if (!seller) return null;
  const ig = (seller.instagram_username || "").trim().replace(/^@/, "");
  const name = (seller.business_name || "").trim();
  if (ig && name) return `@${ig} (${name})`;
  if (ig) return `@${ig}`;
  if (name) return name;
  return null;
}

function Stepper({ phase }: { phase: "details" | "payment" }) {
  const steps = [
    { id: "review" as const, label: "Review" },
    { id: "payment" as const, label: "Payment" },
    { id: "confirm" as const, label: "Confirm" },
  ];
  const activeIndex = phase === "details" ? 0 : 1;

  return (
    <div className="mb-8 flex items-center justify-center gap-1 sm:gap-3">
      {steps.map((s, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        const isFuture = i > activeIndex;
        return (
          <div key={s.id} className="flex items-center gap-1 sm:gap-3">
            <div className="flex flex-col items-center gap-1">
              <span
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  done && `${accent.stepDone} text-white`,
                  active && !done && `${accent.stepDone} text-white ring-4 ${accent.ring}`,
                  isFuture && "border-2 border-zinc-200 bg-white text-zinc-400",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {done ? <IconCheck /> : i + 1}
              </span>
              <span
                className={[
                  "whitespace-nowrap text-center text-[11px] font-medium sm:text-sm",
                  active || done ? "text-zinc-900" : "text-zinc-400",
                ].join(" ")}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <div
                className={[
                  "mb-5 hidden h-px w-6 shrink-0 sm:block sm:w-12 md:w-16",
                  i < activeIndex ? accent.stepLine : "bg-zinc-200",
                ].join(" ")}
                aria-hidden
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function PublicBuyPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const productId = typeof params?.productId === "string" ? params.productId : "";
  const fetchSeqRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<{
    name: string;
    description?: string;
    price: number;
    currency: string;
    image_url: string;
    product_url: string;
    business_id?: string;
    stock_quantity?: number | null;
    sold_out?: boolean;
    seller?: {
      business_name?: string;
      instagram_username?: string;
    };
  } | null>(null);

  const [phase, setPhase] = useState<"details" | "payment">("details");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"esewa" | "khalti" | "cod">("esewa");
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [esewaPost, setEsewaPost] = useState<EsewaInitResponse | null>(null);

  useEffect(() => {
    if (paymentMethod !== "esewa") {
      setEsewaPost(null);
    }
  }, [paymentMethod]);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      setError("Missing product id.");
      return;
    }
    const seq = ++fetchSeqRef.current;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = await fetchPublicProductJson(productId);
        if (seq !== fetchSeqRef.current) return;
        setProduct(data.product);
      } catch (e) {
        if (seq !== fetchSeqRef.current) return;
        setError(e instanceof Error ? e.message : String(e));
        setProduct(null);
      } finally {
        if (seq === fetchSeqRef.current) {
          setLoading(false);
        }
      }
    })();
  }, [productId, pathname]);

  useEffect(() => {
    if (!product) return;
    if (!isNepalRupeesCurrency(product.currency) && paymentMethod === "khalti") {
      setPaymentMethod("esewa");
    }
  }, [product, paymentMethod]);

  useEffect(() => {
    if (!product) return;
    const tracked =
      product.stock_quantity != null
        ? Math.max(0, Math.floor(product.stock_quantity))
        : null;
    const soldOut = product.sold_out === true || tracked === 0;
    if (soldOut) {
      setQuantity(1);
      return;
    }
    if (tracked != null && quantity > tracked) {
      setQuantity(Math.max(1, tracked));
    }
  }, [product, quantity]);

  const payloadBase = () => ({
    product_id: productId,
    customer_name: customerName.trim(),
    phone: phone.trim(),
    address: address.trim(),
    city: city.trim(),
    quantity,
  });

  const validateDetails = () => {
    const p = payloadBase();
    if (!p.customer_name || !p.phone || !p.address || !p.city) {
      setFormError("Please enter your name, delivery address, city, and phone number.");
      return false;
    }
    setFormError(null);
    return true;
  };

  const goToPayment = () => {
    if (!validateDetails()) return;
    setPhase("payment");
  };

  const onContinueCheckout = async () => {
    setFormError(null);
    if (!validateDetails()) {
      setPhase("details");
      return;
    }
    setBusy(true);
    try {
      if (paymentMethod === "cod") {
        const res = await postCodCheckout(payloadBase());
        const bid = res.business_id || product?.business_id || "";
        const sp = new URLSearchParams({
          payment: "cod",
          order_id: res.order_id,
          total: String(res.total),
          currency: res.currency,
          product_id: productId,
          quantity: String(res.quantity ?? quantity),
        });
        if (bid) sp.set("business_id", bid);
        router.push(`/buy/thank-you?${sp.toString()}`);
      } else if (paymentMethod === "khalti") {
        const res = await postKhaltiInit(payloadBase());
        try {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("khalti_pidx", res.pidx);
          }
        } catch {
          /* ignore */
        }
        window.location.href = res.payment_url;
      } else {
        const res = await postEsewaInit(payloadBase());
        persistEsewaCheckoutContext(productId, res.transaction_uuid);
        setEsewaPost(res);
        submitEsewaPaymentGateway(res);
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-white">
        <main className="mx-auto max-w-5xl px-4 py-10">
          <p className="text-center text-zinc-500">Loading product…</p>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-full bg-white">
        <main className="mx-auto max-w-lg px-4 py-10">
          <h1 className="text-lg font-semibold text-zinc-900">Product</h1>
          <p className="mt-2 text-red-600">{error || "Not found."}</p>
          <Link href="/" className={`mt-6 inline-block text-sm font-medium ${accent.link}`}>
            Go home
          </Link>
        </main>
      </div>
    );
  }

  const unitPrice = product.price;
  const codUnitWithFee = Math.round(unitPrice * (1 + COD_SURCHARGE) * 100) / 100;
  const esewaLineTotal = Math.round(unitPrice * quantity * 100) / 100;
  const codLineTotal = Math.round(codUnitWithFee * quantity * 100) / 100;
  const codFeeTotal = Math.round((codLineTotal - esewaLineTotal) * 100) / 100;
  const displayTotal = paymentMethod === "cod" ? codLineTotal : esewaLineTotal;
  const desc = (product.description || "").trim();
  const sellerLine = formatSellerLine(product.seller);
  const isNpr = isNepalRupeesCurrency(product.currency);
  const priceCcy = product.currency;
  const trackedStock =
    product.stock_quantity != null ? Math.max(0, Math.floor(product.stock_quantity)) : null;
  const isSoldOut = product.sold_out === true || trackedStock === 0;
  const maxPurchasable =
    trackedStock == null ? 99 : Math.min(99, Math.max(0, trackedStock));

  const setQty = (n: number) => {
    const upper = isSoldOut ? 1 : maxPurchasable;
    const clamped = Math.min(upper, Math.max(1, Math.floor(n)));
    setQuantity(clamped);
  };

  const paymentCardClass = (selected: boolean, opts?: { disabled?: boolean }) => {
    const disabled = opts?.disabled;
    return [
      "flex flex-col rounded-2xl border-2 p-4 text-left transition-all outline-none",
      disabled
        ? "cursor-not-allowed border-zinc-100 bg-zinc-50 opacity-60"
        : [
            "cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/40",
            "focus-visible:ring-4 focus-visible:ring-emerald-500/25",
            selected
              ? `${accent.border} ${accent.bgSoft} shadow-sm ring-1 ${accent.borderSoft}`
              : "border-zinc-200 bg-white",
          ].join(" "),
    ].join(" ");
  };

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="sticky top-0 z-10 border-b border-zinc-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <KinmelBrandLink size="sm" tone="neutral" />
          <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-zinc-800">
            <span>Secure Checkout</span>
            <IconShield />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6">
        <Stepper phase={phase} />

        <div className="mb-6 grid gap-6 md:grid-cols-2 md:items-start md:gap-10">
          <div className="overflow-hidden rounded-2xl bg-zinc-100 md:sticky md:top-28">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt="" className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center text-zinc-400">No image</div>
            )}
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">{product.name}</h1>
            {isSoldOut ? (
              <p className="text-lg font-bold text-red-600">Already Sold out!</p>
            ) : trackedStock != null ? (
              <p className="text-sm font-medium text-emerald-700">
                {trackedStock} {trackedStock === 1 ? "piece" : "pieces"} available
              </p>
            ) : null}
            {desc ? <p className="text-sm leading-relaxed text-zinc-500 md:text-base">{desc}</p> : null}
            <div className="flex flex-wrap items-center gap-4">
              <p className={`text-2xl font-bold md:text-3xl ${accent.text}`}>
                {formatStorefrontPrice(unitPrice, priceCcy)}
                <span className="ml-1 text-sm font-normal text-zinc-500">each</span>
              </p>
              {!isSoldOut ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-700">Qty</span>
                <div className="flex items-center rounded-xl border border-zinc-200 bg-white">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    className="px-3 py-2 text-lg font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                    disabled={quantity <= 1}
                    onClick={() => setQty(quantity - 1)}
                  >
                    −
                  </button>
                  <span className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    className="px-3 py-2 text-lg font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                    disabled={quantity >= maxPurchasable}
                    onClick={() => setQty(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              ) : null}
            </div>
            <p className="text-sm text-zinc-600">
              <span className="font-medium text-zinc-700">Seller: </span>
              {sellerLine ?? "—"}
            </p>
          </div>
        </div>

        <div
          className={`mb-6 flex gap-3 rounded-xl border px-4 py-3 text-sm text-zinc-700 ${accent.borderSoft} ${accent.bgSoft}`}
        >
          <span className={`shrink-0 ${accent.text}`}>
            <IconLock />
          </span>
          <p>Your payment is safe and secure. Kinmel protects your information and payments. Shipping is handled by seller themselves.</p>
        </div>

        <div className="overflow-hidden">
          {isSoldOut ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
              <p className="text-xl font-bold text-red-700">Already Sold out!</p>
              <p className="mt-2 text-sm text-red-600">
                This item is no longer available. Check back later or contact the seller.
              </p>
            </div>
          ) : (
          <div
            className={[
              "flex w-[200%] transition-transform duration-300 ease-out motion-reduce:transition-none",
              phase === "payment" ? "-translate-x-1/2" : "translate-x-0",
            ].join(" ")}
          >
            <section className="w-1/2 shrink-0 pr-2 md:pr-4" aria-labelledby="details-heading">
              <h2 id="details-heading" className="mb-4 text-lg font-semibold text-zinc-900">
                Your details
              </h2>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-zinc-700">
                  Full name
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ring-emerald-500/15 ${accent.focus}`}
                    autoComplete="name"
                  />
                </label>
                <label className="block text-sm font-medium text-zinc-700">
                  Delivery address
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className={`mt-1.5 w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ring-emerald-500/15 ${accent.focus}`}
                    autoComplete="street-address"
                  />
                </label>
                <label className="block text-sm font-medium text-zinc-700">
                  City
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={`mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ring-emerald-500/15 ${accent.focus}`}
                    autoComplete="address-level2"
                  />
                </label>
                <label className="block text-sm font-medium text-zinc-700">
                  Phone number
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ring-emerald-500/15 ${accent.focus}`}
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </label>
              </div>

              {formError && phase === "details" ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>
              ) : null}

              <button
                type="button"
                onClick={goToPayment}
                className={`mt-6 w-full rounded-2xl px-4 py-4 text-sm font-semibold shadow-sm ${accent.btn} ${accent.btnText}`}
              >
                Continue
              </button>
            </section>

            <section className="w-1/2 shrink-0 pl-2 md:pl-4" aria-labelledby="payment-heading">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 id="payment-heading" className="text-lg font-semibold text-zinc-900">
                  Choose your payment
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setPhase("details");
                    setFormError(null);
                  }}
                  className={`text-sm font-medium ${accent.link} underline-offset-2 hover:underline`}
                >
                  Edit details
                </button>
              </div>

              <div className="flex flex-col gap-3" role="radiogroup" aria-label="Payment method">
                <button
                  type="button"
                  role="radio"
                  aria-checked={paymentMethod === "esewa"}
                  onClick={() => {
                    setPaymentMethod("esewa");
                    setFormError(null);
                  }}
                  className={paymentCardClass(paymentMethod === "esewa")}
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span
                      className={[
                        "flex h-4 w-4 shrink-0 rounded-full border-2",
                        paymentMethod === "esewa" ? `${accent.border} bg-emerald-500` : "border-zinc-300 bg-white",
                      ].join(" ")}
                      aria-hidden
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/payment-app-logo/esewa_logo.png"
                      alt=""
                      className="h-9 w-auto object-contain"
                    />
                    <span className="text-sm font-bold text-zinc-900">Pay with eSewa</span>
                  </div>
                  <p className="text-xs text-zinc-600">Pay securely with your eSewa wallet</p>
                  <p className={`mt-2 text-lg font-bold ${accent.text}`}>{formatStorefrontPrice(esewaLineTotal, priceCcy)}</p>
                  <p className="text-[10px] text-zinc-500">
                    {quantity} × {formatStorefrontPrice(unitPrice, priceCcy)}
                  </p>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={paymentMethod === "khalti"}
                  disabled={!isNpr}
                  onClick={() => {
                    if (!isNpr) return;
                    setPaymentMethod("khalti");
                    setFormError(null);
                  }}
                  className={paymentCardClass(paymentMethod === "khalti", { disabled: !isNpr })}
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span
                      className={[
                        "flex h-4 w-4 shrink-0 rounded-full border-2",
                        paymentMethod === "khalti" ? `${accent.border} bg-emerald-500` : "border-zinc-300 bg-white",
                      ].join(" ")}
                      aria-hidden
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/payment-app-logo/khalti_logo.png"
                      alt=""
                      className="h-9 w-auto object-contain"
                    />
                    <span className="text-sm font-bold text-zinc-900">Pay with Khalti & Banking</span>
                  </div>
                  <p className="text-xs text-zinc-600">
                    {isNpr
                      ? "Pay with Khalti wallet or linked banks (where supported)"
                      : "Khalti is available only when the product price is in NPR."}
                  </p>
                  <p className={`mt-2 text-lg font-bold ${accent.text}`}>{formatStorefrontPrice(esewaLineTotal, priceCcy)}</p>
                  <p className="text-[10px] text-zinc-500">
                    {quantity} × {formatStorefrontPrice(unitPrice, priceCcy)}
                  </p>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={paymentMethod === "cod"}
                  onClick={() => {
                    setPaymentMethod("cod");
                    setFormError(null);
                  }}
                  className={paymentCardClass(paymentMethod === "cod")}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={[
                        "flex h-4 w-4 shrink-0 rounded-full border-2",
                        paymentMethod === "cod" ? `${accent.border} bg-emerald-500` : "border-zinc-300 bg-white",
                      ].join(" ")}
                      aria-hidden
                    />
                    <span className="text-sm font-bold text-zinc-900">Cash on delivery</span>
                  </div>
                  <p className="text-xs text-zinc-600">Pay when you receive your order</p>
                  <p className={`mt-2 text-lg font-bold ${accent.text}`}>
                    {formatStorefrontPrice(codLineTotal, priceCcy)}
                    <span className="ml-1 block text-[10px] font-normal text-zinc-500 sm:inline sm:ml-2">
                      {quantity} × {formatStorefrontPrice(codUnitWithFee, priceCcy)} (incl. {Math.round(COD_SURCHARGE * 100)}% COD)
                    </span>
                  </p>
                </button>
              </div>

              <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5">
                <h3 className="mb-4 text-sm font-semibold text-zinc-900">Order summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-600">
                    <span className="pr-2">
                      {product.name}
                      {quantity > 1 ? (
                        <span className="text-zinc-500">
                          {" "}
                          × {quantity}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 font-medium text-zinc-800">{formatStorefrontPrice(esewaLineTotal, priceCcy)}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-200 pt-2 text-zinc-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-zinc-800">{formatStorefrontPrice(esewaLineTotal, priceCcy)}</span>
                  </div>
                  {paymentMethod === "cod" ? (
                    <div className="flex justify-between text-zinc-600">
                      <span>COD fee ({Math.round(COD_SURCHARGE * 100)}%)</span>
                      <span className="font-medium text-zinc-800">{formatStorefrontPrice(codFeeTotal, priceCcy)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-zinc-600">
                    <span>Payment method</span>
                    <span className="font-medium text-zinc-800">
                      {paymentMethod === "esewa"
                        ? "eSewa"
                        : paymentMethod === "khalti"
                          ? "Khalti"
                          : "Cash on delivery"}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-200 pt-3 text-base font-bold">
                    <span className="text-zinc-900">Total</span>
                    <span className={accent.text}>{formatStorefrontPrice(displayTotal, priceCcy)}</span>
                  </div>
                </div>
              </div>

              {formError && phase === "payment" ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={onContinueCheckout}
                className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-semibold shadow-sm disabled:opacity-50 ${accent.btn} ${accent.btnText}`}
              >
                <IconLock />
                Continue to checkout
              </button>
              <p className="mt-2 text-center text-xs text-zinc-500">
                {paymentMethod === "esewa"
                  ? "You will be redirected to eSewa to complete payment"
                  : paymentMethod === "khalti"
                    ? "You will be redirected to Khalti to complete payment"
                    : "You'll pay when your order arrives (COD includes a small handling fee)"}
              </p>
              {esewaPost && paymentMethod === "esewa" ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-center">
                  <p className="text-sm text-emerald-800">Opening eSewa…</p>
                  <button
                    type="button"
                    className={`mt-3 w-full rounded-xl px-4 py-3 text-sm font-semibold ${accent.btn} ${accent.btnText}`}
                    onClick={() => submitEsewaPaymentGateway(esewaPost)}
                  >
                    Continue to eSewa
                  </button>
                </div>
              ) : null}
            </section>
          </div>
          )}
        </div>
      </main>

      <footer className="mt-auto border-t border-zinc-200 bg-zinc-50/80">
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-zinc-600">
          <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <KinmelLogoMark
                  size="sm"
                  className="size-8 shrink-0 rounded-lg ring-1 ring-zinc-200"
                />
                <p className="font-semibold text-zinc-900">Kinmel</p>
              </div>
              <p className="mt-1 max-w-md text-xs leading-relaxed">
                Live shopping checkout. Pay with eSewa or Khalti (NPR), or choose cash on delivery where offered by the
                seller.
              </p>
            </div>
            <div className="flex flex-col gap-1 text-xs sm:text-right">
              <p>© {new Date().getFullYear()} Kinmel</p>
              <Link href="/" className={`${accent.link} font-medium`}>
                Home
              </Link>
              <p className="text-zinc-500">Questions? Contact the store you purchased from.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
