/** Persist buyer checkout fields so Instagram / in-app browsers can refill them. */

export type CheckoutBuyerDetails = {
  customerName: string;
  phone: string;
  address: string;
  /** @deprecated Kept for older stored payloads; no longer collected in checkout. */
  city?: string;
};

const STORAGE_KEY = "kinmel_checkout_buyer_details_v1";

export function loadCheckoutBuyerDetails(): CheckoutBuyerDetails | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CheckoutBuyerDetails>;
    return {
      customerName: String(parsed.customerName ?? "").trim(),
      phone: String(parsed.phone ?? "").trim(),
      address: String(parsed.address ?? "").trim(),
    };
  } catch {
    return null;
  }
}

export function saveCheckoutBuyerDetails(details: CheckoutBuyerDetails): void {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      customerName: details.customerName.trim(),
      phone: details.phone.trim(),
      address: details.address.trim(),
    };
    if (!payload.customerName && !payload.phone && !payload.address) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}
