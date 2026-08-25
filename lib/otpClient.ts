import { getBackendHttpBase } from "@/lib/publicConfig";
import { backendRequestHeaders } from "@/lib/backendFetch";

const GENERIC_SEND = "Could not send OTP";
const GENERIC_VERIFY = "Invalid or expired code";

async function readJson(
  res: Response
): Promise<{ ok?: boolean; error?: string; retryAfterSeconds?: number }> {
  const text = await res.text();
  try {
    return JSON.parse(text) as {
      ok?: boolean;
      error?: string;
      retryAfterSeconds?: number;
    };
  } catch {
    return {};
  }
}

export async function requestNepalOtp(
  phone: string
): Promise<{ retryAfterSeconds: number }> {
  const base = getBackendHttpBase().replace(/\/+$/, "");
  if (!base) {
    throw new Error(GENERIC_SEND);
  }
  const res = await fetch(`${base}/auth/otp/request`, {
    method: "POST",
    headers: backendRequestHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ phone }),
  });
  const body = await readJson(res);
  if (!res.ok || body.ok === false) {
    throw new Error(body.error?.trim() || GENERIC_SEND);
  }
  return { retryAfterSeconds: body.retryAfterSeconds ?? 60 };
}

export async function verifyNepalOtp(phone: string, code: string): Promise<void> {
  const base = getBackendHttpBase().replace(/\/+$/, "");
  if (!base) {
    throw new Error(GENERIC_VERIFY);
  }
  const res = await fetch(`${base}/auth/otp/verify`, {
    method: "POST",
    headers: backendRequestHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ phone, code }),
  });
  const body = await readJson(res);
  if (!res.ok || body.ok === false) {
    throw new Error(body.error?.trim() || GENERIC_VERIFY);
  }
}

export async function claimNepalOtp(
  phone: string,
  accessToken: string
): Promise<void> {
  const base = getBackendHttpBase().replace(/\/+$/, "");
  if (!base) {
    throw new Error(GENERIC_VERIFY);
  }
  const res = await fetch(`${base}/auth/otp/claim`, {
    method: "POST",
    headers: backendRequestHeaders({
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    }),
    body: JSON.stringify({ phone }),
  });
  const body = await readJson(res);
  if (!res.ok || body.ok === false) {
    throw new Error(body.error?.trim() || GENERIC_VERIFY);
  }
}
