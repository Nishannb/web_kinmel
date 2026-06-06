"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KinmelBrandLink } from "@/components/KinmelLogo";
import { RequireAuth } from "@/components/RequireAuth";
import { useAppState } from "@/components/AppProvider";

const navLink =
  "block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-violet-50 hover:text-violet-800";

const navLinkActive = "bg-violet-100 text-violet-900 font-semibold";

function MenuIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SidebarNav({
  navItems,
  isReady,
  user,
  onLogout,
}: {
  navItems: React.ReactNode;
  isReady: boolean;
  user: unknown;
  onLogout: () => void;
}) {
  if (isReady && user) {
    return (
      <>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Workspace">
          {navItems}
        </nav>
        <div className="shrink-0 border-t border-violet-100/80 p-4">
          <button
            type="button"
            onClick={onLogout}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-800"
          >
            Log out
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4">
      <p className="text-xs text-zinc-500">
        {isReady ? "Redirecting to sign in…" : "Loading your workspace…"}
      </p>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, isReady } = useAppState();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("overflow-hidden");
    document.body.classList.add("overflow-hidden");
    return () => {
      document.documentElement.classList.remove("overflow-hidden");
      document.body.classList.remove("overflow-hidden");
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const isActive = (prefix: string) =>
    pathname === prefix || pathname?.startsWith(`${prefix}/`);

  const closeMenu = () => setMenuOpen(false);

  const navItems = (
    <>
      <Link
        href="/live-selling"
        className={`${navLink} ${isActive("/live-selling") ? navLinkActive : ""}`}
        onClick={closeMenu}
      >
        Live selling
      </Link>
      <Link
        href="/products"
        className={`${navLink} ${isActive("/products") ? navLinkActive : ""}`}
        onClick={closeMenu}
      >
        Products
      </Link>
      <Link
        href="/orders"
        className={`${navLink} ${isActive("/orders") ? navLinkActive : ""}`}
        onClick={closeMenu}
      >
        Orders
      </Link>
    </>
  );

  const handleLogout = () => {
    closeMenu();
    void logout();
  };

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-gradient-to-b from-zinc-50 to-violet-50/30">
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-60 shrink-0 flex-col overflow-hidden border-r border-violet-100/80 bg-white shadow-sm xl:flex">
        <div className="flex min-h-14 shrink-0 items-center border-b border-violet-100/80 px-4 py-3">
          <KinmelBrandLink
            size="sm"
            wordmarkClassName="text-lg font-bold tracking-tight text-violet-950"
          />
        </div>
        <SidebarNav
          navItems={navItems}
          isReady={isReady}
          user={user}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile drawer — full height, overlays sticky top bar */}
      {menuOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-50 bg-black/40 xl:hidden"
            onClick={closeMenu}
          />
          <aside className="fixed inset-y-0 left-0 z-[60] flex w-[min(100vw-3rem,18rem)] flex-col overflow-hidden border-r border-violet-100/80 bg-white shadow-xl xl:hidden">
            <div className="flex min-h-14 shrink-0 items-center justify-between border-b border-violet-100/80 px-4 py-3">
              <KinmelBrandLink
                size="sm"
                wordmarkClassName="text-base font-bold tracking-tight text-violet-950"
              />
              <button
                type="button"
                className="rounded-lg p-2 text-zinc-600 hover:bg-violet-50"
                aria-label="Close menu"
                onClick={closeMenu}
              >
                <CloseIcon />
              </button>
            </div>
            <SidebarNav
              navItems={navItems}
              isReady={isReady}
              user={user}
              onLogout={handleLogout}
            />
          </aside>
        </>
      ) : null}

      <RequireAuth>
        <main className="mx-auto flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto xl:overflow-hidden">
          <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-violet-100/80 bg-white px-4 shadow-sm xl:hidden">
            <button
              type="button"
              className="rounded-lg p-2 text-zinc-700 hover:bg-violet-50"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon />
            </button>
            <KinmelBrandLink
              size="sm"
              wordmarkClassName="text-base font-bold tracking-tight text-violet-950"
            />
          </header>

          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 py-4 sm:px-4 xl:min-h-0 xl:overflow-hidden xl:px-8 xl:py-6">
            {children}
          </div>
        </main>
      </RequireAuth>
    </div>
  );
}
