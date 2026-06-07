import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppProvider } from "@/components/AppProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kinmel",
    template: "%s · Kinmel",
  },
  description:
    "Shoppable Instagram live and recorded video — product overlays, comment buy codes, and web checkout for Nepal.",
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
