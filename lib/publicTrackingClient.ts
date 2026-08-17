import { getBackendHttpBase } from "@/lib/publicConfig";
import { backendRequestHeaders } from "@/lib/backendFetch";

export type PublicOrderTrackingLog = {
  timestamp: string;
  status: string;
  log?: string;
};

export type PublicOrderTracking = {
  ok: boolean;
  order_id: string;
  status?: string | null;
  order_status?: string | null;
  status_logs?: PublicOrderTrackingLog[];
  delivered_date?: string | null;
  received_date?: string | null;
  destination_branch?: string | null;
  pickup_branch?: string | null;
  ordered_at?: string | null;
};

export async function fetchPublicOrderTracking(
  orderId: string
): Promise<PublicOrderTracking> {
  const id = (orderId || "").trim();
  if (!id) throw new Error("Order id is required");

  const url = `${getBackendHttpBase()}/public/orders/${encodeURIComponent(id)}/tracking`;
  const res = await fetch(url, {
    method: "GET",
    headers: backendRequestHeaders(),
    cache: "no-store",
  });
  const raw = await res.text();
  let data: unknown = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error("Tracking returned non-JSON (check backend URL).");
  }
  if (!res.ok) {
    const err = data as { error?: string; message?: string } | null;
    throw new Error(
      err?.error || err?.message || `Failed to load tracking (${res.status})`
    );
  }
  return data as PublicOrderTracking;
}
