"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TableExpandButton } from "@/components/TableExpandButton";
import { formatStorefrontPrice } from "@/lib/formatNpr";

type OrderStatus =
  | "pending"
  | "paid"
  | "fulfilled"
  | "cancelled"
  | "refunded"
  | "cod";

type CustomerAddressRow = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  is_default: boolean | null;
};

type CustomerEmbed = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  customer_addresses?: CustomerAddressRow[] | null;
};

type OrderItemRow = {
  id: string;
  product_id: string | null;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  line_total: number;
  /** Joined from `products` for catalog image (null if product deleted or no image). */
  products?: { image_url: string | null } | { image_url: string | null }[] | null;
};

type LiveSessionEmbed = { id: string; title: string | null } | null;

export type BusinessOrderRow = {
  id: string;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  shipping_fee: number;
  tax: number;
  total: number;
  payment_method: string | null;
  esewa_transaction_uuid: string | null;
  khalti_pidx: string | null;
  /** Name from checkout; shown instead of customers.name when set (per-order snapshot). */
  checkout_name?: string | null;
  ordered_at: string;
  created_at: string;
  updated_at: string;
  live_session_id: string | null;
  customers: CustomerEmbed | CustomerEmbed[] | null;
  order_items: OrderItemRow[] | null;
  live_sessions: LiveSessionEmbed;
};

function pickCustomer(embed: BusinessOrderRow["customers"]): CustomerEmbed | null {
  if (!embed) return null;
  return Array.isArray(embed) ? embed[0] ?? null : embed;
}

function checkoutDisplayName(
  order: Pick<BusinessOrderRow, "checkout_name">,
  customer: CustomerEmbed | null
): string {
  const snap = (order.checkout_name ?? "").trim();
  if (snap) return snap;
  return customer?.name?.trim() || "Guest";
}

function pickAddress(customer: CustomerEmbed | null): string {
  if (!customer?.customer_addresses?.length) return "—";
  const rows = customer.customer_addresses;
  const def = rows.find((a) => a.is_default) ?? rows[0];
  const parts = [
    def.line1,
    def.line2,
    [def.city, def.state, def.postal_code].filter(Boolean).join(", "),
    def.country,
  ]
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

function orderItemProductImageUrl(line: Pick<OrderItemRow, "products">): string | null {
  const raw = line.products;
  if (!raw) return null;
  const row = Array.isArray(raw) ? raw[0] : raw;
  const url = row?.image_url;
  if (typeof url !== "string") return null;
  const t = url.trim();
  return t || null;
}

function shortId(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function statusBadgeClass(status: OrderStatus) {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-800 ring-emerald-600/20";
    case "cod":
      return "bg-sky-50 text-sky-800 ring-sky-600/20";
    case "pending":
      return "bg-amber-50 text-amber-900 ring-amber-600/20";
    case "fulfilled":
      return "bg-zinc-100 text-zinc-800 ring-zinc-500/15";
    case "cancelled":
      return "bg-red-50 text-red-800 ring-red-600/20";
    case "refunded":
      return "bg-violet-50 text-violet-800 ring-violet-600/20";
    default:
      return "bg-zinc-100 text-zinc-700 ring-zinc-500/15";
  }
}

function paymentLabel(method: string | null) {
  if (!method) return "—";
  if (method === "esewa") return "eSewa";
  if (method === "khalti") return "Khalti";
  if (method === "cod") return "Cash on delivery";
  return method;
}

function ProductThumb({
  src,
  sizeClass = "h-11 w-11",
}: {
  src: string | null;
  sizeClass?: string;
}) {
  if (!src) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 text-[10px] text-zinc-400 ${sizeClass}`}
        aria-hidden
      >
        —
      </div>
    );
  }
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 ${sizeClass}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="block h-full w-full object-cover" />
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

type StatusFilter = "all" | OrderStatus;

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "cod",
  "paid",
  "fulfilled",
  "cancelled",
  "refunded",
];

function coerceOrderStatus(raw: string): OrderStatus {
  return ORDER_STATUS_OPTIONS.includes(raw as OrderStatus) ? (raw as OrderStatus) : "pending";
}

export function BusinessOrdersPanel({ businessId }: { businessId: string }) {
  const [rows, setRows] = useState<BusinessOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pageSize, setPageSize] = useState<50 | 100>(50);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [statusErrorByOrderId, setStatusErrorByOrderId] = useState<Record<string, string | null>>(
    {}
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await supabase
      .from("orders")
      .select(
        [
          "id",
          "status",
          "currency",
          "subtotal",
          "shipping_fee",
          "tax",
          "total",
          "payment_method",
          "esewa_transaction_uuid",
          "khalti_pidx",
          "checkout_name",
          "ordered_at",
          "created_at",
          "updated_at",
          "live_session_id",
          "customers ( id, name, phone, email, customer_addresses ( line1, line2, city, state, postal_code, country, is_default ) )",
          "order_items ( id, product_id, product_name_snapshot, unit_price_snapshot, quantity, line_total, products ( image_url ) )",
          "live_sessions ( id, title )",
        ].join(", ")
      )
      .eq("business_id", businessId)
      .order("ordered_at", { ascending: false });

    if (qErr) {
      setError(qErr.message);
      setRows([]);
    } else {
      const raw = (data ?? []) as unknown as BusinessOrderRow[];
      setRows(
        raw.map((r) => ({
          ...r,
          status: coerceOrderStatus(String(r.status ?? "pending")),
        }))
      );
    }
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const list =
      statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);
    return [...list].sort((a, b) => {
      const aFulfilled = a.status === "fulfilled" ? 1 : 0;
      const bFulfilled = b.status === "fulfilled" ? 1 : 0;
      if (aFulfilled !== bFulfilled) {
        return aFulfilled - bFulfilled;
      }
      return new Date(b.ordered_at).getTime() - new Date(a.ordered_at).getTime();
    });
  }, [rows, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, filtered.length);
  const pageRows = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filtered, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [statusFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveOrderStatus = async (orderId: string, next: OrderStatus) => {
    setStatusBusyId(orderId);
    setStatusErrorByOrderId((prev) => ({ ...prev, [orderId]: null }));
    const { error: rpcError } = await supabase.rpc("update_order_status_for_my_business", {
      p_order_id: orderId,
      p_status: next,
    });
    setStatusBusyId(null);
    if (rpcError) {
      const hint =
        rpcError.message?.includes("function") && rpcError.message?.includes("does not exist")
          ? " Apply the migration `20260514120000_orders_status_update_rpc.sql` in Supabase, then retry."
          : "";
      setStatusErrorByOrderId((prev) => ({
        ...prev,
        [orderId]: `${rpcError.message ?? "Update failed"}.${hint}`,
      }));
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === orderId
          ? {
              ...r,
              status: next,
              updated_at: new Date().toISOString(),
            }
          : r
      )
    );
  };

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Paid" },
    { value: "cod", label: "COD" },
    { value: "fulfilled", label: "Fulfilled" },
    { value: "cancelled", label: "Cancelled" },
    { value: "refunded", label: "Refunded" },
  ];

  return (
    <div className="flex min-h-0 flex-col gap-4 max-xl:min-h-full xl:h-full">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Order history</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-zinc-500" htmlFor="order-status-filter">
            Status
          </label>
          <select
            id="order-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-600">
          Loading orders…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 p-10 text-center">
          <p className="text-sm font-medium text-zinc-800">No orders yet</p>
          <p className="mt-1 text-sm text-zinc-600">
            When customers complete checkout, they will appear here.
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col max-xl:overflow-visible xl:overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="min-h-0 flex-1 overflow-x-hidden max-xl:overflow-y-visible xl:overflow-y-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-zinc-200 bg-zinc-50/95 text-xs font-semibold uppercase tracking-wide text-zinc-600 backdrop-blur-sm">
                  <th className="w-24 px-3 py-3 sm:px-4">Order</th>
                  <th className="px-3 py-3 sm:px-4">Items</th>
                  <th className="hidden px-3 py-3 lg:table-cell lg:px-4">Placed</th>
                  <th className="hidden px-3 py-3 lg:table-cell lg:px-4">Customer</th>
                  <th className="hidden px-3 py-3 xl:table-cell xl:px-4">Status</th>
                  <th className="hidden px-3 py-3 xl:table-cell xl:px-4">Payment</th>
                  <th className="hidden px-3 py-3 text-right xl:table-cell xl:px-4">Total</th>
                  <th className="w-10 px-2 py-3" aria-label="Details" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pageRows.map((order) => {
                  const customer = pickCustomer(order.customers);
                  const items = order.order_items ?? [];
                  const itemSummary =
                    items.length === 0
                      ? "—"
                      : items
                          .map((i) => `${i.product_name_snapshot} ×${i.quantity}`)
                          .join(", ");
                  const sessionTitle =
                    order.live_sessions &&
                    typeof order.live_sessions === "object" &&
                    "title" in order.live_sessions
                      ? order.live_sessions.title
                      : null;
                  const firstItemImage =
                    items.map((i) => orderItemProductImageUrl(i)).find(Boolean) ?? null;
                  const isOpen = expanded.has(order.id);
                  const rowStatus = coerceOrderStatus(String(order.status));

                  return (
                    <Fragment key={order.id}>
                      <tr className="bg-white hover:bg-zinc-50/80">
                        <td className="px-3 py-3 font-mono text-xs text-zinc-800 sm:px-4">
                          <span title={order.id}>{shortId(order.id)}</span>
                        </td>
                        <td className="px-3 py-3 text-zinc-700 sm:px-4" title={itemSummary}>
                          <div className="flex items-start gap-2.5">
                            <ProductThumb src={firstItemImage} />
                            <div className="line-clamp-2 min-w-0 flex-1 pt-0.5 text-xs sm:text-sm">
                              {itemSummary}
                            </div>
                          </div>
                        </td>
                        <td className="hidden whitespace-nowrap px-3 py-3 text-zinc-700 lg:table-cell lg:px-4">
                          {new Date(order.ordered_at).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="hidden max-w-[200px] px-3 py-3 lg:table-cell lg:px-4">
                          <div className="truncate font-medium text-zinc-900">
                            {checkoutDisplayName(order, customer)}
                          </div>
                          <div className="truncate text-xs text-zinc-500">
                            {[customer?.phone, customer?.email].filter(Boolean).join(" · ") ||
                              "—"}
                          </div>
                        </td>
                        <td className="hidden px-3 py-3 xl:table-cell xl:px-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(rowStatus)}`}
                          >
                            {rowStatus}
                          </span>
                        </td>
                        <td className="hidden whitespace-nowrap px-3 py-3 text-zinc-700 xl:table-cell xl:px-4">
                          {paymentLabel(order.payment_method)}
                        </td>
                        <td className="hidden whitespace-nowrap px-3 py-3 text-right font-medium tabular-nums text-zinc-900 xl:table-cell xl:px-4">
                          {formatStorefrontPrice(Number(order.total ?? 0), order.currency)}
                        </td>
                        <td className="px-2 py-3">
                          <TableExpandButton
                            expanded={isOpen}
                            onToggle={() => toggleExpanded(order.id)}
                          />
                        </td>
                      </tr>
                      {isOpen ? (
                        <tr className="bg-zinc-50/90">
                          <td colSpan={8} className="p-0">
                            <div className="min-w-0 overflow-x-hidden px-3 py-4 sm:px-4">
                            <div className="flex min-w-0 flex-col gap-4">
                              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm lg:hidden">
                                <div>
                                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                    Placed
                                  </dt>
                                  <dd className="mt-0.5 text-zinc-900">
                                    {new Date(order.ordered_at).toLocaleString(undefined, {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    })}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                    Customer
                                  </dt>
                                  <dd className="mt-0.5 text-zinc-900">
                                    {checkoutDisplayName(order, customer)}
                                  </dd>
                                  <dd className="text-xs text-zinc-500">
                                    {[customer?.phone, customer?.email]
                                      .filter(Boolean)
                                      .join(" · ") || "—"}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                    Status
                                  </dt>
                                  <dd className="mt-0.5">
                                    <span
                                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(rowStatus)}`}
                                    >
                                      {rowStatus}
                                    </span>
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                    Payment
                                  </dt>
                                  <dd className="mt-0.5 text-zinc-900">
                                    {paymentLabel(order.payment_method)}
                                  </dd>
                                </div>
                                <div className="col-span-2">
                                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                    Total
                                  </dt>
                                  <dd className="mt-0.5 font-semibold tabular-nums text-emerald-800">
                                    {formatStorefrontPrice(Number(order.total ?? 0), order.currency)}
                                  </dd>
                                </div>
                              </dl>
                              <dl className="hidden grid-cols-3 gap-x-4 gap-y-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm lg:grid xl:hidden">
                                <div>
                                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                    Status
                                  </dt>
                                  <dd className="mt-0.5">
                                    <span
                                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(rowStatus)}`}
                                    >
                                      {rowStatus}
                                    </span>
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                    Payment
                                  </dt>
                                  <dd className="mt-0.5 text-zinc-900">
                                    {paymentLabel(order.payment_method)}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                    Total
                                  </dt>
                                  <dd className="mt-0.5 font-semibold tabular-nums text-emerald-800">
                                    {formatStorefrontPrice(Number(order.total ?? 0), order.currency)}
                                  </dd>
                                </div>
                              </dl>
                              <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3 xl:items-start">
                                <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4">
                                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                    Order
                                  </h3>
                                  <dl className="mt-2 space-y-1.5 text-zinc-800">
                                    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-2">
                                      <dt className="shrink-0 text-zinc-500">Order ref</dt>
                                      <dd
                                        className="break-all font-mono text-xs text-zinc-900 sm:text-right"
                                        title={order.id}
                                      >
                                        {shortId(order.id)}
                                      </dd>
                                    </div>
                                    {sessionTitle || order.live_session_id ? (
                                      <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-2">
                                        <dt className="text-zinc-500">Live session</dt>
                                        <dd className="break-words sm:text-right">
                                          {sessionTitle ?? shortId(order.live_session_id ?? "")}
                                        </dd>
                                      </div>
                                    ) : null}
                                    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-2">
                                      <dt className="text-zinc-500">Created</dt>
                                      <dd className="text-xs sm:text-right sm:text-sm">
                                        {new Date(order.created_at).toLocaleString()}
                                      </dd>
                                    </div>
                                    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-2">
                                      <dt className="text-zinc-500">Updated</dt>
                                      <dd className="text-xs sm:text-right sm:text-sm">
                                        {new Date(order.updated_at).toLocaleString()}
                                      </dd>
                                    </div>
                                  </dl>
                                </div>

                                <div className="flex min-w-0 flex-col gap-3">
                                  <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                      Delivery
                                    </h3>
                                    <p className="mt-2 break-words text-zinc-800">{pickAddress(customer)}</p>
                                  </div>
                                  <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                      Payment
                                    </h3>
                                    <dl className="mt-2 space-y-1.5 text-zinc-800">
                                      <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-2">
                                        <dt className="text-zinc-500">Method</dt>
                                        <dd className="sm:text-right">{paymentLabel(order.payment_method)}</dd>
                                      </div>
                                      {order.esewa_transaction_uuid ? (
                                        <div className="flex flex-col gap-1">
                                          <dt className="text-zinc-500">eSewa transaction UUID</dt>
                                          <dd className="break-all font-mono text-xs text-zinc-900">
                                            {order.esewa_transaction_uuid}
                                          </dd>
                                        </div>
                                      ) : null}
                                      {order.khalti_pidx ? (
                                        <div className="flex flex-col gap-1">
                                          <dt className="text-zinc-500">Khalti pidx</dt>
                                          <dd className="break-all font-mono text-xs text-zinc-900">
                                            {order.khalti_pidx}
                                          </dd>
                                        </div>
                                      ) : null}
                                    </dl>
                                  </div>
                                </div>

                                <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4">
                                  <label
                                    className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
                                    htmlFor={`order-status-${order.id}`}
                                  >
                                    Order status
                                  </label>
                                  <select
                                    id={`order-status-${order.id}`}
                                    value={rowStatus}
                                    disabled={statusBusyId === order.id}
                                    onChange={(e) => {
                                      const v = coerceOrderStatus(e.target.value);
                                      if (v === rowStatus) return;
                                      void saveOrderStatus(order.id, v);
                                    }}
                                    className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 disabled:opacity-60"
                                  >
                                    {ORDER_STATUS_OPTIONS.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </select>
                                  {statusBusyId === order.id ? (
                                    <p className="mt-2 text-xs text-zinc-500">Saving…</p>
                                  ) : null}
                                  {statusErrorByOrderId[order.id] ? (
                                    <p className="mt-2 text-xs text-red-600">
                                      {statusErrorByOrderId[order.id]}
                                    </p>
                                  ) : null}
                                  <p className="mt-3 text-xs leading-snug text-zinc-500">
                                    <span className="font-medium text-zinc-600">Paid</span>: payment
                                    confirmed. <span className="font-medium text-zinc-600">Fulfilled</span>:
                                    shipped or delivered. Use both steps when you separate money from
                                    fulfillment.
                                  </p>
                                </div>
                              </div>

                              <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4">
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                  Line items
                                </h3>
                                {items.length === 0 ? (
                                  <p className="mt-2 text-sm text-zinc-500">No line items.</p>
                                ) : (
                                  <>
                                    <ul className="mt-3 divide-y divide-zinc-100 md:hidden">
                                      {items.map((line) => {
                                        const img = orderItemProductImageUrl(line);
                                        return (
                                          <li key={line.id} className="flex gap-3 py-3">
                                            <ProductThumb src={img} sizeClass="h-12 w-12" />
                                            <div className="min-w-0 flex-1">
                                              <p className="break-words font-medium text-zinc-900">
                                                {line.product_name_snapshot}
                                              </p>
                                              <p className="mt-1 text-xs text-zinc-600">
                                                Qty {line.quantity} ·{" "}
                                                {formatStorefrontPrice(
                                                  Number(line.unit_price_snapshot),
                                                  order.currency
                                                )}{" "}
                                                each
                                              </p>
                                              <p className="mt-1 text-sm font-medium tabular-nums text-zinc-900">
                                                {formatStorefrontPrice(
                                                  Number(line.line_total),
                                                  order.currency
                                                )}
                                              </p>
                                            </div>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                    <table className="mt-2 hidden w-full text-sm md:table">
                                      <thead>
                                        <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                                          <th className="w-14 py-2 pr-2 font-medium" aria-label="Product photo" />
                                          <th className="py-2 pr-3 font-medium">Product</th>
                                          <th className="w-24 py-2 pr-3 font-medium">Unit</th>
                                          <th className="w-12 py-2 pr-3 font-medium">Qty</th>
                                          <th className="w-28 py-2 font-medium text-right">Line total</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-zinc-100">
                                        {items.map((line) => {
                                          const img = orderItemProductImageUrl(line);
                                          return (
                                            <tr key={line.id}>
                                              <td className="py-2 pr-2 align-middle">
                                                <ProductThumb src={img} sizeClass="h-12 w-12" />
                                              </td>
                                              <td className="break-words py-2 pr-3 font-medium text-zinc-900">
                                                {line.product_name_snapshot}
                                              </td>
                                              <td className="py-2 pr-3 text-xs tabular-nums">
                                                {formatStorefrontPrice(
                                                  Number(line.unit_price_snapshot),
                                                  order.currency
                                                )}
                                              </td>
                                              <td className="py-2 pr-3 tabular-nums">{line.quantity}</td>
                                              <td className="py-2 text-right text-xs tabular-nums font-medium">
                                                {formatStorefrontPrice(
                                                  Number(line.line_total),
                                                  order.currency
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </>
                                )}
                                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-zinc-100 pt-3 text-sm sm:flex sm:flex-wrap sm:justify-end sm:gap-x-8">
                                  <div className="flex gap-2">
                                    <dt className="text-zinc-500">Subtotal</dt>
                                    <dd className="tabular-nums font-medium">
                                      {formatStorefrontPrice(Number(order.subtotal ?? 0), order.currency)}
                                    </dd>
                                  </div>
                                  <div className="flex gap-2">
                                    <dt className="text-zinc-500">Shipping</dt>
                                    <dd className="tabular-nums font-medium">
                                      {formatStorefrontPrice(Number(order.shipping_fee ?? 0), order.currency)}
                                    </dd>
                                  </div>
                                  <div className="flex gap-2">
                                    <dt className="text-zinc-500">Tax</dt>
                                    <dd className="tabular-nums font-medium">
                                      {formatStorefrontPrice(Number(order.tax ?? 0), order.currency)}
                                    </dd>
                                  </div>
                                  <div className="flex gap-2 text-base">
                                    <dt className="font-semibold text-zinc-800">Total</dt>
                                    <dd className="tabular-nums font-semibold text-emerald-800">
                                      {formatStorefrontPrice(Number(order.total ?? 0), order.currency)}
                                    </dd>
                                  </div>
                                </dl>
                              </div>
                            </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex shrink-0 flex-col gap-3 border-t border-zinc-200 bg-zinc-50/90 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="text-xs text-zinc-600">
              Showing {pageStart}–{pageEnd} of {filtered.length} order
              {filtered.length === 1 ? "" : "s"}
              {statusFilter !== "all" ? " (filtered)" : ""}
            </p>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-500" htmlFor="orders-page-size">
                  Per page
                </label>
                <select
                  id="orders-page-size"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value) as 50 | 100)}
                  className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeftIcon />
                </button>
                <span className="min-w-[5.5rem] text-center text-xs tabular-nums text-zinc-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
