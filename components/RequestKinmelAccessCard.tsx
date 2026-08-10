"use client";

import { FormEvent, useState } from "react";
import { buildKinmelAccessWhatsAppUrl } from "@/lib/siteConfig";

type RequestKinmelAccessCardProps = {
  className?: string;
};

function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  // Practical check — enough to catch typos, not a full RFC validator.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function RequestKinmelAccessCard({ className = "" }: RequestKinmelAccessCardProps) {
  const [shopName, setShopName] = useState("");
  const [facebookEmail, setFacebookEmail] = useState("");
  const [instagramEmail, setInstagramEmail] = useState("");
  const [sameAsFacebook, setSameAsFacebook] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveInstagramEmail = sameAsFacebook ? facebookEmail : instagramEmail;

  const clearError = () => {
    if (error) setError(null);
  };

  const openWhatsApp = () => {
    const shop = shopName.trim();
    const fb = facebookEmail.trim();
    const ig = effectiveInstagramEmail.trim();

    if (!shop) {
      setError("Please enter your shop name.");
      return;
    }
    if (!isValidEmail(fb)) {
      setError("Please enter a valid Facebook email.");
      return;
    }
    if (!isValidEmail(ig)) {
      setError(
        sameAsFacebook
          ? "Please enter a valid Facebook email (used for Instagram too)."
          : "Please enter a valid Instagram email.",
      );
      return;
    }

    setError(null);
    const url = buildKinmelAccessWhatsAppUrl({
      shopName: shop,
      facebookEmail: fb,
      instagramEmail: ig,
    });
    window.location.assign(url);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    openWhatsApp();
  };

  return (
    <section
      className={`overflow-hidden rounded-3xl border border-fuchsia-100 bg-white/90 p-8 shadow-xl shadow-fuchsia-100/40 ${className}`}
    >
      <h1 className="text-2xl font-bold text-zinc-900">Request Kinmel access</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        Kinmel is invite-only while we onboard sellers. Share your shop name and the emails on your
        Facebook and Instagram accounts — we use these to add you as a Meta tester and unlock access.
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-zinc-800">Shop name</span>
          <input
            type="text"
            name="shopName"
            value={shopName}
            onChange={(event) => {
              setShopName(event.target.value);
              clearError();
            }}
            placeholder="Your shop or brand name"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 outline-none ring-violet-200 transition focus:border-violet-400 focus:ring-2"
            required
            autoComplete="organization"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-zinc-800">Facebook email</span>
          <input
            type="email"
            name="facebookEmail"
            value={facebookEmail}
            onChange={(event) => {
              setFacebookEmail(event.target.value);
              clearError();
            }}
            placeholder="email used for your Facebook account"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 outline-none ring-violet-200 transition focus:border-violet-400 focus:ring-2"
            required
            autoComplete="email"
            inputMode="email"
          />
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-3">
          <input
            type="checkbox"
            name="sameAsFacebook"
            checked={sameAsFacebook}
            onChange={(event) => {
              const checked = event.target.checked;
              setSameAsFacebook(checked);
              if (checked) {
                setInstagramEmail(facebookEmail);
              }
              clearError();
            }}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
          />
          <span className="text-sm leading-snug text-zinc-700">
            Instagram uses the same email as Facebook
          </span>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-zinc-800">Instagram email</span>
          <input
            type="email"
            name="instagramEmail"
            value={effectiveInstagramEmail}
            onChange={(event) => {
              if (sameAsFacebook) return;
              setInstagramEmail(event.target.value);
              clearError();
            }}
            placeholder={
              sameAsFacebook
                ? "Same as Facebook email"
                : "email used for your Instagram account"
            }
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 outline-none ring-violet-200 transition focus:border-violet-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
            required
            disabled={sameAsFacebook}
            autoComplete="email"
            inputMode="email"
          />
        </label>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
        >
          Request Kinmel Access
        </button>
      </form>
      <p className="mt-4 text-center text-xs leading-relaxed text-zinc-500">
        You&apos;ll message us on WhatsApp at +977 9769498715. We&apos;ll reply when your account is
        ready.
      </p>
    </section>
  );
}
