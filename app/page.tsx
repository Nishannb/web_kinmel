import Link from "next/link";

export default function Home() {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-8">
      <h1 className="text-3xl font-semibold">Kinmel Live Commerce Control</h1>
      <p className="mt-3 max-w-2xl text-zinc-600">
        Manage live stream events from the web dashboard. You can log in, create
        events, add products, and configure overlay text and product card layout.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Login
        </Link>
        <Link
          href="/live-selling"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
        >
          Go to Live Selling
        </Link>
      </div>
    </section>
  );
}
