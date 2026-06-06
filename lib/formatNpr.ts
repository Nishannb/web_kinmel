/**
 * Storefront money formatting: NPR-like currencies use the रु prefix; other ISO codes use Intl.
 * Wallet eligibility uses isNepalRupeesCurrency (see buy checkout).
 */

const DEVANAGARI_RU_SHORT = "\u0930\u0941"; // रु
const DEVANAGARI_RU_LONG = "\u0930\u0942"; // रू

/**
 * True when eSewa / Khalti (NPR wallets) should be offered for this product row.
 * Treats missing/blank currency as NPR (matches products table default).
 * Accepts ISO NPR, informal NRS, and रु / रू if stored in the currency column.
 */
export function isNepalRupeesCurrency(raw: string | null | undefined): boolean {
  const s = String(raw ?? "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
  if (!s) return true;
  const upper = s.toUpperCase();
  if (upper === "NPR" || upper === "NRS") return true;
  const compact = s.replace(/\s+/g, "");
  return compact === DEVANAGARI_RU_SHORT || compact === DEVANAGARI_RU_LONG;
}

/**
 * Format a money amount using the product/order currency from the database.
 * NPR-like codes use the storefront रु prefix; other ISO codes use Intl currency style.
 */
export function formatStorefrontPrice(amount: number, currency?: string | null): string {
  const n = Number(amount);
  const value = Number.isFinite(n) ? n : 0;
  if (isNepalRupeesCurrency(currency)) {
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return `रु ${formatted}`;
  }
  const code = String(currency ?? "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .toUpperCase();
  if (!code) {
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return `रु ${formatted}`;
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
}

/** NPR display helper; same as formatStorefrontPrice(amount, "NPR"). */
export function formatNprRupees(amount: number): string {
  return formatStorefrontPrice(amount, "NPR");
}
