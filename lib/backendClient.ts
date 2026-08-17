import { getBackendHttpBase } from "@/lib/publicConfig";
import { backendRequestHeaders } from "@/lib/backendFetch";
import { getSafeSession } from "@/lib/supabaseAuth";

function backendUrl(path: string): string {
  const base = getBackendHttpBase().replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

export type FeaturedProduct = {
  id: string;
  name: string;
  price: number;
  currency: string;
  image_url: string;
  product_url: string;
  discounted_price: number | null;
  live_call_number: string;
};

export type OverlayStatePayload = {
  overlay_text: string;
  text_position: "top" | "bottom";
  product_card_layout: "bottom" | "top_corner" | "both";
  visible_product_ids: string[];
  featured_products: FeaturedProduct[];
};

export type OverlayStateEnvelope = {
  live_session_id: string;
  version: number;
  payload: OverlayStatePayload;
};

export type StreamConfig = {
  live_session_id: string;
  platform: "instagram" | "twitch" | "custom" | "facebook";
  rtmp_url: string;
  stream_key: string;
  status: "pending" | "used" | "expired";
  expires_at: string | null;
  updated_at: string | null;
  facebook_page_id?: string | null;
  facebook_live_video_id?: string | null;
};

export type BusinessRtmpDefault = {
  platform: "instagram" | "twitch" | "custom" | "facebook";
  rtmp_url: string;
  updated_at: string | null;
};

export type StreamConfigEnvelope = {
  config: StreamConfig | null;
  rtmp_default: BusinessRtmpDefault | null;
};

async function authHeaders(): Promise<HeadersInit> {
  const session = await getSafeSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error("Not authenticated");
  }
  return backendRequestHeaders({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });
}

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let message = `Backend error ${res.status}`;
    try {
      const parsed = text ? JSON.parse(text) : null;
      if (parsed?.error) message = String(parsed.error);
    } catch {
      if (text?.trimStart().startsWith("<!")) {
        message =
          "API returned HTML instead of JSON. Check that Flask is running and the Kinmel backend proxy is configured.";
      } else if (text) {
        message = text.slice(0, 280);
      }
    }
    throw new Error(message);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

async function safeBackendFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new Error("Something went wrong, please try again.");
  }
}

export async function fetchOverlayState(
  liveSessionId: string
): Promise<OverlayStateEnvelope> {
  const headers = await authHeaders();
  const res = await safeBackendFetch(
    backendUrl(`/live-sessions/${encodeURIComponent(liveSessionId)}/overlay-state`),
    { headers, cache: "no-store" }
  );
  return readJson<OverlayStateEnvelope>(res);
}

export type OverlayStateUpdateInput = {
  overlay_text: string;
  text_position: "top" | "bottom";
  product_card_layout: "bottom" | "top_corner" | "both";
  visible_product_ids: string[];
};

export async function pushOverlayState(
  liveSessionId: string,
  payload: OverlayStateUpdateInput
): Promise<OverlayStateEnvelope> {
  const headers = await authHeaders();
  const res = await safeBackendFetch(
    backendUrl(`/live-sessions/${encodeURIComponent(liveSessionId)}/overlay-state`),
    {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    }
  );
  return readJson<OverlayStateEnvelope>(res);
}

export async function fetchStreamConfig(
  liveSessionId: string
): Promise<StreamConfigEnvelope> {
  const headers = await authHeaders();
  const res = await safeBackendFetch(
    backendUrl(`/live-sessions/${encodeURIComponent(liveSessionId)}/stream-config`),
    { headers, cache: "no-store" }
  );
  return readJson<StreamConfigEnvelope>(res);
}

export type StreamConfigInput = {
  platform: "instagram" | "twitch" | "custom" | "facebook";
  rtmp_url: string;
  stream_key: string;
  expires_at?: string | null;
  persist_rtmp_default?: boolean;
  facebook_page_id?: string | null;
};

export async function saveStreamConfig(
  liveSessionId: string,
  input: StreamConfigInput
): Promise<StreamConfigEnvelope> {
  const headers = await authHeaders();
  const res = await safeBackendFetch(
    backendUrl(`/live-sessions/${encodeURIComponent(liveSessionId)}/stream-config`),
    {
      method: "PUT",
      headers,
      body: JSON.stringify({
        platform: input.platform,
        rtmp_url: input.rtmp_url,
        stream_key: input.stream_key,
        expires_at: input.expires_at ?? null,
        persist_rtmp_default: Boolean(input.persist_rtmp_default),
        facebook_page_id: input.facebook_page_id ?? null,
      }),
    }
  );
  return readJson<StreamConfigEnvelope>(res);
}

export type ProviderDeliveryQuote = {
  provider: string;
  ok: boolean;
  display_name: string;
  logo_path: string;
  final_price: number | null;
  provider_price?: number | null;
  markup?: number | null;
  currency?: string;
  error?: string | null;
  pickup_branch_code?: string | null;
  pickup_branch_name?: string | null;
  destination_branch_code?: string | null;
  destination_branch_name?: string | null;
  details?: Record<string, unknown>;
};

export type BookDeliveryQuote = {
  price: number | null;
  discount: number | null;
  promo_discount: number | null;
  additional_charge: number | null;
  final_price: number | null;
  markup?: number | null;
  pathao_final_price?: number | null;
  cod_enabled: boolean | null;
  cod_percentage: number | null;
  plan_id?: unknown;
  provider?: string;
};

export type BookDeliveryResult = {
  ok: boolean;
  order_id: string;
  provider: string;
  providers?: string[];
  quotes?: ProviderDeliveryQuote[];
  store_id?: number;
  item_weight?: number;
  token_refreshed?: boolean;
  message?: string;
  quote?: BookDeliveryQuote;
  recipient?: {
    city?: string;
    address_line1?: string | null;
    address_line2?: string | null;
    pathao_city_id?: number;
    pathao_zone_id?: number;
  };
};

export type SellerOrderAddress = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  is_default: boolean | null;
};

export type SellerOrderCustomer = {
  id: string;
  name: string | null;
  email: string | null;
  customer_addresses?: SellerOrderAddress[] | null;
};

export type SellerOrderItem = {
  id: string;
  product_id: string | null;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  line_total: number;
  variant_id?: string | null;
  variant_label_snapshot?: string | null;
  products?: { image_url: string | null } | { image_url: string | null }[] | null;
};

export type SellerOrder = {
  id: string;
  status: string;
  currency: string;
  subtotal: number;
  shipping_fee: number;
  tax: number;
  total: number;
  payment_method: string | null;
  esewa_transaction_uuid: string | null;
  khalti_pidx: string | null;
  checkout_name?: string | null;
  order_tracking_id?: string | null;
  parcel_consignment_id?: string | null;
  parcel_status?: string | null;
  ordered_at: string;
  delivered_at?: string | null;
  created_at: string;
  updated_at: string;
  live_session_id: string | null;
  customers: SellerOrderCustomer | SellerOrderCustomer[] | null;
  order_items: SellerOrderItem[] | null;
  live_sessions: { id: string; title: string | null } | null;
  return_shipping_fee?: number;
};

export async function fetchBusinessOrders(businessId: string): Promise<SellerOrder[]> {
  const headers = await authHeaders();
  const res = await safeBackendFetch(
    backendUrl(`/businesses/${encodeURIComponent(businessId)}/orders`),
    { headers, cache: "no-store" }
  );
  const data = await readJson<{ ok?: boolean; orders?: SellerOrder[] }>(res);
  return Array.isArray(data.orders) ? data.orders : [];
}

export async function updateOrderStatus(
  orderId: string,
  businessId: string,
  status: string
): Promise<void> {
  const headers = await authHeaders();
  const res = await safeBackendFetch(
    backendUrl(`/orders/${encodeURIComponent(orderId)}/status`),
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ business_id: businessId, status }),
    }
  );
  await readJson<{ ok?: boolean }>(res);
}

export type EarningsPeriod = "daily" | "weekly" | "monthly";

export type BusinessEarnings = {
  ok: boolean;
  period: EarningsPeriod;
  currency: string;
  timezone: string;
  period_start: string;
  period_end: string;
  payment_processing_fee_rate: number;
  orders_count: number;
  gross_sales: number;
  payment_processing_fees?: number;
  sales_after_processing: number;
  deliveries_booked: number;
  returns_count: number;
  shipping_outbound: number;
  shipping_return: number;
  shipping_total: number;
  receivable: number;
};

export async function fetchBusinessEarnings(
  businessId: string,
  period: EarningsPeriod
): Promise<BusinessEarnings> {
  const headers = await authHeaders();
  const sp = new URLSearchParams({ period });
  const res = await safeBackendFetch(
    backendUrl(
      `/businesses/${encodeURIComponent(businessId)}/earnings?${sp.toString()}`
    ),
    { headers, cache: "no-store" }
  );
  return readJson<BusinessEarnings>(res);
}

export async function bookOrderDelivery(
  orderId: string,
  businessId: string,
  itemWeightKg: number,
  packageDims?: {
    widthCm?: number;
    heightCm?: number;
    lengthCm?: number;
  }
): Promise<BookDeliveryResult> {
  const headers = await authHeaders();
  const res = await safeBackendFetch(
    backendUrl(`/orders/${encodeURIComponent(orderId)}/book-delivery`),
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        business_id: businessId,
        item_weight: itemWeightKg,
        ...(packageDims?.widthCm != null
          ? { package_width: packageDims.widthCm }
          : {}),
        ...(packageDims?.heightCm != null
          ? { package_height: packageDims.heightCm }
          : {}),
        ...(packageDims?.lengthCm != null
          ? { package_length: packageDims.lengthCm }
          : {}),
      }),
    }
  );
  return readJson<BookDeliveryResult>(res);
}

export type PlaceDeliveryResult = {
  ok: boolean;
  order_id: string;
  provider: string;
  status?: string;
  store_id?: number;
  item_weight?: number;
  amount_to_collect?: number;
  order_tracking_id?: string;
  parcel_consignment_id?: string;
  parcel_status?: string | null;
  logistics_provider?: string | null;
  shipping_fee?: number;
  message?: string;
};

export async function placeOrderDelivery(
  orderId: string,
  businessId: string,
  itemWeightKg: number,
  provider?: string,
  packageDims?: {
    widthCm?: number;
    heightCm?: number;
    lengthCm?: number;
  }
): Promise<PlaceDeliveryResult> {
  const headers = await authHeaders();
  const res = await safeBackendFetch(
    backendUrl(`/orders/${encodeURIComponent(orderId)}/place-delivery`),
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        business_id: businessId,
        item_weight: itemWeightKg,
        ...(provider ? { provider } : {}),
        ...(packageDims?.widthCm != null
          ? { package_width: packageDims.widthCm }
          : {}),
        ...(packageDims?.heightCm != null
          ? { package_height: packageDims.heightCm }
          : {}),
        ...(packageDims?.lengthCm != null
          ? { package_length: packageDims.lengthCm }
          : {}),
      }),
    }
  );
  return readJson<PlaceDeliveryResult>(res);
}
