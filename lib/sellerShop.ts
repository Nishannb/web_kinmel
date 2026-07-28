import { SITE_URL } from "@/lib/siteMetadata";

export type SellerRelayResult = {
  ok: boolean;
  code?: string;
  seller_username?: string;
  business_id?: string;
  business_name?: string;
  instagram_username?: string;
  live_active?: boolean;
  live_session_id?: string | null;
  product_id?: string | null;
};

/** Stable IG external link: snapshots current live product on first visit. */
export function sellerShopUrl(username: string): string {
  const u = (username || "").trim().replace(/^@+/, "");
  if (!u) return SITE_URL;
  return `${SITE_URL}/${encodeURIComponent(u)}`;
}

export function buyPagePath(
  productId: string,
  opts?: { fromLive?: boolean; seller?: string }
): string {
  const sp = new URLSearchParams();
  if (opts?.fromLive) sp.set("from", "live");
  const seller = (opts?.seller || "").trim().replace(/^@+/, "");
  if (seller) sp.set("seller", seller);
  const qs = sp.toString();
  return `/buy/${encodeURIComponent(productId)}${qs ? `?${qs}` : ""}`;
}
