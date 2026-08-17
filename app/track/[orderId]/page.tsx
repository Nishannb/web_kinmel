"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { KinmelBrandLink } from "@/components/KinmelLogo";
import {
  fetchPublicOrderTracking,
  type PublicOrderTracking,
} from "@/lib/publicTrackingClient";

function formatTrackingTimestamp(raw: string): string {
  const text = (raw || "").trim();
  if (!text) return "";
  const parsed = new Date(text.includes("T") ? text : text.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return text;
  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function shortOrderId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export default function TrackOrderPage() {
  const params = useParams();
  const orderId = String(params?.orderId || "").trim();

  const [data, setData] = useState<PublicOrderTracking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orderId) {
      setError("Missing order id");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPublicOrderTracking(orderId);
      setData(result);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Could not load tracking");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const logs = [...(data?.status_logs ?? [])].reverse();

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900">
      <div className="mx-auto mb-6 flex max-w-md justify-center">
        <KinmelBrandLink size="md" tone="neutral" />
      </div>

      <section className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Track delivery</h1>
            {orderId ? (
              <p className="mt-1 text-sm text-zinc-500">
                Order {shortOrderId(orderId)}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="shrink-0 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {loading && !data ? (
          <p className="mt-6 text-sm text-zinc-500">Loading tracking…</p>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {data ? (
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Current status
              </p>
              <p className="mt-1.5 inline-flex rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-900 ring-1 ring-violet-200">
                {data.status || "Pending updates"}
              </p>
            </div>

            {logs.length > 0 ? (
              <ol className="space-y-4 border-t border-zinc-100 pt-5">
                {logs.map((entry, idx) => (
                  <li
                    key={`${entry.timestamp}-${entry.status}-${idx}`}
                    className="flex gap-3"
                  >
                    <span
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900">
                        {entry.status || "Update"}
                      </p>
                      {entry.log ? (
                        <p className="mt-0.5 text-sm text-zinc-600">{entry.log}</p>
                      ) : null}
                      {entry.timestamp ? (
                        <p className="mt-1 text-xs text-zinc-500">
                          {formatTrackingTimestamp(entry.timestamp)}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : !loading ? (
              <p className="border-t border-zinc-100 pt-5 text-sm text-zinc-500">
                No courier updates yet. Check back soon.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <p className="mx-auto mt-6 max-w-md text-center text-xs text-zinc-500">
        <Link href="/" className="font-medium text-zinc-700 underline-offset-2 hover:underline">
          Kinmel
        </Link>
      </p>
    </main>
  );
}
