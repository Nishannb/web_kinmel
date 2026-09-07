import type { Metadata } from "next";
import { LegalPageShell, type LegalBrand } from "@/components/legal/LegalPageShell";
import { buildPageMetadata } from "@/lib/siteMetadata";

export const PINGDM_BRAND: LegalBrand = {
  name: "PingDM",
  homeHref: "/pingdm/privacy",
  privacyHref: "/pingdm/privacy",
  termsHref: "/pingdm/terms",
  logoSrc: "/pingdm/logo.png",
  logoAlt: "PingDM",
  showClearMyData: false,
};

export const pingdmPageMetadata = (path: string, title: string, description: string): Metadata =>
  buildPageMetadata({
    path,
    title,
    description,
    siteName: "PingDM",
    image: "/pingdm/logo.png",
    imageAlt: "PingDM",
  });
