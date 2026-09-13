"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { fetchPublicProductJson } from "@/lib/backendFetch";
import {
  fetchMaskedBuyerProfile,
  postCodCheckout,
  postEsewaInit,
  postExpressCheckout,
  postKhaltiInit,
  type EsewaInitResponse,
  type MaskedBuyerProfile,
} from "@/lib/checkoutClient";
import {
  loadCheckoutBuyerDetails,
  saveCheckoutBuyerDetails,
} from "@/lib/checkoutBuyerDetails";
import { formatStorefrontPrice, isNepalRupeesCurrency } from "@/lib/formatNpr";
import { KinmelBrandLink, KinmelLogoMark } from "@/components/KinmelLogo";
import { LocationAddressInput } from "@/components/checkout/LocationAddressInput";
import { nepalCities } from "@/lib/nepalCities";
import { MoreFromSellerRail } from "@/components/storefront/MoreFromSellerRail";

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

const COD_FLAT_FEE = 5;

type CheckoutPhase = "review" | "details" | "payment";

/** Purple primary + green status accents (matches storefront checkout design). */
const accent = {
  btn: "bg-violet-600 hover:bg-violet-700",
  btnText: "text-white",
  ring: "ring-violet-100",
  border: "border-violet-600",
  borderSoft: "border-violet-200",
  bgSoft: "bg-violet-50/90",
  text: "text-violet-600",
  textDark: "text-violet-700",
  focus: "focus:border-violet-400 focus:ring-violet-500/20",
  stepDone: "bg-emerald-500",
  stepRing: "ring-emerald-100",
  stepLine: "bg-emerald-400",
  link: "text-violet-600 hover:text-violet-700",
  success: "text-emerald-600",
  successSoft: "bg-emerald-50 text-emerald-700",
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function IconStore() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 9l1-5h16l1 5" />
      <path d="M3 9v11h18V9" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2l2.4 12.2a1 1 0 001 .8h9.4a1 1 0 001-.8L21 8H7" />
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

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={["animate-spin", className].filter(Boolean).join(" ")}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
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
  if (name) return name;
  if (ig) return `@${ig}`;
  return null;
}

function Stepper({ phase }: { phase: CheckoutPhase }) {
  const steps = [
    { id: "review" as const, label: "Review" },
    { id: "details" as const, label: "Details" },
    { id: "payment" as const, label: "Payment" },
  ];
  const activeIndex = phase === "review" ? 0 : phase === "details" ? 1 : 2;

  return (
    <nav
      aria-label="Checkout steps"
      className="mb-3 flex items-center justify-center gap-1.5 rounded-2xl border border-zinc-100 bg-white px-2.5 py-2 shadow-sm sm:gap-2 sm:px-4"
    >
      {steps.map((s, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <div key={s.id} className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={[
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                  done || active
                    ? `${accent.stepDone} text-white`
                    : "bg-zinc-100 text-zinc-500",
                ].join(" ")}
              >
                {done ? <IconCheck className="size-3" /> : i + 1}
              </span>
              <span
                className={[
                  "text-[12px] font-semibold",
                  active || done ? accent.success : "text-zinc-400",
                ].join(" ")}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <span className="text-zinc-300" aria-hidden>
                ›
              </span>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function QuantityStepper({
  quantity,
  max,
  disabled,
  onChange,
}: {
  quantity: number;
  max: number;
  disabled?: boolean;
  onChange: (n: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-zinc-200 bg-white text-sm">
      <button
        type="button"
        aria-label="Decrease quantity"
        className="border-r border-zinc-200 px-2.5 py-1 font-medium text-zinc-700 disabled:opacity-40"
        disabled={disabled || quantity <= 1}
        onClick={() => onChange(quantity - 1)}
      >
        −
      </button>
      <span className="min-w-[1.5rem] px-1 text-center text-xs font-semibold tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        className="border-l border-zinc-200 px-2.5 py-1 font-medium text-zinc-700 disabled:opacity-40"
        disabled={disabled || quantity >= max}
        onClick={() => onChange(quantity + 1)}
      >
        +
      </button>
    </div>
  );
}

function BuyProductContent() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const productId = typeof params?.productId === "string" ? params.productId : "";
  const buyerKey = (searchParams.get("bk") || "").trim();
  const affiliateId = (searchParams.get("aff") || "").trim();
  const forceEdit = searchParams.get("edit") === "1";
  const fromLive = searchParams.get("from") === "live";
  const sellerParam = (searchParams.get("seller") || "").trim().replace(/^@+/, "");
  const fetchSeqRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<{
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    image_url: string;
    product_url: string;
    business_id?: string;
    stock_quantity?: number | null;
    sold_out?: boolean;
    variants?: Array<{ id: string; label: string; stock_quantity: number }>;
    seller?: {
      business_name?: string;
      instagram_username?: string;
    };
  } | null>(null);

  const [phase, setPhase] = useState<CheckoutPhase>("review");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"esewa" | "khalti" | "cod">("khalti");
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  /** Saved delivery via buyer_key — pay without sending full PII from the browser. */
  const [expressMode, setExpressMode] = useState(false);
  const [maskedProfile, setMaskedProfile] = useState<MaskedBuyerProfile | null>(null);

  useEffect(() => {
    const saved = loadCheckoutBuyerDetails();
    if (saved) {
      setCustomerName(saved.customerName);
      setPhone(saved.phone);
      setAddress(saved.address);
      setCity(saved.city);
    }
  }, []);

  useEffect(() => {
    // bk "express checkout" is temporarily disabled.
    // Keep buyer_key for linking after standard checkout, but never auto-switch to express UI.
    setExpressMode(false);
    setMaskedProfile(null);
  }, [buyerKey, forceEdit]);
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
    if (!isNepalRupeesCurrency(product.currency)) {
      if (paymentMethod === "khalti" || paymentMethod === "esewa") {
        setPaymentMethod("cod");
      }
    }
  }, [product, paymentMethod]);

  useEffect(() => {
    if (!product) return;
    const variants = product.variants ?? [];
    if (variants.length === 0) {
      setSelectedVariantId(null);
      return;
    }
    setSelectedVariantId((prev) => {
      if (prev && variants.some((v) => v.id === prev && v.stock_quantity > 0)) {
        return prev;
      }
      const firstInStock = variants.find((v) => v.stock_quantity > 0);
      return firstInStock?.id ?? null;
    });
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const variants = product.variants ?? [];
    const selected =
      variants.length > 0
        ? variants.find((v) => v.id === selectedVariantId) ?? null
        : null;
    const tracked =
      selected != null
        ? Math.max(0, Math.floor(selected.stock_quantity))
        : product.stock_quantity != null
          ? Math.max(0, Math.floor(product.stock_quantity))
          : null;
    const soldOut =
      product.sold_out === true ||
      tracked === 0 ||
      (variants.length > 0 && !selected);
    if (soldOut) {
      setQuantity(1);
      return;
    }
    if (tracked != null && quantity > tracked) {
      setQuantity(Math.max(1, tracked));
    }
  }, [product, quantity, selectedVariantId]);

  const payloadBase = (override?: {
    customerName?: string;
    phone?: string;
    address?: string;
    city?: string;
  }) => ({
    product_id: productId,
    customer_name: (override?.customerName ?? customerName).trim(),
    phone: (override?.phone ?? phone).trim(),
    address: (override?.address ?? address).trim(),
    city: (override?.city ?? city).trim(),
    quantity,
    ...(selectedVariantId ? { variant_id: selectedVariantId } : {}),
    ...(buyerKey ? { buyer_key: buyerKey } : {}),
    ...(affiliateId
      ? { affiliate_influencer_business_id: affiliateId }
      : {}),
  });

  const persistBuyerDetails = (
    override?: Partial<{
      customerName: string;
      phone: string;
      address: string;
      city: string;
    }>,
  ) => {
    saveCheckoutBuyerDetails({
      customerName: override?.customerName ?? customerName,
      phone: override?.phone ?? phone,
      address: override?.address ?? address,
      city: override?.city ?? city,
    });
  };

  /** Browser / Instagram autofill often fills the DOM without firing React onChange. */
  const readDetailsFromForm = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const next = {
      customerName: String(data.get("name") ?? "").trim(),
      address: String(data.get("street-address") ?? "").trim(),
      city: String(data.get("address-level2") ?? "").trim(),
      phone: String(data.get("tel") ?? "").trim(),
    };
    setCustomerName(next.customerName);
    setAddress(next.address);
    setCity(next.city);
    setPhone(next.phone);
    return next;
  };

  const resolveBuyerDetails = () => {
    const saved = loadCheckoutBuyerDetails();
    const values = {
      customerName: customerName.trim() || saved?.customerName || "",
      phone: phone.trim() || saved?.phone || "",
      address: address.trim() || saved?.address || "",
      city: city.trim() || saved?.city || "",
    };
    if (values.customerName && values.customerName !== customerName) {
      setCustomerName(values.customerName);
    }
    if (values.phone && values.phone !== phone) {
      setPhone(values.phone);
    }
    if (values.address && values.address !== address) {
      setAddress(values.address);
    }
    if (values.city && values.city !== city) {
      setCity(values.city);
    }
    return values;
  };

  const validateDetailsValues = (values: {
    customerName: string;
    phone: string;
    address: string;
    city: string;
  }) => {
    if (
      !values.customerName.trim() ||
      !values.phone.trim() ||
      !values.address.trim() ||
      !values.city.trim()
    ) {
      setFormError("Please enter your name, address, city, and phone number.");
      return false;
    }
    setFormError(null);
    return true;
  };

  const switchToEditDetails = () => {
    setExpressMode(false);
    setFormError(null);
    setPhase("details");
  };

  const goToDetails = () => {
    setFormError(null);
    if ((product?.variants?.length ?? 0) > 0 && !selectedVariantId) {
      setFormError("Please select a size.");
      return;
    }
    if (expressMode) {
      setPhase("payment");
      return;
    }
    setPhase("details");
  };

  const goToPayment = (form?: HTMLFormElement | null) => {
    const values = form
      ? readDetailsFromForm(form)
      : resolveBuyerDetails();
    if (!validateDetailsValues(values)) return;
    persistBuyerDetails(values);
    setExpressMode(false);
    setPhase("payment");
  };

  const onContinueCheckout = async () => {
    setFormError(null);
    if ((product?.variants?.length ?? 0) > 0 && !selectedVariantId) {
      setFormError("Please select a size.");
      setPhase("review");
      return;
    }
    setBusy(true);
    try {
      if (expressMode && buyerKey) {
        const res = await postExpressCheckout({
          product_id: productId,
          buyer_key: buyerKey,
          payment_method: paymentMethod,
          quantity,
          ...(selectedVariantId ? { variant_id: selectedVariantId } : {}),
          ...(affiliateId
            ? { affiliate_influencer_business_id: affiliateId }
            : {}),
        });
        if (paymentMethod === "cod") {
          const bid = res.business_id || product?.business_id || "";
          const sp = new URLSearchParams({
            payment: "cod",
            order_id: String(res.order_id || ""),
            total: String(res.total ?? ""),
            currency: String(res.currency || "NPR"),
            product_id: productId,
            quantity: String(res.quantity ?? quantity),
          });
          if (bid) sp.set("business_id", bid);
          router.push(`/buy/thank-you?${sp.toString()}`);
          setBusy(false);
          return;
        }
        if (paymentMethod === "khalti") {
          if (!res.payment_url || !res.pidx) {
            throw new Error("Khalti payment URL missing.");
          }
          try {
            if (typeof window !== "undefined") {
              window.sessionStorage.setItem("khalti_pidx", res.pidx);
            }
          } catch {
            /* ignore */
          }
          window.location.href = res.payment_url;
          return;
        }
        if (!res.payment_url || !res.form_fields || !res.transaction_uuid) {
          throw new Error("eSewa payment form missing.");
        }
        persistEsewaCheckoutContext(productId, res.transaction_uuid);
        submitEsewaPaymentGateway({
          ok: true,
          order_id: res.order_id ?? null,
          checkout_session_id: res.checkout_session_id,
          payment_method: "esewa",
          payment_url: res.payment_url,
          form_fields: res.form_fields,
          transaction_uuid: res.transaction_uuid,
        });
        return;
      }

      const values = resolveBuyerDetails();
      if (!validateDetailsValues(values)) {
        setPhase("details");
        setBusy(false);
        return;
      }
      persistBuyerDetails(values);
      const payload = payloadBase(values);
      if (paymentMethod === "cod") {
        const res = await postCodCheckout(payload);
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
        setBusy(false);
      } else if (paymentMethod === "khalti") {
        const res = await postKhaltiInit(payload);
        try {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("khalti_pidx", res.pidx);
          }
        } catch {
          /* ignore */
        }
        window.location.href = res.payment_url;
        return;
      } else {
        const res = await postEsewaInit(payload);
        persistEsewaCheckoutContext(productId, res.transaction_uuid);
        submitEsewaPaymentGateway(res);
        return;
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-zinc-50">
        <main className="mx-auto max-w-lg px-4 py-10">
          <p className="text-center text-zinc-500">Loading product…</p>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-full bg-zinc-50">
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
  const esewaLineTotal = Math.round(unitPrice * quantity * 100) / 100;
  const codFeeTotal = COD_FLAT_FEE;
  const codLineTotal = Math.round((esewaLineTotal + COD_FLAT_FEE) * 100) / 100;
  const displayTotal = paymentMethod === "cod" ? codLineTotal : esewaLineTotal;
  const sellerLine = formatSellerLine(product.seller);
  const isNpr = isNepalRupeesCurrency(product.currency);
  const priceCcy = product.currency;
  const variants = product.variants ?? [];
  const hasSizes = variants.length > 0;
  const selectedVariant = hasSizes
    ? variants.find((v) => v.id === selectedVariantId) ?? null
    : null;
  const trackedStock = hasSizes
    ? selectedVariant != null
      ? Math.max(0, Math.floor(selectedVariant.stock_quantity))
      : 0
    : product.stock_quantity != null
      ? Math.max(0, Math.floor(product.stock_quantity))
      : null;
  const isSoldOut =
    product.sold_out === true ||
    trackedStock === 0 ||
    (hasSizes && variants.every((v) => v.stock_quantity <= 0));
  const maxPurchasable =
    trackedStock == null ? 99 : Math.min(99, Math.max(0, trackedStock));
  const selectedSizeLabel = selectedVariant?.label?.trim() || null;

  const setQty = (n: number) => {
    const upper = isSoldOut ? 1 : maxPurchasable;
    setQuantity(Math.min(upper, Math.max(1, Math.floor(n))));
  };

  const panelOffset =
    phase === "review" ? "translate-x-0" : phase === "details" ? "-translate-x-1/3" : "-translate-x-2/3";

  const paymentCardClass = (selected: boolean, opts?: { disabled?: boolean }) => {
    const disabled = opts?.disabled;
    return [
      "flex flex-col rounded-2xl border-2 p-4 text-left transition-all outline-none",
      disabled
        ? "cursor-not-allowed border-zinc-100 bg-zinc-50 opacity-60"
        : [
            "cursor-pointer hover:border-violet-300 hover:bg-violet-50/40",
            "focus-visible:ring-4 focus-visible:ring-violet-500/25",
            selected
              ? `${accent.border} ${accent.bgSoft} shadow-sm ring-1 ${accent.borderSoft}`
              : "border-zinc-200 bg-white",
          ].join(" "),
    ].join(" ");
  };

  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4 py-3">
          <KinmelBrandLink size="sm" tone="brand" />
          <div className={`flex shrink-0 items-center gap-2 text-sm font-semibold ${accent.textDark}`}>
            <span>Secure Checkout</span>
            <span className={accent.text}>
              <IconShield />
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-6 pt-3">
        <Stepper phase={phase} />

        {fromLive ? (
          <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-medium text-emerald-800">
            You&apos;re buying what&apos;s on live right now
          </p>
        ) : null}

        {isSoldOut ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <p className="text-xl font-bold text-red-700">Already Sold out!</p>
            <p className="mt-2 text-sm text-red-600">
              This item is no longer available. Check back later or contact the seller.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div
              className={[
                "flex w-[300%] transition-transform duration-300 ease-out motion-reduce:transition-none",
                panelOffset,
              ].join(" ")}
            >
              {/* —— Review —— */}
              <section className="w-1/3 shrink-0 space-y-2.5 pr-2" aria-labelledby="review-heading">
                <h2 id="review-heading" className="sr-only">
                  Review order
                </h2>

                <div className="flex items-center justify-between gap-2 rounded-2xl border border-zinc-100 bg-white px-3 py-2.5 shadow-sm">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${accent.bgSoft} ${accent.text}`}>
                      <IconStore />
                    </span>
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      <span className="font-medium text-zinc-500">Seller: </span>
                      {sellerLine ?? "Kinmel store"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${accent.successSoft}`}
                  >
                    <IconCheck className="size-3" />
                    Trusted Seller
                  </span>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-white p-2.5 shadow-sm">
                  <div className="flex gap-2.5">
                    <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h1 className="truncate text-sm font-bold text-zinc-900">
                            {product.name}
                          </h1>
                          {product.description?.trim() ? (
                            <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-zinc-600">
                              {product.description.trim()}
                            </p>
                          ) : null}
                          {trackedStock != null ? (
                            <p className={`mt-0.5 flex items-center gap-1 text-[11px] font-medium ${accent.success}`}>
                              <IconCheck className="size-3" />
                              {hasSizes && selectedSizeLabel
                                ? `${trackedStock} of size ${selectedSizeLabel} available`
                                : `${trackedStock} ${trackedStock === 1 ? "piece" : "pieces"} available`}
                            </p>
                          ) : null}
                        </div>
                        <p className={`shrink-0 text-base font-bold ${accent.text}`}>
                          {formatStorefrontPrice(unitPrice, priceCcy)}
                        </p>
                      </div>
                      {hasSizes ? (
                        <div className="mt-2">
                          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                            Size
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {variants.map((v) => {
                              const sold = v.stock_quantity <= 0;
                              const selected = v.id === selectedVariantId;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  disabled={sold || isSoldOut}
                                  onClick={() => {
                                    setSelectedVariantId(v.id);
                                    setFormError(null);
                                    setQuantity(1);
                                  }}
                                  className={[
                                    "min-w-[2.5rem] rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition",
                                    sold
                                      ? "cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300 line-through"
                                      : selected
                                        ? `${accent.border} ${accent.bgSoft} ${accent.text}`
                                        : "border-zinc-200 bg-white text-zinc-800 hover:border-violet-300",
                                  ].join(" ")}
                                >
                                  {v.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-2">
                        <QuantityStepper
                          quantity={quantity}
                          max={maxPurchasable}
                          onChange={setQty}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {formError && phase === "review" ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {formError}
                  </p>
                ) : null}

                <div className="rounded-2xl border border-zinc-100 bg-white px-3.5 py-3 shadow-sm">
                  <h3 className="mb-2 text-sm font-semibold text-zinc-900">Order Summary</h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-zinc-600">
                      <span>Items ({quantity})</span>
                      <span className="font-medium text-zinc-800">
                        {formatStorefrontPrice(esewaLineTotal, priceCcy)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-100 pt-1.5 text-sm font-bold">
                      <span className="text-zinc-900">Total</span>
                      <span className={accent.text}>
                        {formatStorefrontPrice(esewaLineTotal, priceCcy)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={goToDetails}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold shadow-md shadow-violet-200/60 ${accent.btn} ${accent.btnText}`}
                >
                  <span className="inline-flex items-center gap-2">
                    <IconCart />
                    {expressMode ? "Continue to payment" : "Continue to Cart"}
                  </span>
                  <IconChevron />
                </button>
                <p className="flex items-center justify-center gap-1.5 pt-0.5 text-center text-[11px] text-zinc-500">
                  <IconLock />
                  Your information is secure and encrypted
                </p>
              </section>

              {/* —— Details —— */}
              <section className="w-1/3 shrink-0 px-1" aria-labelledby="details-heading">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 id="details-heading" className="text-lg font-semibold text-zinc-900">
                    Your details
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setPhase("review");
                      setFormError(null);
                    }}
                    className={`text-sm font-medium ${accent.link} underline-offset-2 hover:underline`}
                  >
                    Edit order
                  </button>
                </div>

                <div className="mb-4 flex gap-3 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm">
                  <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">{product.name}</p>
                    <p className={`text-sm font-bold ${accent.text}`}>
                      {formatStorefrontPrice(esewaLineTotal, priceCcy)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Qty {quantity}
                      {selectedSizeLabel ? ` · Size ${selectedSizeLabel}` : ""}
                    </p>
                  </div>
                </div>

                <form
                  className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
                  autoComplete="on"
                  method="post"
                  action="#"
                  onSubmit={(event) => {
                    event.preventDefault();
                    goToPayment(event.currentTarget);
                  }}
                >
                  <label className="block text-sm font-medium text-zinc-700" htmlFor="checkout-name">
                    Full name
                    <input
                      id="checkout-name"
                      name="name"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      onBlur={() => persistBuyerDetails()}
                      className={`mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ${accent.focus}`}
                      autoComplete="shipping name"
                      autoCapitalize="words"
                      enterKeyHint="next"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-zinc-700" htmlFor="checkout-address">
                    Delivery address
                    <LocationAddressInput
                      id="checkout-address"
                      name="street-address"
                      value={address}
                      onChange={setAddress}
                      onBlur={() => persistBuyerDetails()}
                      rows={3}
                      placeholder="Street, area, landmark"
                      className={`mt-1.5 w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ${accent.focus}`}
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-zinc-700" htmlFor="checkout-city">
                    City
                    <LocationAddressInput
                      id="checkout-city"
                      name="address-level2"
                      value={city}
                      onChange={setCity}
                      onBlur={() => persistBuyerDetails()}
                      as="input"
                      tokens={nepalCities}
                      replaceEntireValue
                      placeholder="Kathmandu, Pokhara, Lalitpur…"
                      className={`mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ${accent.focus}`}
                      required
                      hint="City or municipality used for courier pricing."
                    />
                  </label>
                  <label className="block text-sm font-medium text-zinc-700" htmlFor="checkout-phone">
                    Phone number
                    <input
                      id="checkout-phone"
                      name="tel"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => persistBuyerDetails()}
                      className={`mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ${accent.focus}`}
                      autoComplete="shipping tel"
                      inputMode="tel"
                      enterKeyHint="done"
                      required
                    />
                  </label>

                  {formError && phase === "details" ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {formError}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    className={`mt-1 flex w-full items-center justify-between rounded-2xl px-5 py-4 text-sm font-semibold shadow-md shadow-violet-200/60 ${accent.btn} ${accent.btnText}`}
                  >
                    <span>Continue to Payment</span>
                    <IconChevron />
                  </button>
                </form>
              </section>

              {/* —— Payment —— */}
              <section className="w-1/3 shrink-0 pl-2" aria-labelledby="payment-heading">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 id="payment-heading" className="text-lg font-semibold text-zinc-900">
                    Choose payment
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      if (expressMode) {
                        switchToEditDetails();
                        return;
                      }
                      setPhase("details");
                      setFormError(null);
                    }}
                    className={`text-sm font-medium ${accent.link} underline-offset-2 hover:underline`}
                  >
                    {expressMode ? "Change address" : "Edit details"}
                  </button>
                </div>

                {expressMode && maskedProfile?.has_profile ? (
                  <div className="mb-3 rounded-2xl border border-violet-100 bg-violet-50/80 px-3.5 py-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                      Delivering to
                    </p>
                    <p className="mt-1 font-semibold text-zinc-900">
                      {maskedProfile.customer_name || "Saved name"}
                    </p>
                    <p className="mt-0.5 text-zinc-600">{maskedProfile.phone}</p>
                    <p className="mt-0.5 text-zinc-600">{maskedProfile.address}</p>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3" role="radiogroup" aria-label="Payment method">
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
                    <div className="flex items-center gap-3">
                      <span
                        className={[
                          "flex h-4 w-4 shrink-0 rounded-full border-2",
                          paymentMethod === "khalti" ? `${accent.border} bg-violet-600` : "border-zinc-300 bg-white",
                        ].join(" ")}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/payment-app-logo/khalti_logo.png"
                            alt=""
                            className="h-8 w-auto object-contain"
                          />
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                            Preferred
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm font-bold text-zinc-900">Pay with Khalti Banking</p>
                        <p className="text-[11px] text-zinc-500">
                          {isNpr
                            ? "Wallet or linked banks"
                            : "Available only for NPR prices"}
                        </p>
                      </div>
                      <p className={`shrink-0 text-base font-bold ${accent.text}`}>
                        {formatStorefrontPrice(esewaLineTotal, priceCcy)}
                      </p>
                    </div>
                  </button>

                  {/* eSewa checkout hidden until integration is ready for storefront. */}

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
                    <div className="flex items-center gap-3">
                      <span
                        className={[
                          "flex h-4 w-4 shrink-0 rounded-full border-2",
                          paymentMethod === "cod" ? `${accent.border} bg-violet-600` : "border-zinc-300 bg-white",
                        ].join(" ")}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-zinc-900">Cash on delivery</p>
                        <p className="text-[11px] text-zinc-500">
                          {COD_FLAT_FEE > 0
                            ? `Pay on arrival · +${formatStorefrontPrice(COD_FLAT_FEE, priceCcy)} fee`
                            : "Pay on arrival"}
                        </p>
                      </div>
                      <p className={`shrink-0 text-base font-bold ${accent.text}`}>
                        {formatStorefrontPrice(codLineTotal, priceCcy)}
                      </p>
                    </div>
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-zinc-900">Order summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-zinc-600">
                      <span className="pr-2">
                        {product.name}
                        {quantity > 1 ? <span className="text-zinc-500"> × {quantity}</span> : null}
                      </span>
                      <span className="shrink-0 font-medium text-zinc-800">
                        {formatStorefrontPrice(esewaLineTotal, priceCcy)}
                      </span>
                    </div>
                    {paymentMethod === "cod" && COD_FLAT_FEE > 0 ? (
                      <div className="flex justify-between text-zinc-600">
                        <span>COD fee</span>
                        <span className="font-medium text-zinc-800">
                          {formatStorefrontPrice(codFeeTotal, priceCcy)}
                        </span>
                      </div>
                    ) : null}
                    <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-bold">
                      <span className="text-zinc-900">Total</span>
                      <span className={accent.text}>{formatStorefrontPrice(displayTotal, priceCcy)}</span>
                    </div>
                  </div>
                </div>

                {formError && phase === "payment" ? (
                  <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </p>
                ) : null}

                <button
                  type="button"
                  disabled={busy}
                  onClick={onContinueCheckout}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-semibold shadow-md shadow-violet-200/60 disabled:opacity-50 ${accent.btn} ${accent.btnText}`}
                >
                  {busy ? <IconSpinner /> : <IconLock />}
                  {busy ? "Processing…" : "Continue to checkout"}
                </button>
                <p className="mt-2 text-center text-xs text-zinc-500">
                  {paymentMethod === "esewa"
                    ? "You will be redirected to eSewa to complete payment"
                    : paymentMethod === "khalti"
                      ? "You will be redirected to Khalti to complete payment"
                      : COD_FLAT_FEE > 0
                        ? `You'll pay when your order arrives (includes a ${formatStorefrontPrice(COD_FLAT_FEE, priceCcy)} COD fee)`
                        : "You'll pay when your order arrives"}
                </p>
              </section>
            </div>
          </div>
        )}

        {product?.business_id ? (
          <MoreFromSellerRail
            businessId={product.business_id}
            excludeProductId={productId}
            sellerName={
              sellerLine ??
              (sellerParam ? `@${sellerParam}` : product.seller?.business_name || "this seller")
            }
            sellerUsername={sellerParam || product.seller?.instagram_username}
          />
        ) : null}
      </main>

      <footer className="mt-auto border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <KinmelLogoMark size="sm" className="size-7 shrink-0 rounded-lg ring-1 ring-zinc-200" />
            <span>© {new Date().getFullYear()} Kinmel</span>
          </div>
          <Link href="/" className={`${accent.link} font-medium`}>
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default function PublicBuyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-zinc-50 p-8">
          <p className="text-zinc-500">Loading…</p>
        </div>
      }
    >
      <BuyProductContent />
    </Suspense>
  );
}
