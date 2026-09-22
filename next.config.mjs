import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname);
// Only when web_kinmel sits next to the RN app locally — not on GitHub/Vercel checkouts.
const repoRoot = path.resolve(webRoot, "..");
const isLocalMonorepo = existsSync(path.join(repoRoot, "App.tsx"));

/**
 * HTTP proxy for `/kinmel-backend/*` is implemented in
 * `app/kinmel-backend/[[...path]]/route.ts` (reliable in dev + production).
 * Set KINMEL_BACKEND_PROXY_TARGET to your Flask URL (default http://127.0.0.1:8080).
 *
 * TikTok Login Kit portal redirect (`/auth/tiktok/callback` on kinmel.shop) is
 * proxied to the API by `app/auth/tiktok/callback/route.ts` so we can keep the
 * approved portal URI without changing PUBLIC_BASE_URL (Instagram/Facebook).
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isLocalMonorepo ? { outputFileTracingRoot: repoRoot } : {}),
  turbopack: {
    ...(isLocalMonorepo ? { root: repoRoot } : {}),
    resolveAlias: {
      tailwindcss: path.join(webRoot, "node_modules/tailwindcss"),
    },
  },
  async redirects() {
    return [
      {
        source: "/pingdm",
        destination: "/finalpost/privacy",
        permanent: true,
      },
      {
        source: "/pingdm/privacy",
        destination: "/finalpost/privacy",
        permanent: true,
      },
      {
        source: "/pingdm/terms",
        destination: "/finalpost/terms",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/apk/:path*",
        headers: [
          {
            key: "Content-Type",
            value: "application/vnd.android.package-archive",
          },
          {
            key: "Content-Disposition",
            value: 'attachment; filename="kinmel.apk"',
          },
        ],
      },
    ];
  },
  /**
   * Backup rewrite (Vercel). Prefer the App Router handler above; this covers
   * edge cases if the route is not deployed yet. Query strings are preserved.
   */
  async rewrites() {
    const tiktokUpstream =
      process.env.TIKTOK_OAUTH_CALLBACK_PROXY_TARGET?.replace(/\/+$/, "") ||
      "https://api.kinmel.shop/auth/tiktok/callback";
    return [
      {
        source: "/auth/tiktok/callback",
        destination: tiktokUpstream,
      },
    ];
  },
};

export default nextConfig;
