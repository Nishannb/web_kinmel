"use client";

import Link from "next/link";
import { KinmelBrandLink } from "@/components/KinmelLogo";
import { useAppState } from "@/components/AppProvider";

const steps = [
  {
    title: "Sign in on the web",
    body: "Build your catalog with images, prices, and buy codes. Plan live events or prep shoppable videos — everything ties back to the same products.",
    tint: "from-sky-50 to-cyan-50 border-sky-100",
    dot: "bg-sky-400",
  },
  {
    title: "Create on the Kinmel app",
    body: "Go live to Instagram RTMP, or record posts and Reels with product overlays burned into the video. The app is where overlays meet your camera roll.",
    tint: "from-violet-50 to-fuchsia-50 border-violet-100",
    dot: "bg-violet-500",
  },
  {
    title: "Fans comment to buy",
    body: "Each on-screen product is linked to a buy code (e.g. MOCHI). Viewers comment that code on Instagram; Kinmel routes them to your web checkout.",
    tint: "from-amber-50 to-orange-50 border-amber-100",
    dot: "bg-amber-400",
  },
];

export default function HomePage() {
  const { user, isReady } = useAppState();

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100/80 via-white to-cyan-50/90">
      <header className="border-b border-white/60 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <KinmelBrandLink size="md" />
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="#contact"
              className="rounded-full px-4 py-2 text-sm font-semibold text-violet-900 transition hover:bg-violet-100/80"
            >
              Contact
            </a>
            {isReady && user ? (
              <Link
                href="/live-selling"
                className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700"
              >
                Workspace
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-violet-900 transition hover:bg-violet-100/80"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:py-16">
        <section className="overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-violet-50/50 to-fuchsia-50/40 p-8 shadow-xl shadow-violet-100/50 sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">
            Live commerce for Nepal
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-5xl">
            Shoppable Instagram video — live or recorded.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-600">
            Put product overlays <strong className="text-violet-800">right on the video</strong>, tied to
            buy codes your audience comments on Instagram. Run the show from the{" "}
            <strong className="text-violet-800">Kinmel iOS app</strong>, manage catalog & orders here on
            the web, and send buyers to a secure checkout link.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {isReady && user ? (
              <Link
                href="/live-selling"
                className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-violet-300/50 transition hover:bg-violet-700"
              >
                Open workspace
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-95"
                >
                  Create account
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl border-2 border-violet-200 bg-white px-6 py-3 text-base font-semibold text-violet-900 transition hover:border-violet-300 hover:bg-violet-50/50"
                >
                  I already have an account
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-violet-200/80 bg-white/90 p-6 shadow-md shadow-violet-100/40 sm:p-8">
          <h2 className="text-lg font-bold text-zinc-900 sm:text-xl">Simple pricing for sellers</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-700 sm:text-base">
            Kinmel is <strong className="text-violet-800">free to use</strong> for your catalog, events,
            overlays, and checkout links. We charge <strong className="text-violet-800">4% of each sale</strong>{" "}
            processed through Kinmel — only when you actually sell.
          </p>
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-zinc-500">
            Pricing may change in the future; we&apos;ll give notice before any update affects your
            account.
          </p>
        </section>

        <section className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-lime-50/70 p-8 shadow-lg sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                Instagram-native selling
              </p>
              <h2 className="text-2xl font-bold text-indigo-950 sm:text-3xl">
                Create shoppable content viewers can act on in the comments
              </h2>
              <p className="text-base leading-relaxed text-indigo-950/80">
                Sellers compose video with a <strong>product card overlaid on the picture</strong> — the
                same product you sell on Kinmel is <strong>associated with a short buy code</strong>{" "}
                (for example a SKU word). When you publish to Instagram, followers see the product on
                screen and know exactly what to type: they{" "}
                <strong>comment the buy code to buy</strong>, and Kinmel connects that intent to your
                hosted checkout flow.
              </p>
              <p className="text-sm leading-relaxed text-indigo-900/75">
                Works alongside live selling: use overlays during a live, or bake text and product
                frames into a recorded Reel or post before you upload — the code in the caption or
                on-screen call-to-action stays consistent with your catalog.
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-3 rounded-2xl bg-white/85 p-5 shadow-inner ring-1 ring-indigo-100 lg:max-w-xs">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">On Instagram</p>
              <div className="rounded-xl border border-violet-200 bg-violet-50/80 px-3 py-2 text-center text-sm font-semibold text-violet-900">
                Comment <span className="text-fuchsia-700">MOCHI</span> to buy
              </div>
              <p className="text-center text-xs text-zinc-500">Buy code ↔ catalog product</p>
              <div className="rounded-xl border border-lime-200 bg-lime-50/90 px-3 py-2 text-center text-xs font-medium text-lime-950">
                Overlay embedded on video
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50/90 px-3 py-2 text-center text-xs font-medium text-sky-950">
                Checkout opens on the web
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50/90 to-teal-50/80 p-8 shadow-lg sm:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-emerald-950">Mobile app = your studio</h2>
              <p className="mt-2 max-w-2xl text-emerald-900/80">
                Download the Kinmel iOS app for camera, microphone, Instagram RTMP, and{" "}
                <strong>on-video product overlays</strong> (live or recorded). That is where shoppable
                frames are composed before they hit your feed — the website handles catalog, codes,
                and orders.
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-white/80 px-5 py-4 text-center shadow-inner ring-1 ring-emerald-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Live host</p>
              <p className="mt-1 text-lg font-bold text-emerald-900">iOS app</p>
              <p className="text-sm text-emerald-700">Required to go live</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-center text-3xl font-bold text-zinc-900">How it works</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-zinc-600">
            Web for catalog & orders, mobile for camera and overlays — Instagram for discovery, your
            site for checkout.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className={`relative rounded-2xl border bg-gradient-to-br p-6 shadow-md ${step.tint}`}
              >
                <div
                  className={`absolute -left-1 -top-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${step.dot}`}
                >
                  {i + 1}
                </div>
                <h3 className="mt-4 text-lg font-bold text-zinc-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-orange-50 p-8 shadow-lg sm:grid-cols-2 sm:p-10">
          <div>
            <h2 className="text-2xl font-bold text-rose-950">Web dashboard</h2>
            <ul className="mt-4 space-y-2 text-rose-900/85">
              <li className="flex gap-2">
                <span className="text-rose-500">✓</span> Shoppable video &amp; buy codes for Instagram
              </li>
              <li className="flex gap-2">
                <span className="text-rose-500">✓</span> Events &amp; lineup
              </li>
              <li className="flex gap-2">
                <span className="text-rose-500">✓</span> Product catalog &amp; overlay layout
              </li>
              <li className="flex gap-2">
                <span className="text-rose-500">✓</span> Stream tools &amp; orders
              </li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white/70 p-6 shadow-inner ring-1 ring-rose-100">
            <h3 className="font-bold text-zinc-900">Secure access</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Live selling, products, and orders are only available after you{" "}
              <Link href="/login" className="font-semibold text-violet-700 underline">
                log in
              </Link>{" "}
              or{" "}
              <Link href="/register" className="font-semibold text-violet-700 underline">
                register
              </Link>
              . There is no public shortcut into the seller portal.
            </p>
          </div>
        </section>

        <footer
          id="contact"
          className="scroll-mt-24 border-t border-zinc-200/80 pt-10 pb-4 text-sm text-zinc-600"
        >
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <p className="text-zinc-500">
              Kinmel — Instagram overlays, comment-to-buy codes, live studio on iOS.
            </p>
            <div className="space-y-1">
              <p className="font-medium text-zinc-800">
                Kinmel is developed by Naman Technologies Private Limited
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">
                Location &amp; Contact
              </p>
              <p>Ward No. 17, Balodaya Marg, Pokhara 33700</p>
              <p>
                <a
                  href="tel:+9779766044502"
                  className="font-semibold text-violet-700 transition hover:text-violet-900 hover:underline"
                >
                  +977 9766044502
                </a>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
