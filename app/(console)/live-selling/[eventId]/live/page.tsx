"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppState } from "@/components/AppProvider";
import { useOverlaySync } from "@/hooks/useOverlaySync";
import { formatStorefrontPrice } from "@/lib/formatNpr";
import { getBackendWsBase } from "@/lib/publicConfig";
import { supabase } from "@/lib/supabase";
import { getSafeSession } from "@/lib/supabaseAuth";

type LiveCommentItem = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
};

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
    addExistingProductToEvent,
    updateEventProductDiscountPercent,
    updateEventProductBuyCode,
    catalogProducts,
  } = useAppState();
  const event = getEventById(eventId);
  const overlaySync = useOverlaySync(event?.id ?? null);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newProductUrl, setNewProductUrl] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreviewUrl, setNewImagePreviewUrl] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);

  const [search, setSearch] = useState("");
  const [attachError, setAttachError] = useState<string | null>(null);
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [attachBuyCode, setAttachBuyCode] = useState("");
  const [newBuyCode, setNewBuyCode] = useState("");
  const [discountDrafts, setDiscountDrafts] = useState<Record<string, string>>({});
  const [discountBusyId, setDiscountBusyId] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [buyCodeDrafts, setBuyCodeDrafts] = useState<Record<string, string>>({});
  const [buyCodeBusyId, setBuyCodeBusyId] = useState<string | null>(null);
  const [buyCodeError, setBuyCodeError] = useState<string | null>(null);
  const [sessionProductSearch, setSessionProductSearch] = useState("");

  const [comments, setComments] = useState<LiveCommentItem[]>([]);

  const addableProducts = useMemo(() => {
    if (!event) return [];
    const eventProductIds = new Set(event.products.map((p) => p.id));
    const q = search.trim().toLowerCase();
    return catalogProducts
      .filter((p) => !eventProductIds.has(p.id))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true));
  }, [catalogProducts, event, search]);
  const filteredSessionProducts = useMemo(() => {
    if (!event) return [];
    const q = sessionProductSearch.trim().toLowerCase();
    if (!q) return event.products;
    return event.products.filter((p) => p.name.toLowerCase().includes(q));
  }, [event, sessionProductSearch]);

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
      const fallbackAuthor =
        (raw.username as string | undefined) ||
        (raw.from as string | undefined) ||
        "Viewer";
      return {
        id: String(row.id ?? Math.random()),
        text: String(row.comment_text ?? ""),
        author: fallbackAuthor,
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
    let reconnectAttempt = 0;

    const connect = async () => {
      try {
        const session = await getSafeSession();
        const token = session?.access_token;
        if (!token) return;
        ws = new WebSocket(`${socketBase}/ws/live-sessions/${event.id}/comments`);
        ws.onopen = () => {
          reconnectAttempt = 0;
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
        ws.onclose = () => {
          if (!isMounted) return;
          reconnectAttempt += 1;
          const delay = Math.min(15000, 1000 * 2 ** (reconnectAttempt - 1));
          reconnectTimer = setTimeout(() => {
            void connect();
          }, delay);
        };
      } catch {}
    };
    void connect();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pingTimer) clearInterval(pingTimer);
      try {
        ws?.close();
      } catch {}
    };
  }, [event?.id]);

  useEffect(() => {
    if (!newImageFile) {
      setNewImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(newImageFile);
    setNewImagePreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [newImageFile]);

  const onAddProduct = async (eventForm: FormEvent<HTMLFormElement>) => {
    eventForm.preventDefault();
    if (!event) return;
    const price = Number(newPrice);
    if (!newName.trim() || Number.isNaN(price)) return;
    const imageFile = newImageFile;
    if (!imageFile || imageFile.size === 0) {
      setAddError("Please choose a product image (JPEG, PNG, or WebP).");
      return;
    }
    setAddError(null);
    setAddingProduct(true);
    try {
      await addProductToEvent(event.id, {
        name: newName.trim(),
        price,
        productUrl: newProductUrl.trim() || undefined,
        imageFile,
        buyCode: newBuyCode.trim(),
      });
      setNewName("");
      setNewPrice("");
      setNewBuyCode("");
      setNewProductUrl("");
      setNewImageFile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setAddError(message);
    } finally {
      setAddingProduct(false);
    }
  };

  const onAttachExisting = async (productId: string) => {
    if (!event) return;
    const buyCode = attachBuyCode.trim();
    if (!buyCode) {
      setAttachError("Buy code is required.");
      return;
    }
    setAttachError(null);
    setAttachingId(productId);
    try {
      await addExistingProductToEvent(event.id, productId, buyCode);
      setAttachBuyCode("");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setAttachError(message);
    } finally {
      setAttachingId(null);
    }
  };
  const saveBuyCode = async (productId: string) => {
    if (!event) return;
    const buyCode = (buyCodeDrafts[productId] ?? "").trim();
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
      setBuyCodeError(message);
    } finally {
      setBuyCodeBusyId(null);
    }
  };

  const selectOverlayProduct = (productId: string) => {
    overlaySync.setSettings({
      ...overlaySync.settings,
      visibleProductIds: [productId],
    });
  };
  const clearOverlayProduct = () => {
    overlaySync.setSettings({
      ...overlaySync.settings,
      visibleProductIds: [],
    });
  };
  const onOverlayTextChange = (value: string) => {
    overlaySync.setSettings({
      ...overlaySync.settings,
      overlayText: value,
    });
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
      setDiscountError(message);
    } finally {
      setDiscountBusyId(null);
    }
  };

  const selectedOverlayProductId = overlaySync.settings.visibleProductIds[0] ?? null;

  return (
    <>
      {!event ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h1 className="text-xl font-semibold">Event not found</h1>
          <Link href="/live-selling" className="mt-4 inline-block text-sm text-zinc-700 underline">
            Back to Live Selling
          </Link>
        </section>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold">{event.name}</h1>
                  <p className="mt-1 text-sm text-zinc-600">
                    {event.status === "live" ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                        Show is Ongoing
                      </span>
                    ) : (
                      `Status: ${event.status}`
                    )}
                  </p>
                </div>
                <Link
                  href={`/live-selling/${event.id}/stream`}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
                >
                  Edit Stream Keys
                </Link>
              </div>
              <div className="mt-4">
                <label className="block space-y-1">
                  <span className="text-sm font-medium">Overlay Text (shown on stream)</span>
                  <input
                    value={overlaySync.settings.overlayText}
                    onChange={(eventInput) => onOverlayTextChange(eventInput.target.value)}
                    placeholder="Type banner text..."
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h2 className="text-lg font-semibold">Products for this live session</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Select exactly one product to display on live; selecting a product deselects others.
              </p>
              <input
                value={sessionProductSearch}
                onChange={(eventItem) => setSessionProductSearch(eventItem.target.value)}
                placeholder="Search products in this session..."
                className="mt-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
              />
              <div className="mt-2">
                <button
                  type="button"
                  onClick={clearOverlayProduct}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                >
                  Clear displayed product
                </button>
              </div>
              <div className="mt-4 overflow-hidden rounded-md border border-zinc-200">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-zinc-500">
                    <tr>
                      <th className="w-20 px-3 py-2">Display</th>
                      <th className="px-3 py-2">Product Name</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Discount %</th>
                      <th className="px-3 py-2">Buy Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessionProducts.length === 0 ? (
                      <tr>
                        <td className="px-3 py-4 text-zinc-500" colSpan={5}>
                          {event.products.length === 0
                            ? "No products in this event yet."
                            : "No products match your search."}
                        </td>
                      </tr>
                    ) : (
                      filteredSessionProducts.map((product) => (
                        <tr key={product.id} className="border-t border-zinc-100">
                          <td className="px-3 py-2">
                            <input
                              type="radio"
                              name="overlayProduct"
                              checked={overlaySync.settings.visibleProductIds[0] === product.id}
                              onChange={() => selectOverlayProduct(product.id)}
                            />
                          </td>
                          <td className="px-3 py-2">{product.name}</td>
                          <td className="px-3 py-2">
                            {product.discountedPrice != null &&
                            product.discountedPrice >= 0 &&
                            product.discountedPrice < product.price ? (
                              <span className="inline-flex items-center gap-2">
                                <span className="text-red-600 line-through">
                                  {formatStorefrontPrice(product.price, product.currency)}
                                </span>
                                <span className="font-semibold text-zinc-800">
                                  {formatStorefrontPrice(product.discountedPrice, product.currency)}
                                </span>
                              </span>
                            ) : (
                              <span>
                                {formatStorefrontPrice(product.price, product.currency)}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
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
                                    : "")
                                }
                                onChange={(eventInput) =>
                                  setDiscountDrafts((prev) => ({
                                    ...prev,
                                    [product.id]: eventInput.target.value,
                                  }))
                                }
                                className="w-20 rounded-md border border-zinc-300 px-2 py-1 outline-none focus:border-zinc-500"
                                placeholder="0"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  void saveDiscountPercent(product.id);
                                }}
                                disabled={discountBusyId === product.id}
                                className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 disabled:opacity-60"
                              >
                                {discountBusyId === product.id ? "Saving..." : "Save"}
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <input
                                value={buyCodeDrafts[product.id] ?? product.buyCode ?? ""}
                                onChange={(eventInput) =>
                                  setBuyCodeDrafts((prev) => ({
                                    ...prev,
                                    [product.id]: eventInput.target.value,
                                  }))
                                }
                                className="w-24 rounded-md border border-zinc-300 px-2 py-1 outline-none focus:border-zinc-500"
                                placeholder="e.g. 37"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  void saveBuyCode(product.id);
                                }}
                                disabled={buyCodeBusyId === product.id}
                                className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 disabled:opacity-60"
                              >
                                {buyCodeBusyId === product.id ? "Saving..." : "Save"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {buyCodeError ? (
                <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {buyCodeError}
                </p>
              ) : null}
              {discountError ? (
                <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {discountError}
                </p>
              ) : null}
              {selectedOverlayProductId && overlaySync.error ? (
                <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {overlaySync.error}
                </p>
              ) : null}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="text-base font-semibold">Attach Existing Product</h3>
                <input
                  value={search}
                  onChange={(eventItem) => setSearch(eventItem.target.value)}
                  placeholder="Search product name..."
                  className="mt-3 w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                />
                <input
                  value={attachBuyCode}
                  onChange={(eventItem) => setAttachBuyCode(eventItem.target.value)}
                  placeholder="Buy code for selected product (e.g. 37)"
                  className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                />
                <div className="mt-3 max-h-64 space-y-2 overflow-auto">
                  {addableProducts.length === 0 ? (
                    <p className="text-sm text-zinc-600">No matching products.</p>
                  ) : (
                    addableProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2"
                      >
                        <span className="text-sm">
                          {product.name} ({formatStorefrontPrice(product.price, product.currency)})
                        </span>
                        <button
                          type="button"
                          disabled={attachingId === product.id}
                          onClick={() => {
                            void onAttachExisting(product.id);
                          }}
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 disabled:opacity-60"
                        >
                          {attachingId === product.id ? "Adding..." : "Add"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
                {attachError ? (
                  <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {attachError}
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="text-base font-semibold">Create New Product</h3>
                <form className="mt-3 space-y-3" onSubmit={onAddProduct}>
                  <input
                    value={newName}
                    onChange={(eventItem) => setNewName(eventItem.target.value)}
                    required
                    placeholder="Product name"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                  />
                  <input
                    value={newPrice}
                    onChange={(eventItem) => setNewPrice(eventItem.target.value)}
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                  />
                  <input
                    value={newBuyCode}
                    onChange={(eventItem) => setNewBuyCode(eventItem.target.value)}
                    required
                    placeholder="Buy code (e.g. 37)"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                  />
                  <input
                    value={newProductUrl}
                    onChange={(eventItem) => setNewProductUrl(eventItem.target.value)}
                    placeholder="Product URL (optional)"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                  />
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">
                      Product image (required)
                    </label>
                    <input
                      type="file"
                      required
                      accept="image/jpeg,image/png,image/webp"
                      className="mt-1 w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-zinc-50 file:px-3 file:py-1.5 file:text-sm"
                      onChange={(eventItem) => {
                        const f = eventItem.target.files?.[0] ?? null;
                        setNewImageFile(f);
                        eventItem.target.value = "";
                      }}
                    />
                    {newImagePreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={newImagePreviewUrl}
                        alt="Selected product"
                        className="mt-2 h-20 w-20 rounded-md border border-zinc-200 object-cover"
                      />
                    ) : null}
                  </div>
                  {addError ? (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {addError}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={addingProduct}
                    className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {addingProduct ? "Adding..." : "Create & Attach"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <aside className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Live Comments</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Temporary realtime panel while show is live.
            </p>
            <div className="mt-3 max-h-[75vh] space-y-2 overflow-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-zinc-500">No comments yet.</p>
              ) : (
                comments.map((comment) => (
                  <article key={comment.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-sm font-semibold text-zinc-800">{comment.author}</p>
                    <p className="mt-1 text-sm text-zinc-700">{comment.text || "(empty comment)"}</p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {new Date(comment.createdAt).toLocaleTimeString()}
                    </p>
                  </article>
                ))
              )}
            </div>
          </aside>
        </section>
      )}
    </>
  );
}

