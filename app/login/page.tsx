"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/AppProvider";

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
      router.replace("/live-selling");
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
      router.push("/live-selling");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-lg rounded-xl border border-zinc-200 bg-white p-8">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Sign in with the same phone number and password you use on mobile.
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Phone Number</span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+1 555 0100"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
            required
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
            required
          />
        </label>
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          {isSubmitting ? "Signing in..." : "Continue"}
        </button>
      </form>
    </section>
  );
}
