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
  siteName = "Kinmel",
  image = "/kinmel-logo/512.png",
  imageAlt,
}: {
  path: string;
  title: string;
  description: string;
  siteName?: string;
  image?: string;
  imageAlt?: string;
}): Metadata {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${SITE_URL}${normalizedPath}`;
  const alt = imageAlt ?? siteName;

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
      siteName,
      images: [
        {
          url: image,
          width: 512,
          height: 512,
          alt,
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [image],
    },
    facebook: {
      appId: FACEBOOK_APP_ID,
    },
  };
}
