"use client";

import { RequireAuth } from "@/components/RequireAuth";

export default function OrdersPage() {
  return (
    <RequireAuth>
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Orders module placeholder. We will design this section next.
        </p>
      </section>
    </RequireAuth>
  );
}

