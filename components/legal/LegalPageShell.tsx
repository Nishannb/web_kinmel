import Link from "next/link";
import type { ReactNode } from "react";
import { KinmelBrandLink } from "@/components/KinmelLogo";

export function LegalPageShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/80 via-white to-zinc-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <KinmelBrandLink size="sm" />
          <Link
            href="/"
            className="text-sm font-medium text-violet-700 underline-offset-4 hover:underline"
          >
            ← Home
          </Link>
        </div>

        <article className="mt-8 rounded-2xl border border-violet-100/80 bg-white p-6 shadow-sm sm:p-8">
          <header className="border-b border-zinc-100 pb-6">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-zinc-500">Last updated: {updated}</p>
            <p className="mt-3 text-sm text-zinc-600">
              Kinmel is operated by <strong>Naman Technologies Private Limited</strong>, Pokhara,
              Nepal.
            </p>
          </header>

          <div className="legal-prose mt-6 space-y-6 text-sm leading-relaxed text-zinc-700 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-zinc-900 [&_li]:ml-4 [&_li]:list-disc [&_ul]:space-y-1.5">
            {children}
          </div>
        </article>

        <footer className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-zinc-500">
          <Link href="/privacy-policy" className="hover:text-violet-700 hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-violet-700 hover:underline">
            Terms of Service
          </Link>
          <Link href="/clearmydata" className="hover:text-violet-700 hover:underline">
            Clear my data
          </Link>
        </footer>
      </div>
    </div>
  );
}
