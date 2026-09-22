/** Paths that must not be treated as Instagram usernames. */
export const RESERVED_STOREFRONT_USERNAMES = new Set([
  "api",
  "auth",
  "buy",
  "clearmydata",
  "dashboard",
  "events",
  "finalpost",
  "kinmel-backend",
  "live-selling",
  "login",
  "orders",
  "pingdm",
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
