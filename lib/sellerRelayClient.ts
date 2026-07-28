import { backendRequestHeaders } from "@/lib/backendFetch";
import { getBackendHttpBase } from "@/lib/publicConfig";
import type { SellerRelayResult } from "@/lib/sellerShop";

export async function fetchSellerRelay(username: string): Promise<SellerRelayResult> {
  const u = encodeURIComponent(username.trim().replace(/^@+/, ""));
  const url = `${getBackendHttpBase()}/public/relay/${u}`;
  const res = await fetch(url, {
    method: "GET",
    headers: backendRequestHeaders(),
    cache: "no-store",
  });
  const raw = await res.text();
  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error("Seller relay returned non-JSON.");
  }
  if (!res.ok) {
    const err = data as { code?: string };
    return { ok: false, code: err?.code || "seller_not_found" };
  }
  return data as SellerRelayResult;
}
