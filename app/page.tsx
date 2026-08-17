"use client";

import Image from "next/image";
import Link from "next/link";

import { useAppState } from "@/components/AppProvider";
import { KinmelBrandLink } from "@/components/KinmelLogo";
import { PhoneFrame } from "@/components/landing/PhoneFrame";
import { StoreDownloadButtons } from "@/components/landing/StoreDownloadButtons";
import {
  KINMEL_CONTACT,
  PUBLIC_REGISTRATION_ENABLED,
} from "@/lib/siteConfig";

const HOW_STEPS = [
  {
    title: "Add your products",
    body: "Create your shop catalog with photos, prices, and simple buy codes buyers can comment.",
  },
  {
    title: "Go live or post a Reel",
    body: "Use the Kinmel app to sell on Instagram Live or turn Reels into shoppable videos.",
  },
  {
    title: "Fans comment to buy",
    body: "Viewers comment the product code. Kinmel helps them get to checkout you focus on selling.",
  },
] as const;

function SiteHeader() {
  const { user, isReady } = useAppState();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 text-zinc-900 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <KinmelBrandLink
          size="sm"
          tone="neutral"
          wordmarkClassName="text-lg font-bold tracking-tight text-zinc-900 sm:text-xl"
        />
        <nav className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <a
            href="#contact"
            className="rounded-full px-2.5 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 sm:px-3 sm:text-sm"
          >
            Contacts
          </a>
          {isReady && user ? (
            <Link
              href="/live-selling"
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/85"
            >
              Workspace
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-black/85 sm:px-4 sm:text-sm"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-zinc-300 bg-white px-2.5 py-2 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-50 sm:px-4 sm:text-sm"
              >
                {PUBLIC_REGISTRATION_ENABLED ? "Sign up" : "Request Kinmel Access"}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <SiteHeader />

      {/* Section 1 — White hero (Whatnot yellow → Kinmel white) */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: "#ffffff", color: "#111111" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 70% 40%, rgba(255,255,255,0.18), transparent 60%), radial-gradient(ellipse 50% 40% at 15% 85%, rgba(0,0,0,0.22), transparent 55%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:py-16">
          {/* Phone cluster */}
          <div className="relative mx-auto flex w-full max-w-md items-end justify-center lg:max-w-none lg:justify-start">
            <div className="absolute left-0 top-8 hidden w-[38%] -rotate-6 opacity-90 sm:block lg:left-2">
              <PhoneFrame
                posterSrc="/kinmel_preview/product.png"
                alt="Kinmel product catalog"
                floatClassName="km-float-delayed"
              />
            </div>
            <div className="relative z-10 w-[62%] max-w-[260px] sm:w-[52%] sm:max-w-[280px]">
              <PhoneFrame
                videoSrc="/videos/instalive.mp4"
                posterSrc="/videos/instalive-poster.jpg"
                alt="Kinmel Instagram live selling"
                priority
                floatClassName="km-float"
                preload="auto"
                loadMode="eager"
              />
            </div>
            <div className="absolute bottom-4 right-0 hidden w-[36%] rotate-6 opacity-95 sm:block lg:right-4">
              <PhoneFrame
                posterSrc="/kinmel_preview/post.png"
                alt="Kinmel shoppable post studio"
                floatClassName="km-float-delayed"
              />
            </div>
          </div>

          {/* Copy + downloads */}
          <div className="km-fade-up text-center lg:text-left">
            <p className="font-display text-xs font-bold uppercase tracking-[0.22em] km-muted-on-white">
              Live commerce for sellers
            </p>
            <h1 className="font-display mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight text-black sm:text-5xl lg:text-[3.4rem]">
              Make Instagram Reels and Live Shoppable
            </h1>
            <p className="mt-3 font-display text-lg font-semibold tracking-wide km-muted-on-white sm:text-xl">
              Sell Live. Sell Reels. Get Orders.
            </p>
            <p className="km-fade-up-delay mx-auto mt-4 max-w-md text-base leading-relaxed km-muted-on-white sm:text-lg lg:mx-0">
              Sell while you stream. Let buyers comment to purchase, Kinmel connects your
              Instagram content to real orders.
            </p>
            <div className="mt-8">
              <p className="mb-3 text-sm font-semibold text-black">Get the Kinmel app</p>
              <StoreDownloadButtons tone="light" className="justify-center lg:justify-start" />
            </div>
          </div>
        </div>

        <div className="relative flex justify-center pb-8">
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-full border border-black/20 bg-black/10 px-4 py-2 text-sm font-semibold text-black transition hover:bg-black/15"
          >
            <span aria-hidden>↓</span> How it works
          </a>
        </div>
      </section>

      {/* Section 2 — Black mid (Whatnot black) */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: "#0a0a0a", color: "#ffffff" }}
      >
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="order-2 lg:order-1 text-white">
            <p
              className="text-xs font-bold uppercase tracking-[0.22em]"
              style={{ color: "#c44a5f" }}
            >
              Join in the fun
            </p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
              Your Instagram audience are your customer
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-zinc-300 sm:text-lg">
              Host a live, show your products, and take orders from comments. Or post Reels that
              shoppers can buy from without sending them on a scavenger hunt for links.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-zinc-200 sm:text-base">
              <li className="flex gap-3">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#c44a5f" }}
                />
                Go live and sell in the moment
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#c44a5f" }}
                />
                Turn Reels into shoppable posts
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#c44a5f" }}
                />
                Manage products and orders in one place
              </li>
            </ul>
            <div className="mt-8">
              <StoreDownloadButtons tone="dark" />
            </div>
          </div>

          <div className="order-1 mx-auto w-full max-w-[280px] lg:order-2 lg:max-w-[320px]">
            <PhoneFrame
              videoSrc="/videos/kinmellive.mp4"
              posterSrc="/videos/kinmellive-poster.jpg"
              alt="Kinmel live selling on Instagram"
              floatClassName="km-float"
              preload="none"
              loadMode="lazy"
            />
          </div>
        </div>
      </section>

      {/* Section 3 — White again */}
      <section
        id="how-it-works"
        className="scroll-mt-20"
        style={{ backgroundColor: "#ffffff", color: "#111111" }}
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-xs font-bold uppercase tracking-[0.22em] km-muted-on-white">
              Simple for sellers
            </p>
            <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              We&apos;ve got the selling flow covered
            </h2>
            <p className="mt-4 text-base km-muted-on-white sm:text-lg">
              Kinmel is built for Instagram sellers: catalog, live, Reels, and checkout without
              the technical noise.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {HOW_STEPS.map((step, index) => (
              <div
                key={step.title}
                className="rounded-3xl border border-black/10 bg-black/5 p-6 backdrop-blur-sm"
              >
                <p className="font-display text-sm font-bold km-muted-on-white">0{index + 1}</p>
                <h3 className="font-display mt-2 text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed km-muted-on-white">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative mx-auto grid w-full max-w-sm grid-cols-2 gap-3">
              <div className="relative aspect-[9/19] overflow-hidden rounded-[1.5rem] border-2 border-black/70 shadow-xl">
                <Image
                  src="/kinmel_preview/menu.png"
                  alt="Kinmel seller menu"
                  fill
                  sizes="160px"
                  className="object-cover object-top"
                />
              </div>
              <div className="relative mt-8 aspect-[9/19] overflow-hidden rounded-[1.5rem] border-2 border-black/70 shadow-xl">
                <Image
                  src="/kinmel_preview/preview.png"
                  alt="Kinmel video preview"
                  fill
                  sizes="160px"
                  className="object-cover object-top"
                />
              </div>
            </div>
            <div>
              <h3 className="font-display text-2xl font-extrabold sm:text-3xl">
                Always Free! Pay After You Sell. 
              </h3>
              <p className="mt-3 max-w-xl text-base leading-relaxed km-muted-on-white">
                Use Kinmel for your catalog, lives, and shoppable posts at no monthly fee.
                Online payments via <strong>Khalti</strong> and <strong>eSewa</strong> have a{" "}
                <strong>2.9% commission</strong>. <strong>COD orders have 0% commission</strong>.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/85"
                >
                  Request Kinmel Access
                </Link>
                <Link
                  href="/login"
                  className="inline-flex rounded-full border border-black/25 px-5 py-3 text-sm font-semibold text-black transition hover:bg-black/5"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer — black */}
      <footer
        id="contact"
        className="scroll-mt-20 border-t border-white/15"
        style={{ backgroundColor: "#0a0a0a", color: "#ffffff" }}
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <KinmelBrandLink
              size="sm"
              tone="neutral"
              wordmarkClassName="font-display text-xl font-bold text-white"
              className="[&_img]:ring-white/15"
            />
            <p className="mt-4 max-w-sm text-sm leading-relaxed km-muted-on-black">
              Make Instagram Reels and Live Shoppable. Built for sellers in Nepal, developed by{" "}
              <a
                href={KINMEL_CONTACT.companyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline-offset-2 hover:underline"
              >
                {KINMEL_CONTACT.companyName}
              </a>
              .
            </p>
          </div>
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wider km-muted-on-black">
              Kinmel
            </p>
            <ul className="mt-3 space-y-2 text-sm km-muted-on-black">
              <li>
                <Link href="/register" className="hover:text-white">
                  Request Kinmel Access
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/clearmydata" className="hover:text-white">
                  Clear my data
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wider km-muted-on-black">
              Contacts
            </p>
            <ul className="mt-3 space-y-2 text-sm km-muted-on-black">
              <li>{KINMEL_CONTACT.address}</li>
              <li>
                <a href={`tel:${KINMEL_CONTACT.phones[0]}`} className="hover:text-white">
                  {KINMEL_CONTACT.phonesDisplay}
                </a>
              </li>
              <li>
                WhatsApp{" "}
                <a
                  href={`https://wa.me/${KINMEL_CONTACT.phones[1].replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  {KINMEL_CONTACT.whatsappDisplay}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-5 text-center text-xs km-muted-on-black">
          © {new Date().getFullYear()} Kinmel ·{" "}
          <a
            href={KINMEL_CONTACT.companyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline"
          >
            Naman Technologies Private Limited
          </a>
        </div>
      </footer>
    </div>
  );
}
