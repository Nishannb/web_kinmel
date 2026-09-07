import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { KinmelBrandLink } from "@/components/KinmelLogo";

export type LegalBrand = {
  name: string;
  homeHref: string;
  privacyHref: string;
  termsHref: string;
  /** When set, shows this logo image instead of the Kinmel brand link. */
  logoSrc?: string;
  logoAlt?: string;
  showClearMyData?: boolean;
};

const KINMEL_BRAND: LegalBrand = {
  name: "Kinmel",
  homeHref: "/",
  privacyHref: "/privacy-policy",
  termsHref: "/terms",
  showClearMyData: true,
};

export function LegalPageShell({
  title,
  updated,
  children,
  brand = KINMEL_BRAND,
}: {
  title: string;
  updated: string;
  children: ReactNode;
  brand?: LegalBrand;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/80 via-white to-zinc-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          {brand.logoSrc ? (
            <Link
              href={brand.homeHref}
              className="inline-flex items-center rounded-xl outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-violet-400/30"
            >
              <Image
                src={brand.logoSrc}
                alt={brand.logoAlt ?? brand.name}
                width={180}
                height={180}
                className="h-16 w-16 rounded-xl object-cover shadow-sm ring-1 ring-zinc-200 sm:h-[4.5rem] sm:w-[4.5rem]"
                priority
              />
            </Link>
          ) : (
            <KinmelBrandLink size="sm" />
          )}
          <Link
            href={brand.homeHref}
            className="text-sm font-medium text-violet-700 underline-offset-4 hover:underline"
          >
            ← Home
          </Link>
        </div>

        <article className="mt-8 rounded-2xl border border-violet-100/80 bg-white p-6 shadow-sm sm:p-8">
          <header className="border-b border-zinc-100 pb-6">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-zinc-500">Last updated: {updated}</p>
            <div className="mt-3 space-y-1 text-sm text-zinc-600">
              <p>
                <strong>{brand.name}</strong> is operated by{" "}
                <a
                  href="https://namantechnologies.biz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-violet-700 hover:text-violet-900 hover:underline"
                >
                  Naman Technologies Private Limited
                </a>
                , registered in Nepal.
              </p>
              <p>
                Address: Pokhara Metropolitan City Ward No. 17, Balodaya Marg, Kaski, Gandaki,
                Nepal.
              </p>
              <p>Phone: +977 9714535269, +977 9769498715.</p>
            </div>
          </header>

          <div className="legal-prose mt-6 space-y-6 text-sm leading-relaxed text-zinc-700 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-zinc-900 [&_li]:ml-4 [&_li]:list-disc [&_ul]:space-y-1.5">
            {children}
          </div>
        </article>

        <footer className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-zinc-500">
          <Link href={brand.privacyHref} className="hover:text-violet-700 hover:underline">
            Privacy Policy
          </Link>
          <Link href={brand.termsHref} className="hover:text-violet-700 hover:underline">
            Terms of Service
          </Link>
          {brand.showClearMyData ? (
            <Link href="/clearmydata" className="hover:text-violet-700 hover:underline">
              Clear my data
            </Link>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
