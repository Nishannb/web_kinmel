import { backendRequestHeaders } from "@/lib/backendFetch";
import { getBackendHttpBase } from "@/lib/publicConfig";

export const PREMIUM_OVERLAY_ANNUAL_NPR = 24_000;
export const PREMIUM_OVERLAY_MONTHLY_NPR = 2_000;

export type PremiumOverlayStatus = {
  active: boolean;
  expires_at: string | null;
  annual_amount_npr: number;
  monthly_amount_npr: number;
  plan: string;
};

export function isPremiumOverlayActive(
  expiresAt: string | null | undefined,
  nowMs = Date.now(),
): boolean {
  const raw = (expiresAt || "").trim();
  if (!raw) return false;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) && parsed > nowMs;
}

export async function fetchPremiumOverlayStatus(
  accessToken: string,
  businessId: string,
): Promise<PremiumOverlayStatus> {
  const url = `${getBackendHttpBase()}/businesses/${encodeURIComponent(businessId)}/premium-overlay`;
  const res = await fetch(url, {
    method: "GET",
    headers: backendRequestHeaders({
      Authorization: `Bearer ${accessToken}`,
    }),
    cache: "no-store",
  });
  const raw = await res.text();
  let data: PremiumOverlayStatus & { ok?: boolean; error?: string };
  try {
    data = raw ? JSON.parse(raw) : ({} as PremiumOverlayStatus & { ok?: boolean });
  } catch {
    throw new Error("Premium status returned non-JSON.");
  }
  if (!res.ok) {
    throw new Error(data.error || `Failed to load premium status (${res.status})`);
  }
  return {
    active: data.active === true,
    expires_at: data.expires_at ?? null,
    annual_amount_npr: data.annual_amount_npr ?? PREMIUM_OVERLAY_ANNUAL_NPR,
    monthly_amount_npr: data.monthly_amount_npr ?? PREMIUM_OVERLAY_MONTHLY_NPR,
    plan: data.plan ?? "overlay_annual",
  };
}

export async function initPremiumOverlayKhaltiPayment(
  accessToken: string,
  businessId: string,
): Promise<{ payment_url: string; pidx: string; checkout_token: string }> {
  const url = `${getBackendHttpBase()}/businesses/${encodeURIComponent(businessId)}/premium-overlay/khalti/init`;
  const res = await fetch(url, {
    method: "POST",
    headers: backendRequestHeaders({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    }),
    body: "{}",
  });
  const raw = await res.text();
  let data: {
    ok?: boolean;
    payment_url?: string;
    pidx?: string;
    checkout_token?: string;
    error?: string;
  };
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error("Payment init returned non-JSON.");
  }
  if (!res.ok) {
    throw new Error(data.error || `Could not start payment (${res.status})`);
  }
  const paymentUrl = (data.payment_url || "").trim();
  const pidx = (data.pidx || "").trim();
  const checkoutToken = (data.checkout_token || "").trim();
  if (!paymentUrl || !pidx) {
    throw new Error("Payment could not be started");
  }
  return { payment_url: paymentUrl, pidx, checkout_token: checkoutToken };
}

export type PremiumCheckoutResume = {
  status: "pending" | "paid";
  payment_url?: string;
  pidx?: string;
  business_id?: string;
  business_name?: string;
  amount_npr?: number;
  expires_at?: string | null;
  checkout_token?: string;
};

export async function resumePremiumCheckout(token: string): Promise<PremiumCheckoutResume> {
  const url = `${getBackendHttpBase()}/public/premium-overlay/checkout?token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: backendRequestHeaders(),
    cache: "no-store",
  });
  const raw = await res.text();
  let data: PremiumCheckoutResume & { ok?: boolean; error?: string };
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error("Checkout resume returned non-JSON.");
  }
  if (!res.ok) {
    throw new Error(data.error || `Checkout unavailable (${res.status})`);
  }
  return data;
}

export async function verifyPremiumOverlayKhaltiPayment(
  pidx: string,
  businessId: string,
): Promise<{ expires_at: string | null; business_id: string | null }> {
  const url = `${getBackendHttpBase()}/public/premium-overlay/khalti/verify`;
  const res = await fetch(url, {
    method: "POST",
    headers: backendRequestHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ pidx, businessId }),
  });
  const raw = await res.text();
  let data: {
    ok?: boolean;
    status?: string;
    expires_at?: string | null;
    business_id?: string | null;
    khalti_status?: string;
    error?: string;
    code?: string;
  };
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error("Payment verify returned non-JSON.");
  }
  if (!res.ok || !data.ok || data.status !== "paid") {
    throw new Error(
      data.khalti_status
        ? `Payment not completed (Khalti: ${data.khalti_status})`
        : data.error || "Payment could not be confirmed",
    );
  }
  const paidBusinessId = (data.business_id || "").trim();
  if (paidBusinessId && paidBusinessId !== businessId.trim()) {
    throw new Error("Payment does not belong to your account.");
  }
  return {
    expires_at: data.expires_at ?? null,
    business_id: paidBusinessId || null,
  };
}
