export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://sqmvkihvgegakhummwqe.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbXZraWh2Z2VnYWtodW1td3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NzUxMzEsImV4cCI6MjA5MzM1MTEzMX0.E9q9xvEPrH-EDjzdWB7_DeMCPQ-sVTEU0GxBytojU9E";

/** Raw env: Flask/API as seen in config (may mistakenly match the Next storefront URL). */
export const PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ?? "";

/** Same-origin path rewritten by Next to Flask (see next.config.mjs). */
export const BACKEND_HTTP_PROXY_PREFIX = "/kinmel-backend";

const DEFAULT_DEV_FLASK_HTTP = "http://127.0.0.1:8080";

function trimSlash(s: string) {
  return s.replace(/\/+$/, "");
}

/**
 * Base URL for HTTP calls to Flask (public product, checkout, storage, etc.).
 * - If NEXT_PUBLIC_BACKEND_URL is an absolute URL on a *different* origin than the page, uses it (second tunnel / direct API).
 * - If it matches the current page origin (common mistake: one ngrok → Next only), uses same origin + /kinmel-backend proxy.
 * - If unset, uses same origin + /kinmel-backend (local Next dev + rewrite to Flask).
 */
export function getBackendHttpBase(): string {
  const raw = PUBLIC_BACKEND_URL;
  if (/^https?:\/\//i.test(raw)) {
    if (typeof window !== "undefined") {
      try {
        if (new URL(raw).origin === new URL(window.location.href).origin) {
          return `${window.location.origin.replace(/\/+$/, "")}${BACKEND_HTTP_PROXY_PREFIX}`;
        }
      } catch {
        /* use absolute below */
      }
    }
    return trimSlash(raw);
  }

  const path = raw.startsWith("/") ? trimSlash(raw) : BACKEND_HTTP_PROXY_PREFIX;
  if (typeof window !== "undefined") {
    return `${window.location.origin.replace(/\/+$/, "")}${path}`;
  }

  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}` : "");
  if (site) {
    return `${site}${path}`;
  }
  return `http://127.0.0.1:3000${path}`;
}

/**
 * WebSocket base URL. Next.js HTTP rewrites do not reliably proxy WS, so when the HTTP
 * API goes through /kinmel-backend, browsers should connect directly to Flask unless you
 * use a separate public Flask URL.
 *
 * - NEXT_PUBLIC_BACKEND_WS_URL: optional explicit ws/http(s) base
 * - Else: NEXT_PUBLIC_BACKEND_URL if absolute and not the storefront origin
 * - Else: NEXT_PUBLIC_FLASK_URL or http://127.0.0.1:8080
 */
export function getBackendWsBase(): string {
  const wsEnv = process.env.NEXT_PUBLIC_BACKEND_WS_URL?.trim();
  if (wsEnv) {
    if (/^wss?:\/\//i.test(wsEnv)) {
      return trimSlash(wsEnv);
    }
    if (/^https?:\/\//i.test(wsEnv)) {
      return trimSlash(wsEnv)
        .replace(/^https/i, "wss")
        .replace(/^http/i, "ws");
    }
  }

  const configured = PUBLIC_BACKEND_URL;
  if (/^https?:\/\//i.test(configured) && typeof window !== "undefined") {
    try {
      if (new URL(configured).origin !== new URL(window.location.href).origin) {
        return trimSlash(configured)
          .replace(/^https/i, "wss")
          .replace(/^http/i, "ws");
      }
    } catch {
      /* fall through */
    }
  }

  const direct =
    process.env.NEXT_PUBLIC_FLASK_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_WS_URL?.trim() ||
    DEFAULT_DEV_FLASK_HTTP;
  return trimSlash(direct)
    .replace(/^https/i, "wss")
    .replace(/^http/i, "ws");
}

/** Dev-only fallback when no saved RTMP URL exists for the business. */
export const DEV_INSTAGRAM_RTMP_URL =
  process.env.NEXT_PUBLIC_INSTAGRAM_RTMP_URL?.trim() ?? "";
