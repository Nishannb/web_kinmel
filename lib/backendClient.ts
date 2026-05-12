import { PUBLIC_BACKEND_URL } from "@/lib/publicConfig";
import { supabase } from "@/lib/supabase";

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
  platform: "instagram" | "twitch" | "custom";
  rtmp_url: string;
  stream_key: string;
  status: "pending" | "used" | "expired";
  expires_at: string | null;
  updated_at: string | null;
};

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("Not authenticated");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let message = `Backend error ${res.status}`;
    try {
      const parsed = text ? JSON.parse(text) : null;
      if (parsed?.error) message = String(parsed.error);
    } catch {
      if (text) message = text;
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `NetworkError when attempting to fetch resource. Backend: ${PUBLIC_BACKEND_URL}. Details: ${message}`
    );
  }
}

export async function fetchOverlayState(
  liveSessionId: string
): Promise<OverlayStateEnvelope> {
  const headers = await authHeaders();
  const res = await safeBackendFetch(
    `${PUBLIC_BACKEND_URL}/live-sessions/${liveSessionId}/overlay-state`,
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
    `${PUBLIC_BACKEND_URL}/live-sessions/${liveSessionId}/overlay-state`,
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
): Promise<StreamConfig | null> {
  const headers = await authHeaders();
  const res = await safeBackendFetch(
    `${PUBLIC_BACKEND_URL}/live-sessions/${liveSessionId}/stream-config`,
    { headers, cache: "no-store" }
  );
  const body = await readJson<{ config: StreamConfig | null }>(res);
  return body.config ?? null;
}

export type StreamConfigInput = {
  platform: "instagram" | "twitch" | "custom";
  rtmp_url: string;
  stream_key: string;
  expires_at?: string | null;
};

export async function saveStreamConfig(
  liveSessionId: string,
  input: StreamConfigInput
): Promise<StreamConfig> {
  const headers = await authHeaders();
  const res = await safeBackendFetch(
    `${PUBLIC_BACKEND_URL}/live-sessions/${liveSessionId}/stream-config`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({
        platform: input.platform,
        rtmp_url: input.rtmp_url,
        stream_key: input.stream_key,
        expires_at: input.expires_at ?? null,
      }),
    }
  );
  const body = await readJson<{ config: StreamConfig }>(res);
  return body.config;
}
