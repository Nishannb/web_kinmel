export type OverlayTextPosition = "top" | "bottom";

export type ProductCardPosition = "bottom" | "top_corner" | "both";

export type ProductVariant = {
  id: string;
  label: string;
  stockQuantity: number;
  sortOrder: number;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl?: string;
  productUrl?: string;
  discountedPrice?: number | null;
  buyCode?: string;
  /** Available units; null = unlimited (legacy). For sized products this is the sum of variants. */
  stockQuantity?: number | null;
  /** Empty / missing = unsized product. */
  variants?: ProductVariant[];
  /** When this product was added to a live session lineup (newest first in UI). */
  sessionAddedAt?: string;
  /** Catalog row `updated_at` for sorting products not yet in this show. */
  catalogUpdatedAt?: string;
};

export type OverlaySettings = {
  overlayText: string;
  textPosition: OverlayTextPosition;
  productCardPosition: ProductCardPosition;
  visibleProductIds: string[];
};

export type LiveEvent = {
  id: string;
  businessId: string;
  instagramAccountId: string;
  name: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  startedAt: string | null;
  createdAt: string;
  products: Product[];
  overlaySettings: OverlaySettings;
};

export type SessionUser = {
  email: string;
  id: string;
};

export type InstagramAccount = {
  id: string;
  username: string | null;
  instagramUserId: string;
};
