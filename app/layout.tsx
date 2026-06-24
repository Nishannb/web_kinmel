import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppProvider } from "@/components/AppProvider";

import "./globals.css";

const siteDescription =
  "Shoppable Instagram live and recorded video — product overlays, comment buy codes, and web checkout for Nepal.";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kinmel.shop";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kinmel",
    template: "%s · Kinmel",
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Kinmel",
    title: "Kinmel",
    description: siteDescription,
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
  other: {
    "facebook-domain-verification": "28jcv1v97tuet1o29sj0jzplvuah84",
  },
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
