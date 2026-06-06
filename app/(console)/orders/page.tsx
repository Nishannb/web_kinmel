"use client";

import { BusinessOrdersPanel } from "@/components/orders/BusinessOrdersPanel";
import { useAppState } from "@/components/AppProvider";

export default function OrdersPage() {
  const { businessId, isReady } = useAppState();

  return (
    <div className="flex min-h-0 flex-col gap-4 max-xl:min-h-full xl:h-full">
      <div className="shrink-0 rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Orders</h1>
      </div>

      <div className="flex min-h-0 flex-1 flex-col max-xl:overflow-visible xl:overflow-hidden">
        {!isReady ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
            Loading…
          </div>
        ) : !businessId ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            Your account is not linked to a business yet, so orders cannot be loaded. Complete
            onboarding or contact support.
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col max-xl:overflow-visible xl:overflow-hidden rounded-xl border border-zinc-200 bg-white p-6">
            <BusinessOrdersPanel businessId={businessId} />
          </div>
        )}
      </div>
    </div>
  );
}
