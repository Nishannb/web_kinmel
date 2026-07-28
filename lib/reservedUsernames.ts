/** Paths that must not be treated as Instagram usernames. */
export const RESERVED_STOREFRONT_USERNAMES = new Set([
  "api",
  "buy",
  "clearmydata",
  "dashboard",
  "events",
  "kinmel-backend",
  "live-selling",
  "login",
  "orders",
  "privacy-policy",
  "products",
  "register",
  "terms",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export function isReservedStorefrontUsername(username: string): boolean {
  const u = (username || "").trim().toLowerCase();
  return !u || RESERVED_STOREFRONT_USERNAMES.has(u);
}
