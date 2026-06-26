"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppState } from "@/components/AppProvider";
import { CreateLiveProductModal } from "@/components/live/CreateLiveProductModal";
import {
  CalendarIcon,
  ChatBubbleIcon,
  FilterIcon,
  KeyIcon,
  SearchIcon,
} from "@/components/live/LiveWorkspaceIcons";
import { useOverlaySync } from "@/hooks/useOverlaySync";
import type { Product } from "@/lib/appTypes";
import { formatStorefrontPrice } from "@/lib/formatNpr";
import { humanizeKinmelApiError } from "@/lib/humanizeKinmelApiError";
import { getBackendWsBase } from "@/lib/publicConfig";
import { supabase } from "@/lib/supabase";
import { getSafeSession } from "@/lib/supabaseAuth";

type LiveCommentItem = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
};

type LiveProductRow = Product & {
  inSession: boolean;
  effectiveBuyCode: string;
};

type SortMode = "session" | "name" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortMode, string> = {
  session: "Recently added",
  name: "Name A–Z",
  "price-asc": "Price low–high",
  "price-desc": "Price high–low",
};

function productRecencyMs(row: LiveProductRow): number {
  if (row.sessionAddedAt) {
    return new Date(row.sessionAddedAt).getTime();
  }
  if (row.catalogUpdatedAt) {
    return new Date(row.catalogUpdatedAt).getTime();
  }
  return 0;
}

function sortLiveProductRows(rows: LiveProductRow[], mode: SortMode): LiveProductRow[] {
  const sorted = [...rows];
  if (mode === "name") {
    return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  if (mode === "price-asc") {
    return sorted.sort((a, b) => a.price - b.price);
  }
  if (mode === "price-desc") {
    return sorted.sort((a, b) => b.price - a.price);
  }
  return sorted.sort((a, b) => productRecencyMs(b) - productRecencyMs(a));
}

/** WebSocket `comment.insert` payload shape from the relay server. */
type WsCommentInsertPayload = {
  id?: unknown;
  text?: unknown;
  author?: unknown;
  created_at?: unknown;
};

export default function LiveWorkspacePage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const {
    getEventById,
    addProductToEvent,
    ensureProductOnEvent,
    updateEventProductDiscountPercent,
    updateEventProductBuyCode,
    updateCatalogProductStock,
    catalogProducts,
  } = useAppState();
  const event = getEventById(eventId);
  const overlaySync = useOverlaySync(
    event?.status === "live" ? (event.id ?? null) : null
  );

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("session");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [overlayBusyId, setOverlayBusyId] = useState<string | null>(null);

  const [discountDrafts, setDiscountDrafts] = useState<Record<string, string>>({});
  const [discountBusyId, setDiscountBusyId] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [buyCodeDrafts, setBuyCodeDrafts] = useState<Record<string, string>>({});
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [stockBusyId, setStockBusyId] = useState<string | null>(null);
  const [buyCodeBusyId, setBuyCodeBusyId] = useState<string | null>(null);
  const [buyCodeError, setBuyCodeError] = useState<string | null>(null);

  const [comments, setComments] = useState<LiveCommentItem[]>([]);

  const liveProductRows = useMemo(() => {
    if (!event) return [];
    const sessionById = new Map(event.products.map((product) => [product.id, product]));
    const rows: LiveProductRow[] = catalogProducts.map((catalog) => {
      const session = sessionById.get(catalog.id);
      const effectiveBuyCode = session?.buyCode?.trim() || catalog.buyCode?.trim() || "";
      return {
        ...catalog,
        discountedPrice: session?.discountedPrice ?? null,
        buyCode: session?.buyCode ?? catalog.buyCode,
        sessionAddedAt: session?.sessionAddedAt,
        catalogUpdatedAt: catalog.catalogUpdatedAt,
        inSession: Boolean(session),
        effectiveBuyCode,
      };
    });
    const q = productSearch.trim().toLowerCase();
    const filtered = q
      ? rows.filter(
          (row) =>
            row.name.toLowerCase().includes(q) ||
            row.effectiveBuyCode.toLowerCase().includes(q)
        )
      : rows;
    return sortLiveProductRows(filtered, sortMode);
  }, [catalogProducts, event, productSearch, sortMode]);

  useEffect(() => {
    if (!sortMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [sortMenuOpen]);

  useEffect(() => {
    if (!event?.id) return;
    let isMounted = true;
    const mergeUniqueComments = (current: LiveCommentItem[], incoming: LiveCommentItem[]) => {
      const seen = new Set<string>();
      const merged: LiveCommentItem[] = [];
      for (const item of [...incoming, ...current]) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        merged.push(item);
        if (merged.length >= 60) break;
      }
      return merged;
    };
    const mapRow = (row: Record<string, unknown>): LiveCommentItem => {
      const raw = (row.raw_payload ?? {}) as Record<string, unknown>;
      let author = "Viewer";
      const entry = raw.entry;
      if (Array.isArray(entry) && entry.length > 0) {
        const changes = (entry[0] as Record<string, unknown>).changes;
        if (Array.isArray(changes) && changes.length > 0) {
          const value = (changes[0] as Record<string, unknown>).value as
            | Record<string, unknown>
            | undefined;
          const from = value?.from as Record<string, unknown> | undefined;
          const username = from?.username;
          if (typeof username === "string" && username.trim()) {
            author = username.trim();
          }
        }
      }
      return {
        id: String(row.id ?? Math.random()),
        text: String(row.comment_text ?? ""),
        author,
        createdAt: String(row.created_at ?? new Date().toISOString()),
      };
    };

    const loadInitial = async () => {
      const { data, error } = await supabase
        .from("live_comments")
        .select("id, comment_text, raw_payload, created_at")
        .eq("live_session_id", event.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!isMounted || error) return;
      const mapped = (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
      setComments((prev) => mergeUniqueComments(prev, mapped));
    };

    void loadInitial();

    const socketBase = getBackendWsBase();
    let ws: WebSocket | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let fallbackPollTimer: ReturnType<typeof setInterval> | null = null;
    let wsConnected = false;
    let reconnectAttempt = 0;

    const startFallbackPoll = () => {
      if (fallbackPollTimer) return;
      fallbackPollTimer = setInterval(() => {
        if (!wsConnected) void loadInitial();
      }, 5000);
    };
    const stopFallbackPoll = () => {
      if (fallbackPollTimer) {
        clearInterval(fallbackPollTimer);
        fallbackPollTimer = null;
      }
    };

    const connect = async () => {
      try {
        const session = await getSafeSession();
        const token = session?.access_token;
        if (!token) return;
        ws = new WebSocket(`${socketBase}/ws/live-sessions/${event.id}/comments`);
        ws.onopen = () => {
          reconnectAttempt = 0;
          wsConnected = true;
          stopFallbackPoll();
          ws?.send(JSON.stringify({ type: "auth", token }));
          if (pingTimer) clearInterval(pingTimer);
          pingTimer = setInterval(() => {
            ws?.send(JSON.stringify({ type: "ping" }));
          }, 25000);
        };
        ws.onmessage = (ev) => {
          if (typeof ev.data !== "string") return;
          try {
            const parsed = JSON.parse(ev.data) as
              | { type: string; comment?: Record<string, unknown> }
              | Record<string, unknown>;
            if (parsed.type === "comments.ready") {
              wsConnected = true;
              stopFallbackPoll();
              return;
            }
            if (
              parsed.type === "comment.insert" &&
              parsed.comment &&
              typeof parsed.comment === "object"
            ) {
              const c = parsed.comment as WsCommentInsertPayload;
              const next: LiveCommentItem = {
                id: String(c.id ?? Math.random()),
                text: String(c.text ?? ""),
                author: String(c.author ?? "Viewer"),
                createdAt: String(c.created_at ?? new Date().toISOString()),
              };
              setComments((prev) => mergeUniqueComments(prev, [next]));
            }
          } catch {}
        };
        ws.onerror = () => {
          wsConnected = false;
          startFallbackPoll();
        };
        ws.onclose = () => {
          wsConnected = false;
          startFallbackPoll();
          if (!isMounted) return;
          reconnectAttempt += 1;
          const delay = Math.min(15000, 1000 * 2 ** (reconnectAttempt - 1));
          reconnectTimer = setTimeout(() => {
            void connect();
          }, delay);
        };
      } catch {
        wsConnected = false;
        startFallbackPoll();
      }
    };
    void connect();

    return () => {
      isMounted = false;
      stopFallbackPoll();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pingTimer) clearInterval(pingTimer);
      try {
        ws?.close();
      } catch {}
    };
  }, [event?.id]);

  const onCreateProduct = async (input: {
    name: string;
    price: number;
    buyCode: string;
    stockQuantity: number;
    imageFile: File;
  }) => {
    if (!event) return;
    setCreateError(null);
    setCreatingProduct(true);
    try {
      const productId = await addProductToEvent(event.id, input);
      overlaySync.setSettings({
        ...overlaySync.settings,
        visibleProductIds: [productId],
      });
      overlaySync.forceSync();
      setCreateModalOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setCreateError(humanizeKinmelApiError(message));
    } finally {
      setCreatingProduct(false);
    }
  };

  const selectOverlayProduct = async (productId: string) => {
    if (!event) return;
    setListError(null);
    setOverlayBusyId(productId);
    try {
      await ensureProductOnEvent(event.id, productId);
      overlaySync.setSettings({
        ...overlaySync.settings,
        visibleProductIds: [productId],
      });
      overlaySync.forceSync();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setListError(humanizeKinmelApiError(message));
    } finally {
      setOverlayBusyId(null);
    }
  };

  const clearOverlayProduct = () => {
    overlaySync.setSettings({
      ...overlaySync.settings,
      visibleProductIds: [],
    });
  };

  const saveBuyCode = async (productId: string, fallbackBuyCode: string) => {
    if (!event) return;
    const buyCode = (buyCodeDrafts[productId] ?? fallbackBuyCode).trim();
    if (!buyCode) {
      setBuyCodeError("Buy code is required.");
      return;
    }
    setBuyCodeBusyId(productId);
    setBuyCodeError(null);
    try {
      await updateEventProductBuyCode(event.id, productId, buyCode);
      overlaySync.forceSync();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setBuyCodeError(humanizeKinmelApiError(message));
    } finally {
      setBuyCodeBusyId(null);
    }
  };

  const saveDiscountPercent = async (productId: string) => {
    if (!event) return;
    const raw = (discountDrafts[productId] ?? "").trim();
    const percent = raw === "" ? 0 : Number(raw);
    if (!Number.isFinite(percent) || percent < 0 || percent >= 100) {
      setDiscountError("Discount % must be between 0 and 99.");
      return;
    }
    setDiscountBusyId(productId);
    setDiscountError(null);
    try {
      await updateEventProductDiscountPercent(event.id, productId, percent);
      overlaySync.forceSync();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setDiscountError(humanizeKinmelApiError(message));
    } finally {
      setDiscountBusyId(null);
    }
  };

  const saveStock = async (productId: string, fallbackStock: number | null | undefined) => {
    const raw = (stockDrafts[productId] ?? "").trim();
    const parsed =
      raw === "" && fallbackStock != null
        ? fallbackStock
        : raw === ""
          ? NaN
          : Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      setListError("Available quantity must be a whole number (0 or more).");
      return;
    }
    setStockBusyId(productId);
    setListError(null);
    try {
      await updateCatalogProductStock(productId, parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setListError(humanizeKinmelApiError(message));
    } finally {
      setStockBusyId(null);
    }
  };

  const saveRow = async (
    productId: string,
    fallbackBuyCode: string,
    fallbackStock: number | null | undefined
  ) => {
    await saveDiscountPercent(productId);
    await saveBuyCode(productId, fallbackBuyCode);
    await saveStock(productId, fallbackStock);
  };

  const selectedOverlayProductId = overlaySync.settings.visibleProductIds[0] ?? null;

  const statusLabel =
    event?.status === "live"
      ? "live"
      : event?.status === "scheduled"
        ? "scheduled"
        : event?.status ?? "";

  const cardClass = "rounded-2xl border border-violet-100/90 bg-white shadow-sm";
  const violetBtn =
    "rounded-xl bg-violet-100 px-4 py-1.5 text-xs font-semibold text-violet-800 transition hover:bg-violet-200 disabled:opacity-60";
  const violetOutlineBtn =
    "inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-800 transition hover:bg-violet-50";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {!event ? (
        <section className={`${cardClass} p-6`}>
          <h1 className="text-xl font-semibold">Event not found</h1>
          <Link href="/live-selling" className="mt-4 inline-block text-sm text-violet-700 underline">
            Back to Live Selling
          </Link>
        </section>
      ) : (
        <section className="grid h-full min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_min(22rem,28vw)] xl:grid-cols-[minmax(0,1fr)_min(26rem,32vw)] xl:gap-4">
          <div className="flex min-h-0 flex-1 flex-col gap-3 max-lg:min-h-[32rem]">
            {/* Event header card — matches mockup top strip */}
            <div className={`shrink-0 ${cardClass} px-4 py-4 sm:px-5`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                    <CalendarIcon size="sm" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate text-base font-bold text-zinc-900 sm:text-lg">
                      {event.name}
                    </h1>
                    <p className="text-xs text-zinc-500 sm:text-sm">
                      Status:{" "}
                      {event.status === "live" ? (
                        <span className="font-semibold text-emerald-600">live</span>
                      ) : (
                        <span className="font-semibold text-violet-700">{statusLabel}</span>
                      )}
                    </p>
                  </div>
                </div>
                <Link href={`/live-selling/${event.id}/stream`} className={violetOutlineBtn}>
                  <KeyIcon />
                  <span className="hidden sm:inline">Edit Stream Keys</span>
                  <span className="sm:hidden">Keys</span>
                </Link>
              </div>
            </div>

            {/* Products card */}
            <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${cardClass}`}>
              <div className="shrink-0 px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-zinc-900">Products</h2>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500 sm:text-sm">
                      Select a product to show on the live stream overlay. Buy code defaults from
                      your catalog; override per show if needed.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateError(null);
                      setCreateModalOpen(true);
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-lg font-medium leading-none text-white shadow-sm transition hover:bg-violet-700"
                    aria-label="Create new product"
                    title="Create new product"
                  >
                    +
                  </button>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative min-w-0 flex-1">
                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      value={productSearch}
                      onChange={(eventItem) => setProductSearch(eventItem.target.value)}
                      placeholder="Search by name or buy code..."
                      className="w-full rounded-xl border border-violet-100 bg-violet-50/30 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
                    />
                  </div>
                  <div className="relative shrink-0" ref={sortMenuRef}>
                    <button
                      type="button"
                      onClick={() => setSortMenuOpen((open) => !open)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-100 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-violet-50 sm:w-auto"
                    >
                      <FilterIcon className="text-violet-600" />
                      Filter / Sort
                    </button>
                    {sortMenuOpen ? (
                      <div className="absolute right-0 z-20 mt-1 min-w-[11rem] rounded-xl border border-violet-100 bg-white py-1 shadow-lg">
                        {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => {
                              setSortMode(mode);
                              setSortMenuOpen(false);
                            }}
                            className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-violet-50 ${
                              sortMode === mode
                                ? "font-semibold text-violet-800"
                                : "text-zinc-700"
                            }`}
                          >
                            {SORT_LABELS[mode]}
                          </button>
                        ))}
                        <div className="my-1 border-t border-violet-50" />
                        <button
                          type="button"
                          onClick={() => {
                            clearOverlayProduct();
                            setSortMenuOpen(false);
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-zinc-600 transition hover:bg-violet-50"
                        >
                          Clear displayed product
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto border-t border-violet-50">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-violet-50 text-left text-xs font-semibold uppercase tracking-wide text-violet-800">
                    <tr>
                      <th className="w-16 px-4 py-3">Display</th>
                      <th className="px-4 py-3">Product Name</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Discount %</th>
                      <th className="px-4 py-3">Available</th>
                      <th className="px-4 py-3">Buy Code</th>
                      <th className="w-24 px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {liveProductRows.length === 0 ? (
                      <tr>
                        <td className="px-4 py-4 text-center text-zinc-500" colSpan={7}>
                          {catalogProducts.length === 0
                            ? "No products in your catalog yet. Tap + to create one."
                            : "No products match your search."}
                        </td>
                      </tr>
                    ) : (
                      liveProductRows.map((product) => {
                        const isSelected = selectedOverlayProductId === product.id;
                        const isBusy =
                          overlayBusyId === product.id ||
                          discountBusyId === product.id ||
                          buyCodeBusyId === product.id ||
                          stockBusyId === product.id;
                        return (
                          <tr
                            key={product.id}
                            className={`border-t border-violet-50 transition ${
                              isSelected ? "bg-violet-50/80" : "hover:bg-violet-50/30"
                            }`}
                          >
                            <td className="px-4 py-3 align-middle">
                              <input
                                type="radio"
                                name="overlayProduct"
                                checked={isSelected}
                                disabled={isBusy}
                                onChange={() => {
                                  void selectOverlayProduct(product.id);
                                }}
                                className="h-4 w-4 accent-violet-600"
                              />
                            </td>
                            <td className="px-4 py-3 align-middle">
                              <div className="flex items-center gap-3">
                                {product.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={product.imageUrl}
                                    alt=""
                                    className="h-11 w-11 shrink-0 rounded-xl border border-violet-100 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-[10px] font-medium text-violet-400">
                                    —
                                  </div>
                                )}
                                <p className="font-medium text-zinc-900">{product.name}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 align-middle font-medium text-zinc-800">
                              {product.discountedPrice != null &&
                              product.discountedPrice >= 0 &&
                              product.discountedPrice < product.price ? (
                                <span className="inline-flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                                  <span className="text-xs text-zinc-400 line-through">
                                    {formatStorefrontPrice(product.price, product.currency)}
                                  </span>
                                  <span>
                                    {formatStorefrontPrice(
                                      product.discountedPrice,
                                      product.currency
                                    )}
                                  </span>
                                </span>
                              ) : (
                                formatStorefrontPrice(product.price, product.currency)
                              )}
                            </td>
                            <td className="px-4 py-3 align-middle">
                              <div className="relative w-[4.5rem]">
                                <input
                                  type="number"
                                  min={0}
                                  max={99}
                                  step={1}
                                  value={
                                    discountDrafts[product.id] ??
                                    (product.discountedPrice != null &&
                                    product.discountedPrice < product.price
                                      ? String(
                                          Math.round(
                                            ((product.price - product.discountedPrice) /
                                              product.price) *
                                              100
                                          )
                                        )
                                      : "0")
                                  }
                                  onChange={(eventInput) =>
                                    setDiscountDrafts((prev) => ({
                                      ...prev,
                                      [product.id]: eventInput.target.value,
                                    }))
                                  }
                                  className="w-full rounded-lg border border-violet-100 bg-white py-1.5 pl-2 pr-6 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                                />
                                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                                  %
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 align-middle">
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={
                                  stockDrafts[product.id] ??
                                  (product.stockQuantity != null
                                    ? String(product.stockQuantity)
                                    : "")
                                }
                                onChange={(eventInput) =>
                                  setStockDrafts((prev) => ({
                                    ...prev,
                                    [product.id]: eventInput.target.value,
                                  }))
                                }
                                className="w-20 rounded-lg border border-violet-100 bg-white px-2 py-1.5 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                                placeholder="—"
                              />
                            </td>
                            <td className="px-4 py-3 align-middle">
                              <input
                                value={buyCodeDrafts[product.id] ?? product.effectiveBuyCode ?? ""}
                                onChange={(eventInput) =>
                                  setBuyCodeDrafts((prev) => ({
                                    ...prev,
                                    [product.id]: eventInput.target.value,
                                  }))
                                }
                                className="w-full min-w-[6.5rem] max-w-[8rem] rounded-lg border border-violet-100 bg-white px-2 py-1.5 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                                placeholder="e.g. RED50"
                              />
                            </td>
                            <td className="px-4 py-3 align-middle">
                              <button
                                type="button"
                                onClick={() => {
                                  void saveRow(
                                    product.id,
                                    product.effectiveBuyCode,
                                    product.stockQuantity
                                  );
                                }}
                                disabled={isBusy}
                                className={violetBtn}
                              >
                                {isBusy ? "…" : "Save"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {listError || buyCodeError || discountError || (selectedOverlayProductId && overlaySync.error) ? (
                <div className="shrink-0 space-y-2 border-t border-violet-50 px-4 py-3 sm:px-5">
                  {listError ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {listError}
                    </p>
                  ) : null}
                  {buyCodeError ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {buyCodeError}
                    </p>
                  ) : null}
                  {discountError ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {discountError}
                    </p>
                  ) : null}
                  {selectedOverlayProductId && overlaySync.error ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {humanizeKinmelApiError(overlaySync.error)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <aside className={`flex min-h-0 flex-col overflow-hidden ${cardClass} max-lg:min-h-64 lg:h-full`}>
            <div className="shrink-0 border-b border-violet-50 px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                  <ChatBubbleIcon size="sm" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">Live Comments</h2>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    Realtime comments while the show is live.
                  </p>
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              {comments.length === 0 ? (
                <div className="flex h-full min-h-[12rem] flex-col items-center justify-center px-2 text-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-violet-100 text-violet-500">
                    <ChatBubbleIcon size="lg" className="text-violet-500" />
                  </div>
                  <p className="mt-5 text-sm font-semibold text-zinc-800">No comments yet.</p>
                  <p className="mt-1 max-w-[15rem] text-sm leading-relaxed text-zinc-500">
                    Comments will appear here when viewers start chatting.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <article
                      key={comment.id}
                      className="rounded-xl border border-violet-100 bg-violet-50/40 p-3"
                    >
                      <p className="text-sm font-semibold text-violet-950">{comment.author}</p>
                      <p className="mt-1 text-sm text-zinc-700">
                        {comment.text || "(empty comment)"}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {new Date(comment.createdAt).toLocaleTimeString()}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </section>
      )}

      <CreateLiveProductModal
        open={createModalOpen}
        busy={creatingProduct}
        error={createError}
        onClose={() => {
          if (!creatingProduct) {
            setCreateModalOpen(false);
            setCreateError(null);
          }
        }}
        onSubmit={onCreateProduct}
      />
    </div>
  );
}
