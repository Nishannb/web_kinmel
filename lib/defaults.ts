import { OverlaySettings } from "@/lib/appTypes";

export const defaultOverlaySettings = (): OverlaySettings => ({
  overlayText: "",
  textPosition: "bottom",
  productCardPosition: "top_corner",
  visibleProductIds: [],
});
