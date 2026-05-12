import { backendRequestHeaders } from "@/lib/backendFetch";
import { getBackendHttpBase } from "@/lib/publicConfig";

export type CodCheckoutPayload = {
  product_id: string;
  customer_name: string;
  phone: string;
  address: string;
  city?: string;
};

export async function postCodCheckout(
  payload: CodCheckoutPayload
): Promise<{
  ok: boolean;
  order_id: string;
  total: number;
  currency: string;
  message: string;
}> {
  const url = `${getBackendHttpBase()}/public/checkout/cod`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...backendRequestHeaders({ "Content-Type": "application/json" }),
    },
    body: JSON.stringify(payload),
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
    total: number;
    currency: string;
    message: string;
  };
}

export type EsewaInitResponse = {
  ok: boolean;
  order_id: string;
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
    body: JSON.stringify(payload),
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

export async function postEsewaVerify(encodedData: string): Promise<{
  ok: boolean;
  status?: string;
  order_id?: string;
  ref_id?: string;
  error?: string;
}> {
  const url = `${getBackendHttpBase()}/public/checkout/esewa/verify`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...backendRequestHeaders({ "Content-Type": "application/json" }),
    },
    body: JSON.stringify({ data: encodedData }),
  });
  const raw = await res.text();
  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error("Verify returned non-JSON.");
  }
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error || `Verify failed (${res.status})`);
  }
  return data as {
    ok: boolean;
    status?: string;
    order_id?: string;
    ref_id?: string;
    error?: string;
  };
}
