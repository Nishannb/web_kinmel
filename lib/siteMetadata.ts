import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kinmel.shop").replace(
  /\/+$/,
  ""
);

/** Public Meta / Facebook app ID (App Dashboard → Settings → Basic). Same as INSTAGRAM_APP_ID on the server. */
export const FACEBOOK_APP_ID = (
  process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ??
  process.env.NEXT_PUBLIC_META_APP_ID ??
  "695678696913661"
).trim();

export function buildPageMetadata({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${SITE_URL}${normalizedPath}`;

  return {
    title,
    description,
    alternates: {
      canonical: normalizedPath,
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Kinmel",
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
      title,
      description,
      images: ["/kinmel-logo/512.png"],
    },
    facebook: {
      appId: FACEBOOK_APP_ID,
    },
  };
}
