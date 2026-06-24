import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppProvider } from "@/components/AppProvider";
import { SITE_URL, rootMetadataOther } from "@/lib/siteMetadata";

import "./globals.css";

const siteDescription =
  "Shoppable Instagram live and recorded video — product overlays, comment buy codes, and web checkout for Nepal.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kinmel",
    template: "%s · Kinmel",
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Kinmel",
    title: "Kinmel",
    description: siteDescription,
    url: SITE_URL,
    images: [
      {
        url: "/kinmel-logo/512.png",
        width: 512,
        height: 512,
        alt: "Kinmel",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Kinmel",
    description: siteDescription,
    images: ["/kinmel-logo/512.png"],
  },
  other: rootMetadataOther(),
};

/**
 * suppressHydrationWarning: browser extensions (e.g. Grammarly) inject attributes into
 * <body> before React hydrates, which would otherwise warn about a server/client mismatch.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
