"use client";

import { useCallback, useMemo, useState } from "react";
import { sellerShopUrl } from "@/lib/sellerShop";

function IconLink() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function LiveShopLinkCopy({ username }: { username: string | null | undefined }) {
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => {
    const u = (username || "").trim();
    return u ? sellerShopUrl(u) : "";
  }, [username]);

  const onCopy = useCallback(async () => {
    if (!url || typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [url]);

  if (!url) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Connect an Instagram account to get your live shop link for IG&apos;s external link.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
            Instagram external link
          </p>
          <p className="mt-0.5 truncate text-sm font-medium text-zinc-800" title={url}>
            {url}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            Paste in your live as the external link. Viewers land on what you&apos;re showing now;
            each tap snapshots that product.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onCopy()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          <IconLink />
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
