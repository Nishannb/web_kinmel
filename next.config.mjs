import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname);
// Local monorepo layout only (RN app + web_kinmel). Not present on Vercel/GitHub deploys.
const repoRoot = path.resolve(webRoot, "..");
const isVercel = process.env.VERCEL === "1";

/**
 * HTTP proxy for `/kinmel-backend/*` is implemented in
 * `app/kinmel-backend/[[...path]]/route.ts` (reliable in dev + production).
 * Set KINMEL_BACKEND_PROXY_TARGET to your Flask URL (default http://127.0.0.1:8080).
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isVercel ? {} : { outputFileTracingRoot: repoRoot }),
  turbopack: {
    ...(isVercel ? {} : { root: repoRoot }),
    resolveAlias: {
      tailwindcss: path.join(webRoot, "node_modules/tailwindcss"),
    },
  },
};

export default nextConfig;
