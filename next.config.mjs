import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname);
// Monorepo root (RN app + web_kinmel each have a lockfile). Next requires this to match `turbopack.root`.
const repoRoot = path.resolve(webRoot, "..");

/**
 * HTTP proxy for `/kinmel-backend/*` is implemented in
 * `app/kinmel-backend/[[...path]]/route.ts` (reliable in dev + production).
 * Set KINMEL_BACKEND_PROXY_TARGET to your Flask URL (default http://127.0.0.1:8080).
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
    resolveAlias: {
      tailwindcss: path.join(webRoot, "node_modules/tailwindcss"),
    },
  },
};

export default nextConfig;
