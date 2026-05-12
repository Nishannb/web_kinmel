"use client";

import Link from "next/link";

export default function BuyPage() {
  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10 text-zinc-900">
      <section className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">Invalid buy link</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Please open the full product link shared by the seller. It should look like
          <span className="font-medium"> /buy/&lt;product-id&gt;</span>.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
        >
          Go to Kinmel
        </Link>
      </section>
    </main>
  );
}

