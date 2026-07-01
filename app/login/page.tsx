"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KinmelBrandLink } from "@/components/KinmelLogo";
import { useAppState } from "@/components/AppProvider";
import { PUBLIC_REGISTRATION_ENABLED } from "@/lib/siteConfig";

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
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phoneToEmail = (value: string) => {
    const normalized = value.replace(/[^\d+]/g, "").trim().replace("+", "");
    return `u_${normalized}@kinmel.app`;
  };

  useEffect(() => {
    if (isReady && user) {
      router.replace(safeNextPath());
    }
  }, [isReady, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanedPhone = phone.replace(/[^\d+]/g, "").trim();
    if (!cleanedPhone || !password.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await login(phoneToEmail(cleanedPhone), password);
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
            Sign in with the same phone number and password you use on the Kinmel mobile app.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-zinc-800">Phone number</span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+977 98XXXXXXXX"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 outline-none ring-violet-200 transition focus:border-violet-400 focus:ring-2"
                required
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-zinc-800">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 outline-none ring-violet-200 transition focus:border-violet-400 focus:ring-2"
                required
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
              {PUBLIC_REGISTRATION_ENABLED ? "Register" : "Request Kinmel Access"}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
