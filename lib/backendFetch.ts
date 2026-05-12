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

export async function fetchPublicProductJson(productId: string): Promise<{
  product: {
    id: string;
    name: string;
    price: number;
    currency: string;
    image_url: string;
    product_url: string;
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
      price: number;
      currency: string;
      image_url: string;
      product_url: string;
    };
  };
}
