"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppState } from "@/components/AppProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isReady } = useAppState();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (pathname.startsWith("/buy")) {
    return <>{children}</>;
  }

  if (isReady && user) {
    const navItems = [
      { href: "/live-selling", label: "Live Selling" },
      { href: "/products", label: "Products" },
      { href: "/orders", label: "Orders" },
    ];
    return (
      <div className="min-h-screen bg-zinc-100 text-zinc-900">
        <div className="mx-auto flex min-h-screen w-full max-w-[1500px]">
          <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white p-4">
            <Link href="/live-selling" className="mb-6 text-lg font-semibold">
              Kinmel Console
            </Link>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-md px-3 py-2 text-sm font-medium ${
                      active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={() => {
                void handleLogout();
              }}
              className="mt-auto rounded-md border border-zinc-300 px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Logout
            </button>
          </aside>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-lg font-semibold">
            Kinmel Web Control
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                pathname === "/" ? "bg-zinc-900 text-white" : "hover:bg-zinc-200"
              }`}
            >
              Home
            </Link>
            <Link
              href="/login"
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                pathname.startsWith("/login") ? "bg-zinc-900 text-white" : "hover:bg-zinc-200"
              }`}
            >
              Login
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
