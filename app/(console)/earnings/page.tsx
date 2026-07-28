"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppState } from "@/components/AppProvider";
import {
  fetchBusinessEarnings,
  type BusinessEarnings,
  type EarningsPeriod,
} from "@/lib/backendClient";
import { formatStorefrontPrice } from "@/lib/formatNpr";

const PERIODS: { value: EarningsPeriod; label: string }[] = [
  { value: "daily", label: "Today" },
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
];

function formatRs(amount: number) {
  return formatStorefrontPrice(amount, "NPR");
}

export default function EarningsPage() {
  const { businessId, isReady } = useAppState();
  const [period, setPeriod] = useState<EarningsPeriod>("daily");
  const [data, setData] = useState<BusinessEarnings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchBusinessEarnings(businessId, period);
      setData(result);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Failed to load earnings");
    } finally {
      setLoading(false);
    }
  }, [businessId, period]);

  useEffect(() => {
    void load();
  }, [load]);

  const feePct = data ? Math.round(data.payment_processing_fee_rate * 1000) / 10 : 2.9;
  const processingFees =
    data?.payment_processing_fees ??
    (data ? Math.max(0, data.gross_sales - data.sales_after_processing) : 0);

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="shrink-0 rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Earnings</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Receivable after payment processing and delivery costs.
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              We have a weekly payment settlement.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => {
              const active = period === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPeriod(p.value)}
                  className={[
                    "rounded-md px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-violet-600 text-white shadow-sm"
                      : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50",
                  ].join(" ")}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!isReady ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
          Loading…
        </div>
      ) : !businessId ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          Your account is not linked to a business yet.
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          {error}
        </div>
      ) : loading && !data ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
          Loading earnings…
        </div>
      ) : data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Sales
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Only delivered orders (by delivery date) count toward sales
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-zinc-600">Eligible orders</dt>
                <dd className="font-medium tabular-nums text-zinc-900">{data.orders_count}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-zinc-600">Gross sales</dt>
                <dd className="font-medium tabular-nums text-zinc-900">
                  {formatRs(data.gross_sales)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-zinc-600">
                  After payment processing
                  <span className="mt-0.5 block text-xs font-normal text-zinc-400">
                    {feePct}% on eSewa/Khalti · 0% on COD
                  </span>
                </dt>
                <dd className="font-semibold tabular-nums text-zinc-900">
                  {formatRs(data.sales_after_processing)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Delivery costs
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-zinc-600">Deliveries booked</dt>
                <dd className="font-medium tabular-nums text-zinc-900">
                  {data.deliveries_booked}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-zinc-600">Outbound shipping</dt>
                <dd className="font-medium tabular-nums text-zinc-900">
                  {formatRs(data.shipping_outbound)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-zinc-600">
                  Return shipping
                  {data.returns_count > 0 ? (
                    <span className="mt-0.5 block text-xs font-normal text-zinc-400">
                      {data.returns_count} return
                      {data.returns_count === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </dt>
                <dd className="font-medium tabular-nums text-zinc-900">
                  {formatRs(data.shipping_return)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-zinc-100 pt-3">
                <dt className="font-medium text-zinc-700">Total shipping</dt>
                <dd className="font-semibold tabular-nums text-zinc-900">
                  {formatRs(data.shipping_total)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-6 lg:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-violet-700">
              Receivable
            </h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-zinc-700">Gross sales</dt>
                <dd className="font-medium tabular-nums text-zinc-900">
                  {formatRs(data.gross_sales)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-zinc-600">Payment processing ({feePct}%)</dt>
                <dd className="font-medium tabular-nums text-red-600">
                  −{formatRs(processingFees)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-zinc-600">Delivery shipping</dt>
                <dd className="font-medium tabular-nums text-red-600">
                  −{formatRs(data.shipping_total)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-violet-200/80 pt-3">
                <dt className="text-base font-semibold text-violet-950">Total receivable</dt>
                <dd className="text-2xl font-semibold tabular-nums text-violet-950">
                  {formatRs(data.receivable)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-violet-800/80">
              We have a weekly payment settlement.
            </p>
            {loading ? (
              <p className="mt-2 text-xs text-violet-600">Refreshing…</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
