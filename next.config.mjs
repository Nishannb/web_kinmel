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
};

export default nextConfig;
