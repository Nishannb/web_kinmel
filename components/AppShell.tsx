"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KinmelBrandLink } from "@/components/KinmelLogo";
import {
  LiveSellingNavIcon,
  LogoutIcon,
  OrdersNavIcon,
  ProductsNavIcon,
} from "@/components/live/LiveWorkspaceIcons";
import { RequireAuth } from "@/components/RequireAuth";
import { useAppState } from "@/components/AppProvider";

const SIDEBAR_WIDTH = "4.25rem";

const navLink =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-violet-50 hover:text-violet-800";

const navLinkCompact =
  "flex w-full items-center justify-center rounded-xl p-2.5 text-zinc-600 transition hover:bg-violet-50 hover:text-violet-800";

const navLinkActive = "bg-violet-100 text-violet-900 font-semibold";

const navIconWrap = "flex h-5 w-5 shrink-0 items-center justify-center";

type SidebarTooltipState = { label: string; top: number } | null;

const SidebarTooltipContext = createContext<{
  show: (label: string, top: number) => void;
  hide: () => void;
} | null>(null);

function SidebarTooltipPortal({ tip }: { tip: SidebarTooltipState }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !tip) {
    return null;
  }

  return createPortal(
    <span
      role="tooltip"
      className="pointer-events-none fixed z-[9999] ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
      style={{ left: SIDEBAR_WIDTH, top: tip.top }}
    >
      {tip.label}
    </span>,
    document.body
  );
}

function CompactTooltipWrap({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const tooltip = useContext(SidebarTooltipContext);

  const bindTooltip = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    tooltip?.show(label, rect.top + rect.height / 2);
  };

  return (
    <div
      className="w-full"
      onMouseEnter={(event) => bindTooltip(event.currentTarget)}
      onMouseLeave={() => tooltip?.hide()}
      onFocus={(event) => bindTooltip(event.currentTarget)}
      onBlur={() => tooltip?.hide()}
    >
      {children}
    </div>
  );
}

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

function NavItem({
  href,
  label,
  icon,
  active,
  compact,
  onClick,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  compact: boolean;
  onClick?: () => void;
}) {
  const className = [
    compact ? navLinkCompact : navLink,
    active ? navLinkActive : "",
  ]
    .filter(Boolean)
    .join(" ");

  const link = (
    <Link
      href={href}
      className={className}
      aria-label={compact ? label : undefined}
      onClick={onClick}
    >
      <span className={navIconWrap}>{icon}</span>
      {!compact ? label : null}
    </Link>
  );

  if (!compact) {
    return link;
  }

  return <CompactTooltipWrap label={label}>{link}</CompactTooltipWrap>;
}

function SidebarNav({
  navItems,
  isReady,
  user,
  onLogout,
  compact,
}: {
  navItems: ReactNode;
  isReady: boolean;
  user: { email?: string } | null;
  onLogout: () => void;
  compact: boolean;
}) {
  if (isReady && user) {
    return (
      <>
        <nav
          className={[
            "flex flex-1 flex-col",
            compact ? "items-center gap-1 overflow-hidden p-2" : "gap-1 overflow-y-auto p-3",
          ].join(" ")}
          aria-label="Workspace"
        >
          {navItems}
        </nav>
        <div
          className={[
            "shrink-0 border-t border-violet-100/80",
            compact ? "flex justify-center overflow-hidden p-2" : "p-4",
          ].join(" ")}
        >
          {compact ? (
            <CompactTooltipWrap label="Logout">
              <button
                type="button"
                onClick={onLogout}
                aria-label="Logout"
                className={navLinkCompact}
              >
                <span className={navIconWrap}>
                  <LogoutIcon className="text-zinc-400" />
                </span>
              </button>
            </CompactTooltipWrap>
          ) : (
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-xl border border-violet-100 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50"
            >
              <span className={navIconWrap}>
                <LogoutIcon className="text-zinc-400" />
              </span>
              Logout
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <div className={`flex flex-1 flex-col ${compact ? "p-2" : "p-4"}`}>
      <p className={`text-zinc-500 ${compact ? "text-center text-[10px] leading-tight" : "text-xs"}`}>
        {isReady ? "Redirecting…" : "Loading…"}
      </p>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, isReady } = useAppState();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarTooltip, setSidebarTooltip] = useState<SidebarTooltipState>(null);

  const showSidebarTooltip = useCallback((label: string, top: number) => {
    setSidebarTooltip({ label, top });
  }, []);

  const hideSidebarTooltip = useCallback(() => {
    setSidebarTooltip(null);
  }, []);

  const sidebarTooltipContext = useMemo(
    () => ({ show: showSidebarTooltip, hide: hideSidebarTooltip }),
    [showSidebarTooltip, hideSidebarTooltip]
  );

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
    hideSidebarTooltip();
  }, [pathname, hideSidebarTooltip]);

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

  const buildNavItems = (compact: boolean) => (
    <>
      <NavItem
        href="/live-selling"
        label="Live selling"
        compact={compact}
        active={isActive("/live-selling")}
        onClick={closeMenu}
        icon={
          <LiveSellingNavIcon
            className={isActive("/live-selling") ? "text-violet-600" : "text-zinc-400"}
          />
        }
      />
      <NavItem
        href="/products"
        label="Products"
        compact={compact}
        active={isActive("/products")}
        onClick={closeMenu}
        icon={
          <ProductsNavIcon
            className={isActive("/products") ? "text-violet-600" : "text-zinc-400"}
          />
        }
      />
      <NavItem
        href="/orders"
        label="Orders"
        compact={compact}
        active={isActive("/orders")}
        onClick={closeMenu}
        icon={
          <OrdersNavIcon className={isActive("/orders") ? "text-violet-600" : "text-zinc-400"} />
        }
      />
    </>
  );

  const handleLogout = () => {
    closeMenu();
    hideSidebarTooltip();
    void logout();
  };

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-gradient-to-b from-zinc-50 to-violet-50/30">
      <SidebarTooltipContext.Provider value={sidebarTooltipContext}>
        <SidebarTooltipPortal tip={sidebarTooltip} />

        {/* Desktop sidebar — icon strip with hover tooltips */}
        <aside className="relative z-30 hidden h-full w-[4.25rem] shrink-0 flex-col overflow-hidden border-r border-violet-100/80 bg-white shadow-sm xl:flex">
          <div className="flex min-h-14 shrink-0 items-center justify-center border-b border-violet-100/80 py-3">
            <KinmelBrandLink size="sm" showWordmark={false} />
          </div>
          <SidebarNav
            navItems={buildNavItems(true)}
            isReady={isReady}
            user={user}
            onLogout={handleLogout}
            compact
          />
        </aside>
      </SidebarTooltipContext.Provider>

      {/* Mobile drawer — full labels */}
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
              navItems={buildNavItems(false)}
              isReady={isReady}
              user={user}
              onLogout={handleLogout}
              compact={false}
            />
          </aside>
        </>
      ) : null}

      <RequireAuth>
        <main className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto xl:overflow-hidden">
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

          <div className="flex w-full flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4 xl:h-full xl:min-h-0 xl:overflow-hidden xl:px-5 xl:py-4">
            {children}
          </div>
        </main>
      </RequireAuth>
    </div>
  );
}
