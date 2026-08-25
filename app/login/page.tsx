"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KinmelBrandLink } from "@/components/KinmelLogo";
import { useAppState } from "@/components/AppProvider";
import { normalizePhone, phoneToEmail } from "@/lib/kinmelAuth";
import {
  DEFAULT_PHONE_COUNTRY_ISO,
  PHONE_COUNTRIES,
  composeE164,
  nationalDigits,
  phoneCountryByIso,
} from "@/lib/phoneCountries";

function safeNextPath(): string {
  if (typeof window === "undefined") return "/live-selling";
  const raw = new URLSearchParams(window.location.search).get("next");
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/live-selling";
}

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isReady } = useAppState();
  const [phoneCountryIso, setPhoneCountryIso] = useState(DEFAULT_PHONE_COUNTRY_ISO);
  const [nationalPhone, setNationalPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCountry = useMemo(
    () => phoneCountryByIso(phoneCountryIso),
    [phoneCountryIso]
  );

  useEffect(() => {
    if (isReady && user) {
      router.replace(safeNextPath());
    }
  }, [isReady, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const digits = nationalDigits(nationalPhone);
    if (digits.length < 8 || !password.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const phoneE164 = normalizePhone(composeE164(phoneCountryIso, nationalPhone));
      await login(phoneToEmail(phoneE164), password);
      router.push(safeNextPath());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="flex flex-col items-center gap-4">
          <KinmelBrandLink size="lg" />
          <Link
            href="/"
            className="inline-block text-sm font-semibold text-violet-700 underline-offset-4 hover:underline"
          >
            ← Back to home
          </Link>
        </div>
        <section className="mt-6 overflow-hidden rounded-3xl border border-sky-100 bg-white/90 p-8 shadow-xl shadow-sky-100/50">
          <h1 className="text-2xl font-bold text-zinc-900">Log in</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Sign in with the same phone number and password you use on the Kinmel mobile
            app.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-zinc-800">Country</span>
              <select
                value={phoneCountryIso}
                onChange={(event) => setPhoneCountryIso(event.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 outline-none ring-violet-200 transition focus:border-violet-400 focus:ring-2"
              >
                {PHONE_COUNTRIES.map((country) => (
                  <option key={country.iso} value={country.iso}>
                    {country.name} (+{country.dial})
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-zinc-800">Phone number</span>
              <div className="flex overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/80 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-200">
                <span className="flex items-center border-r border-zinc-200 px-3 text-sm font-semibold text-zinc-700">
                  +{selectedCountry.dial}
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={nationalPhone}
                  onChange={(event) =>
                    setNationalPhone(nationalDigits(event.target.value))
                  }
                  placeholder={
                    selectedCountry.iso === "NP" ? "98XXXXXXXX" : "Phone number"
                  }
                  className="w-full bg-transparent px-3 py-2.5 outline-none"
                  required
                  autoComplete="tel-national"
                />
              </div>
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-zinc-800">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 outline-none ring-violet-200 transition focus:border-violet-400 focus:ring-2"
                required
                autoComplete="current-password"
              />
            </label>
            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-violet-700 disabled:opacity-60"
            >
              {isSubmitting ? "Signing in…" : "Continue"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-600">
            New to Kinmel?{" "}
            <Link href="/register" className="font-semibold text-violet-700 underline">
              Register
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
