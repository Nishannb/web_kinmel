"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/AppProvider";
import { normalizePhone, phoneToEmail } from "@/lib/kinmelAuth";
import { requestNepalOtp, verifyNepalOtp } from "@/lib/otpClient";
import {
  DEFAULT_PHONE_COUNTRY_ISO,
  PHONE_COUNTRIES,
  composeE164,
  isNepalCountryIso,
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

/** Self-serve registration aligned with the mobile app (shop, country, OTP, password). */
export function RegisterFormLegacy() {
  const router = useRouter();
  const { register, user, isReady } = useAppState();
  const [shopName, setShopName] = useState("");
  const [phoneCountryIso, setPhoneCountryIso] = useState(DEFAULT_PHONE_COUNTRY_ISO);
  const [nationalPhone, setNationalPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCountry = useMemo(
    () => phoneCountryByIso(phoneCountryIso),
    [phoneCountryIso]
  );
  const nepalRegister = isNepalCountryIso(phoneCountryIso);
  const phoneE164 = composeE164(phoneCountryIso, nationalPhone);

  useEffect(() => {
    if (isReady && user) {
      router.replace(safeNextPath());
    }
  }, [isReady, router, user]);

  useEffect(() => {
    if (otpCooldownSeconds <= 0) return;
    const timer = window.setTimeout(() => {
      setOtpCooldownSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [otpCooldownSeconds]);

  useEffect(() => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode("");
    setOtpError(null);
    setOtpCooldownSeconds(0);
  }, [phoneCountryIso, nationalPhone]);

  const onRequestOtp = async () => {
    const digits = nationalDigits(nationalPhone);
    if (digits.length < 8) {
      setOtpError("Enter a valid phone number first.");
      return;
    }
    setOtpBusy(true);
    setOtpError(null);
    setError(null);
    try {
      const { retryAfterSeconds } = await requestNepalOtp(
        normalizePhone(phoneE164)
      );
      setOtpSent(true);
      setOtpCooldownSeconds(retryAfterSeconds);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : String(err));
    } finally {
      setOtpBusy(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanedShop = shopName.trim();
    const digits = nationalDigits(nationalPhone);
    if (!cleanedShop) {
      setError("Please enter a shop name.");
      return;
    }
    if (digits.length < 8) {
      setError("Please enter your phone number.");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    const normalizedPhone = normalizePhone(phoneE164);

    if (nepalRegister && !otpVerified) {
      if (!otpSent) {
        await onRequestOtp();
        return;
      }
      if (otpCode.trim().length !== 6) {
        setError("Enter the 6-digit code we sent you.");
        return;
      }
      setOtpBusy(true);
      setOtpError(null);
      setError(null);
      try {
        await verifyNepalOtp(normalizedPhone, otpCode.trim());
        setOtpVerified(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setOtpError(message);
        setError(message);
        return;
      } finally {
        setOtpBusy(false);
      }
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await register({
        email: phoneToEmail(normalizedPhone),
        password,
        shopName: cleanedShop,
        phoneE164: normalizedPhone,
        phoneCountryIso,
        claimNepalOtpAfterSignup: nepalRegister,
      });
      router.push(safeNextPath());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLabel = (() => {
    if (isSubmitting) return "Creating account…";
    if (otpBusy) return "Please wait…";
    if (nepalRegister && !otpVerified) {
      return otpSent ? "Verify & register" : "Send code";
    }
    return "Register";
  })();

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-fuchsia-100 bg-white/90 p-8 shadow-xl shadow-fuchsia-100/40">
      <h1 className="text-2xl font-bold text-zinc-900">Create your account</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        Same signup as the Kinmel mobile app. After registering, open the workspace or
        download the app to go live.
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-zinc-800">Shop name</span>
          <input
            type="text"
            value={shopName}
            onChange={(event) => setShopName(event.target.value)}
            placeholder="Your shop or brand"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 outline-none ring-violet-200 transition focus:border-violet-400 focus:ring-2"
            required
            autoComplete="organization"
          />
        </label>

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
              maxLength={selectedCountry.nationalLength + 2}
              className="w-full bg-transparent px-3 py-2.5 outline-none"
              required
              autoComplete="tel-national"
            />
          </div>
        </label>

        {nepalRegister ? (
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="block flex-1 space-y-1">
                <span className="text-sm font-medium text-zinc-800">
                  SMS verification code
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(event) =>
                    setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder={otpSent ? "6-digit code" : "Send code first"}
                  disabled={!otpSent || otpVerified}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 outline-none ring-violet-200 transition focus:border-violet-400 focus:ring-2 disabled:opacity-60"
                  autoComplete="one-time-code"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  onRequestOtp().catch(() => {});
                }}
                disabled={
                  otpBusy ||
                  otpVerified ||
                  otpCooldownSeconds > 0 ||
                  nationalDigits(nationalPhone).length < 8
                }
                className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-800 transition hover:bg-violet-100 disabled:opacity-60"
              >
                {otpBusy
                  ? "Sending…"
                  : otpVerified
                    ? "Verified"
                    : otpCooldownSeconds > 0
                      ? `Resend in ${otpCooldownSeconds}s`
                      : otpSent
                        ? "Resend code"
                        : "Send code"}
              </button>
            </div>
            {otpVerified ? (
              <p className="text-sm font-medium text-emerald-700">
                Phone verified
              </p>
            ) : null}
            {otpError ? (
              <p className="text-sm text-red-700">{otpError}</p>
            ) : nepalRegister && !otpVerified ? (
              <p className="text-xs text-zinc-500">
                Nepal numbers need an SMS code before you can create an account.
              </p>
            ) : null}
          </div>
        ) : null}

        <label className="block space-y-1">
          <span className="text-sm font-medium text-zinc-800">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 outline-none ring-violet-200 transition focus:border-violet-400 focus:ring-2"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting || otpBusy}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
        >
          {submitLabel}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-violet-700 underline">
          Log in
        </Link>
      </p>
    </section>
  );
}
