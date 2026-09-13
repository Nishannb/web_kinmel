import { getBackendHttpBase } from "@/lib/publicConfig";

/**
 * Ngrok free tier may serve an HTML browser-warning page (still HTTP 200) that does not
 * include CORS headers. Sending this header skips that page so the request hits Flask and
 * receives proper `Access-Control-Allow-Origin`.
 *
 * @see https://ngrok.com/docs/http/request-headers/#skip-browser-warning
 */
export const NGROK_SKIP_BROWSER_WARNING = "ngrok-skip-browser-warning";

export function backendRequestHeaders(
  extra?: Record<string, string>
): Record<string, string> {
  return {
    Accept: "application/json",
    [NGROK_SKIP_BROWSER_WARNING]: "true",
    ...extra,
  };
}

export type PublicCatalogProduct = {
  id: string;
  name: string;
  price: number;
  currency: string;
  image_url: string;
  product_url: string;
};

export async function fetchPublicCatalogJson(opts: {
  businessId: string;
  excludeProductId?: string;
  limit?: number;
}): Promise<{ products: PublicCatalogProduct[] }> {
  const sp = new URLSearchParams({
    business_id: opts.businessId,
    limit: String(opts.limit ?? 24),
  });
  if (opts.excludeProductId) {
    sp.set("exclude", opts.excludeProductId);
  }
  const url = `${getBackendHttpBase()}/public/catalog?${sp.toString()}`;
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
    throw new Error("Catalog returned non-JSON (check backend URL).");
  }
  if (!res.ok) {
    const err = data as { error?: string } | null;
    throw new Error(err?.error || `Failed to load catalog (${res.status})`);
  }
  return data as { products: PublicCatalogProduct[] };
}

export async function fetchPublicProductJson(productId: string): Promise<{
  product: {
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
  };
}> {
  const id = encodeURIComponent(productId);
  const url = `${getBackendHttpBase()}/public/products/${id}`;
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
    throw new Error("Product service returned non-JSON (check ngrok / backend URL).");
  }
  if (!res.ok) {
    const err = data as { error?: string } | null;
    throw new Error(err?.error || `Failed to load product (${res.status})`);
  }
  return data as {
    product: {
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
    };
  };
}

export type PublicMediaProduct = {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  image_url: string;
  product_url: string;
  business_id?: string;
  stock_quantity?: number | null;
  variants?: Array<{ id: string; label: string; stock_quantity: number }>;
  affiliate_influencer_business_id?: string | null;
  seller?: {
    business_name?: string;
    instagram_username?: string;
  };
};

export async function fetchPublicMediaProductsJson(opts: {
  platform: string;
  mediaId: string;
}): Promise<{ products: PublicMediaProduct[]; platform: string; media_id: string }> {
  const plat = encodeURIComponent(opts.platform.trim().toLowerCase());
  const mid = encodeURIComponent(opts.mediaId.trim());
  const url = `${getBackendHttpBase()}/public/media/${plat}/${mid}/products`;
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
    throw new Error("Media products returned non-JSON (check backend URL).");
  }
  if (!res.ok) {
    const err = data as { error?: string } | null;
    throw new Error(err?.error || `Failed to load media products (${res.status})`);
  }
  const parsed = data as {
    products?: PublicMediaProduct[];
    platform?: string;
    media_id?: string;
  };
  return {
    products: Array.isArray(parsed.products) ? parsed.products : [],
    platform: String(parsed.platform || opts.platform),
    media_id: String(parsed.media_id || opts.mediaId),
  };
}
