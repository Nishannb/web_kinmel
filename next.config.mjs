import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * HTTP proxy for `/kinmel-backend/*` is implemented in
 * `app/kinmel-backend/[[...path]]/route.ts` (reliable in dev + production).
 * Set KINMEL_BACKEND_PROXY_TARGET to your Flask URL (default http://127.0.0.1:8080).
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
