/**
 * Kinmel web — API / storefront URLs.
 *
 * Development: set in `.env.local` (see `.env.example`).
 * Production: `.env.production` or Vercel env vars (override file defaults).
 */

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://sqmvkihvgegakhummwqe.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbXZraWh2Z2VnYWtodW1td3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NzUxMzEsImV4cCI6MjA5MzM1MTEzMX0.E9q9xvEPrH-EDjzdWB7_DeMCPQ-sVTEU0GxBytojU9E";

/** Production Flask API (DigitalOcean). */
export const PRODUCTION_BACKEND_URL = "https://api.kinmel.shop";

/** Production Next.js storefront. */
export const PRODUCTION_SITE_URL = "https://www.kinmel.shop";

/** Same-origin path for Next.js server proxy route. */
export const BACKEND_HTTP_PROXY_PREFIX = "/kinmel-backend";

const DEFAULT_DEV_FLASK_HTTP = "http://127.0.0.1:8080";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function trimSlash(s: string) {
  return s.replace(/\/+$/, "");
}

function httpsToWss(url: string): string {
  return trimSlash(url)
    .replace(/^https/i, "wss")
    .replace(/^http/i, "ws");
}

/** Resolved HTTP API base from env (with production fallback). */
export function resolveBackendHttpUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (fromEnv) return fromEnv;
  if (isProduction()) return PRODUCTION_BACKEND_URL;
  return "";
}

/** @deprecated Use resolveBackendHttpUrl() or getBackendHttpBase(). */
export const PUBLIC_BACKEND_URL = resolveBackendHttpUrl();

/**
 * Base URL for browser/server HTTP calls to Flask.
 * Honors NEXT_PUBLIC_BACKEND_URL; production default api.kinmel.shop.
 */
export function getBackendHttpBase(): string {
  const raw = resolveBackendHttpUrl();
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
    (isProduction() ? PRODUCTION_SITE_URL : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}` : "");
  if (site) {
    return `${site}${path}`;
  }
  return `http://127.0.0.1:3000${path}`;
}

/**
 * WebSocket base (Flask flask-sock). Browsers must hit the API host directly.
 * Honors NEXT_PUBLIC_BACKEND_WS_URL, else derives from backend HTTP URL.
 */
export function getBackendWsBase(): string {
  const wsEnv = process.env.NEXT_PUBLIC_BACKEND_WS_URL?.trim();
  if (wsEnv) {
    if (/^wss?:\/\//i.test(wsEnv)) {
      return trimSlash(wsEnv);
    }
    if (/^https?:\/\//i.test(wsEnv)) {
      return httpsToWss(wsEnv);
    }
  }

  const configured = resolveBackendHttpUrl();
  if (/^https?:\/\//i.test(configured)) {
    if (typeof window === "undefined") {
      return httpsToWss(configured);
    }
    try {
      if (new URL(configured).origin !== new URL(window.location.href).origin) {
        return httpsToWss(configured);
      }
    } catch {
      return httpsToWss(configured);
    }
  }

  const direct =
    process.env.NEXT_PUBLIC_FLASK_URL?.trim() ||
    (isProduction() ? PRODUCTION_BACKEND_URL : DEFAULT_DEV_FLASK_HTTP);
  return httpsToWss(direct);
}

/** Dev-only fallback when no saved RTMP URL exists for the business. */
export const DEV_INSTAGRAM_RTMP_URL =
  process.env.NEXT_PUBLIC_INSTAGRAM_RTMP_URL?.trim() ?? "";
