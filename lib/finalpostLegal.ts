import type { Metadata } from "next";
import { type LegalBrand } from "@/components/legal/LegalPageShell";
import { buildPageMetadata } from "@/lib/siteMetadata";

export const FINALPOST_BRAND: LegalBrand = {
  name: "FinalPost",
  homeHref: "/finalpost/privacy",
  privacyHref: "/finalpost/privacy",
  termsHref: "/finalpost/terms",
  logoSrc: "/finalpost/logo.png",
  logoAlt: "FinalPost",
  showClearMyData: false,
};

export const finalpostPageMetadata = (path: string, title: string, description: string): Metadata => ({
  ...buildPageMetadata({
    path,
    title,
    description,
    siteName: "FinalPost",
    image: "/finalpost/logo.png",
    imageAlt: "FinalPost",
  }),
  title: {
    absolute: `${title} · FinalPost`,
  },
});
