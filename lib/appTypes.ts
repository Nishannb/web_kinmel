export type OverlayTextPosition = "top" | "bottom";

export type ProductCardPosition = "bottom" | "top_corner" | "both";

export type Product = {
  id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl?: string;
  productUrl?: string;
  discountedPrice?: number | null;
  buyCode?: string;
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
