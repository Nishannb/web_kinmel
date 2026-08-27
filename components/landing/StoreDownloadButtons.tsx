import Link from "next/link";

import {
  KINMEL_ANDROID_APK_FILENAME,
  KINMEL_ANDROID_APK_URL,
  KINMEL_APP_STORE_URL,
} from "@/lib/siteConfig";

type StoreDownloadButtonsProps = {
  className?: string;
  tone?: "light" | "dark";
};

function AppleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.42 2.2-1.18 3.02-.8.88-2.1 1.56-3.22 1.47-.14-1.1.4-2.26 1.16-3.08.8-.9 2.2-1.56 3.24-1.41zM20.5 17.3c-.54 1.24-.8 1.8-1.5 2.9-.97 1.5-2.34 3.37-4.04 3.39-1.5.02-1.9-.98-3.94-.97-2.04.01-2.48 1-3.98.98-1.7-.02-3-1.7-3.97-3.2-2.72-4.2-3-9.1-1.33-11.7 1.18-1.84 3.04-2.92 4.78-2.92 1.78 0 2.9 1 4.38 1 1.42 0 2.28-1.01 4.34-1.01 1.55 0 3.19.84 4.36 2.3-3.83 2.1-3.21 7.56.9 9.23z" />
    </svg>
  );
}

function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path fill="#EA4335" d="M3.6 2.3c-.4.2-.6.6-.6 1v17.4c0 .4.2.8.6 1l9.7-9.7L3.6 2.3z" />
      <path fill="#FBBC04" d="M16.4 11.3l-2.4-2.4-10.4 6 12.8-3.6z" />
      <path fill="#4285F4" d="M16.4 12.7L3.6 21.7l10.4-6 2.4-3z" />
      <path fill="#34A853" d="M20.2 10.6c-.5-.3-8.6-4.9-8.6-4.9l-2.4 2.4 8.6 4.9 2.4-2.4z" />
      <path fill="#188038" d="M9.2 15.7l2.4 2.4 8.6-4.9-2.4-2.4-8.6 4.9z" />
    </svg>
  );
}

export function StoreDownloadButtons({
  className = "",
  tone = "light",
}: StoreDownloadButtonsProps) {
  const shell =
    tone === "light"
      ? "border-black/15 bg-black text-white hover:bg-black/90"
      : "border-white/20 bg-white text-black hover:bg-[#f7f1ea]";

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a
          href={KINMEL_APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex min-w-[11.5rem] items-center gap-3 rounded-2xl border px-4 py-3 transition ${shell}`}
        >
          <AppleIcon className="h-7 w-7 shrink-0" />
          <span className="text-left leading-tight">
            <span className="block text-[10px] uppercase tracking-wide opacity-80">
              Download on the
            </span>
            <span className="block text-sm font-semibold">App Store</span>
          </span>
        </a>

        <a
          href={KINMEL_ANDROID_APK_URL}
          download={KINMEL_ANDROID_APK_FILENAME}
          className={`inline-flex min-w-[13.5rem] items-center gap-3 rounded-2xl border px-4 py-3 transition ${shell}`}
        >
          <PlayIcon className="h-7 w-7 shrink-0" />
          <span className="text-left leading-tight">
            <span className="block text-[10px] uppercase tracking-wide opacity-80">
              Google Play
            </span>
            <span className="block text-sm font-semibold">Download Kinmel APK</span>
          </span>
        </a>
      </div>

      <Link
        href="/register"
        className={
          tone === "light"
            ? "inline-flex w-full items-center justify-center rounded-2xl border border-black/20 bg-transparent px-4 py-3 text-sm font-semibold text-black transition hover:bg-black/5 sm:w-auto sm:min-w-[11.5rem]"
            : "inline-flex w-full items-center justify-center rounded-2xl border border-white/25 bg-transparent px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto sm:min-w-[11.5rem]"
        }
      >
        Register
      </Link>
      <p
        className={
          tone === "light"
            ? "max-w-md text-sm leading-relaxed text-zinc-600"
            : "max-w-md text-sm leading-relaxed text-zinc-300"
        }
      >
        Create a free seller account, then download the app to go live.
      </p>
    </div>
  );
}
