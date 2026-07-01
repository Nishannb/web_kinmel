"use client";

import { FormEvent, useState } from "react";
import { buildKinmelAccessWhatsAppUrl } from "@/lib/siteConfig";

type RequestKinmelAccessCardProps = {
  className?: string;
};

function readBusinessName(form: HTMLFormElement): string {
  const formData = new FormData(form);
  return String(formData.get("businessName") ?? "").trim();
}

export function RequestKinmelAccessCard({ className = "" }: RequestKinmelAccessCardProps) {
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const openWhatsApp = (form: HTMLFormElement) => {
    const trimmed = readBusinessName(form);
    if (!trimmed) {
      setError("Please enter your business name.");
      return;
    }
    setError(null);
    const url = buildKinmelAccessWhatsAppUrl(trimmed);
    window.location.assign(url);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    openWhatsApp(event.currentTarget);
  };

  return (
    <section
      className={`overflow-hidden rounded-3xl border border-fuchsia-100 bg-white/90 p-8 shadow-xl shadow-fuchsia-100/40 ${className}`}
    >
      <h1 className="text-2xl font-bold text-zinc-900">Request Kinmel access</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        Kinmel is available by invitation while we onboard sellers. Enter your business name below,
        then tap the button to open WhatsApp with a pre-filled access request.
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-zinc-800">Business name</span>
          <input
            type="text"
            name="businessName"
            value={businessName}
            onChange={(event) => {
              setBusinessName(event.target.value);
              if (error) setError(null);
            }}
            placeholder="Your shop or brand name"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 outline-none ring-violet-200 transition focus:border-violet-400 focus:ring-2"
            required
            autoComplete="organization"
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
