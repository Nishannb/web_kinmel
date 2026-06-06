import { backendRequestHeaders } from "@/lib/backendFetch";
import { getBackendHttpBase } from "@/lib/publicConfig";

export type CodCheckoutPayload = {
  product_id: string;
  customer_name: string;
  phone: string;
  address: string;
  city?: string;
  /** Number of units (1–99). Defaults to 1 server-side if omitted. */
  quantity?: number;
};

/** Ensures quantity is a 1–99 integer and duplicates `qty` for older API proxies. */
function checkoutJsonBody(payload: CodCheckoutPayload): string {
  const q = Math.min(99, Math.max(1, Math.floor(Number(payload.quantity ?? 1))));
  return JSON.stringify({
    product_id: payload.product_id,
    customer_name: payload.customer_name,
    phone: payload.phone,
    address: payload.address,
    city: payload.city ?? "",
    quantity: q,
    qty: q,
  });
}

export async function postCodCheckout(
  payload: CodCheckoutPayload
): Promise<{
  ok: boolean;
  order_id: string;
  business_id?: string;
  total: number;
  currency: string;
  quantity?: number;
  message: string;
}> {
  const url = `${getBackendHttpBase()}/public/checkout/cod`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...backendRequestHeaders({ "Content-Type": "application/json" }),
    },
    body: checkoutJsonBody(payload),
  });
  const raw = await res.text();
  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error("Checkout returned non-JSON.");
  }
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error || `Checkout failed (${res.status})`);
  }
  return data as {
    ok: boolean;
    order_id: string;
    business_id?: string;
    total: number;
    currency: string;
    quantity?: number;
    message: string;
  };
}

export type EsewaInitResponse = {
  ok: boolean;
  /** Real order id exists only after payment verify; wallet init uses `checkout_session_id` until then. */
  order_id: string | null;
  checkout_session_id?: string | null;
  payment_method?: string;
  payment_url: string;
  form_fields: Record<string, string>;
  transaction_uuid: string;
};

export async function postEsewaInit(
  payload: CodCheckoutPayload
): Promise<EsewaInitResponse> {
  const url = `${getBackendHttpBase()}/public/checkout/esewa/init`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...backendRequestHeaders({ "Content-Type": "application/json" }),
    },
    body: checkoutJsonBody(payload),
  });
  const raw = await res.text();
  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error("Checkout returned non-JSON.");
  }
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error || `eSewa init failed (${res.status})`);
  }
  return data as EsewaInitResponse;
}

export type EsewaVerifyResult = {
  ok: boolean;
  status?: string;
  order_id?: string;
  ref_id?: string;
  error?: string;
  business_id?: string;
  total?: number;
  currency?: string;
  /** Present on success and on some failed/pending responses when checkout session or order is known. */
  product_id?: string | null;
  quantity?: number;
  detail?: unknown;
  code?: string;
};

/** eSewa returns the verification payload as `data` (base64 JSON) on success_url. */
export async function postEsewaVerify(encodedData: string): Promise<EsewaVerifyResult> {
  const url = `${getBackendHttpBase()}/public/checkout/esewa/verify`;
  const controller = new AbortController();
  const timeoutMs = 70_000;
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        ...backendRequestHeaders({ "Content-Type": "application/json" }),
      },
      body: JSON.stringify({ data: encodedData }),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(tid);
    const aborted = e instanceof Error && e.name === "AbortError";
    if (aborted) {
      throw new Error(
        `Verification timed out after ${timeoutMs / 1000}s. Try refreshing this page — your payment may still complete.`
      );
    }
    throw e;
  }
  clearTimeout(tid);
  const raw = await res.text();
  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error("Verify returned non-JSON.");
  }
  if (!res.ok) {
    const d = data as EsewaVerifyResult;
    if (d && typeof d === "object" && (d.ok === false || d.product_id)) {
      return d;
    }
    throw new Error(d?.error || `Verify failed (${res.status})`);
  }
  return data as EsewaVerifyResult;
}

export type KhaltiInitResponse = {
  ok: boolean;
  order_id: string | null;
  checkout_session_id?: string | null;
  payment_method: string;
  payment_url: string;
  pidx: string;
};

export async function postKhaltiInit(payload: CodCheckoutPayload): Promise<KhaltiInitResponse> {
  const url = `${getBackendHttpBase()}/public/checkout/khalti/init`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...backendRequestHeaders({ "Content-Type": "application/json" }),
    },
    body: checkoutJsonBody(payload),
  });
  const raw = await res.text();
  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error("Checkout returned non-JSON.");
  }
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error || `Khalti init failed (${res.status})`);
  }
  return data as KhaltiInitResponse;
}

export async function postKhaltiVerify(pidx: string): Promise<{
  ok: boolean;
  status?: string;
  order_id?: string;
  ref_id?: string;
  error?: string;
  business_id?: string;
  total?: number;
  currency?: string;
  product_id?: string | null;
  quantity?: number;
  khalti_status?: string;
  detail?: unknown;
}> {
  const url = `${getBackendHttpBase()}/public/checkout/khalti/verify`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...backendRequestHeaders({ "Content-Type": "application/json" }),
    },
    body: JSON.stringify({ pidx }),
  });
  const raw = await res.text();
  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error("Verify returned non-JSON.");
  }
  if (!res.ok) {
    const d = data as {
      ok?: boolean;
      error?: string;
      status?: string;
      product_id?: string | null;
      khalti_status?: string;
      detail?: unknown;
    };
    if (d && typeof d === "object" && d.ok === false) {
      return d as {
        ok: boolean;
        status?: string;
        order_id?: string;
        ref_id?: string;
        error?: string;
        business_id?: string;
        total?: number;
        currency?: string;
        product_id?: string | null;
        quantity?: number;
        khalti_status?: string;
        detail?: unknown;
      };
    }
    throw new Error(d?.error || d?.status || `Verify failed (${res.status})`);
  }
  return data as {
    ok: boolean;
    status?: string;
    order_id?: string;
    ref_id?: string;
    error?: string;
    business_id?: string;
    total?: number;
    currency?: string;
    product_id?: string | null;
    quantity?: number;
    khalti_status?: string;
    detail?: unknown;
  };
}
