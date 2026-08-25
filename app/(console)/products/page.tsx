"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useAppState } from "@/components/AppProvider";
import { ConsoleScrollPage } from "@/components/ConsoleScrollPage";
import { formatStorefrontPrice } from "@/lib/formatNpr";
import { sanitizeBuyCodeInput, validateBuyCode } from "@/lib/buyCode";
import type { Product } from "@/lib/appTypes";

type SizeDraft = { key: string; label: string; stock: string };

function newSizeDraft(label = "", stock = "1"): SizeDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    stock,
  };
}

function parseSizeDrafts(rows: SizeDraft[]): Array<{ label: string; stockQuantity: number }> {
  const seen = new Set<string>();
  const out: Array<{ label: string; stockQuantity: number }> = [];
  for (const row of rows) {
    const label = row.label.trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) {
      throw new Error(`Size "${label}" is listed more than once.`);
    }
    seen.add(key);
    const stock = Number(row.stock);
    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      throw new Error(`Enter a whole-number quantity for size ${label}.`);
    }
    out.push({ label, stockQuantity: stock });
  }
  return out;
}

export default function ProductsPage() {
  const {
    catalogProducts,
    createCatalogProduct,
    updateCatalogProduct,
    deleteCatalogProduct,
    updateCatalogProductStock,
  } = useAppState();
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [buyCode, setBuyCode] = useState("");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [hasSizes, setHasSizes] = useState(false);
  const [sizeRows, setSizeRows] = useState<SizeDraft[]>([newSizeDraft("S", "1")]);
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [stockBusyId, setStockBusyId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!imageFile) {
      if (!editingProduct) {
        setImagePreviewUrl(null);
      }
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile, editingProduct]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setBuyCode("");
    setStockQuantity("1");
    setHasSizes(false);
    setSizeRows([newSizeDraft("S", "1")]);
    setImageFile(null);
    setImagePreviewUrl(null);
    setEditingProduct(null);
    setError(null);
  };

  const openAddForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setError(null);
    setEditingProduct(product);
    setName(product.name);
    setDescription((product.description || "").trim());
    setPrice(String(product.price ?? ""));
    setBuyCode((product.buyCode || "").trim());
    setImageFile(null);
    setImagePreviewUrl(product.imageUrl ?? null);
    const variants = product.variants ?? [];
    if (variants.length > 0) {
      setHasSizes(true);
      setSizeRows(
        variants.map((v) => newSizeDraft(v.label, String(v.stockQuantity)))
      );
      setStockQuantity(
        String(variants.reduce((sum, v) => sum + v.stockQuantity, 0))
      );
    } else {
      setHasSizes(false);
      setSizeRows([newSizeDraft("S", "1")]);
      setStockQuantity(
        product.stockQuantity != null ? String(product.stockQuantity) : "1"
      );
    }
    setFormOpen(true);
  };

  const closeForm = (force = false) => {
    if (busy && !force) return;
    setFormOpen(false);
    resetForm();
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const n = name.trim();
    const buyCodeResult = validateBuyCode(buyCode);
    const code = buyCodeResult.normalized;
    const p = Number(price);
    if (!n || Number.isNaN(p)) return;
    if (!buyCodeResult.valid) {
      setError(buyCodeResult.message ?? "Enter a valid buy code.");
      return;
    }

    let variants: Array<{ label: string; stockQuantity: number }> = [];
    let stock = Number(stockQuantity);
    try {
      if (hasSizes) {
        variants = parseSizeDrafts(sizeRows);
        if (variants.length === 0) {
          setError("Add at least one size, or turn off sizes.");
          return;
        }
        stock = variants.reduce((sum, v) => sum + v.stockQuantity, 0);
      } else if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
        setError("Available quantity must be a whole number (0 or more).");
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return;
    }

    if (!editingProduct && (!imageFile || imageFile.size === 0)) {
      setError("Please choose a product photo.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (editingProduct) {
        await updateCatalogProduct(editingProduct.id, {
          name: n,
          description: description.trim(),
          price: p,
          buyCode: code,
          stockQuantity: stock,
          variants: hasSizes ? variants : [],
          imageFile,
        });
      } else {
        await createCatalogProduct({
          name: n,
          description: description.trim(),
          price: p,
          buyCode: code,
          stockQuantity: stock,
          variants: hasSizes ? variants : [],
          imageFile: imageFile!,
        });
      }
      closeForm(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ConsoleScrollPage
        header={
          <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-6">
            <h1 className="text-2xl font-semibold">Products</h1>
            <button
              type="button"
              aria-label="Add product"
              onClick={openAddForm}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-2xl font-light leading-none text-white transition hover:bg-zinc-800"
            >
              +
            </button>
          </div>
        }
      >
        {error && !formOpen ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="space-y-2">
          {catalogProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
              <p className="text-base font-medium text-zinc-800">No products yet</p>
              <p className="mt-1 text-sm text-zinc-500">Tap + to add your first product.</p>
            </div>
          ) : (
            catalogProducts.map((product) => {
              const variants = product.variants ?? [];
              const hasProductSizes = variants.length > 0;
              return (
                <article
                  key={product.id}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-lg border border-zinc-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-xs text-zinc-400">
                        No photo
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-900">{product.name}</p>
                      <p className="text-sm text-zinc-600">
                        {formatStorefrontPrice(product.price, product.currency)}
                      </p>
                      {product.buyCode ? (
                        <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-violet-700">
                          {product.buyCode}
                        </p>
                      ) : null}
                      {hasProductSizes ? (
                        <p
                          className={`mt-0.5 text-xs ${
                            variants.every((v) => v.stockQuantity <= 0)
                              ? "font-medium text-red-600"
                              : "text-zinc-500"
                          }`}
                        >
                          {variants.every((v) => v.stockQuantity <= 0)
                            ? "Sold out"
                            : `Sizes: ${variants
                                .map((v) => `${v.label}(${v.stockQuantity})`)
                                .join(" · ")}`}
                        </p>
                      ) : product.stockQuantity != null ? (
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {product.stockQuantity <= 0
                            ? "Sold out"
                            : `${product.stockQuantity} available`}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {!hasProductSizes ? (
                      <>
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
                          onChange={(event) =>
                            setStockDrafts((prev) => ({
                              ...prev,
                              [product.id]: event.target.value,
                            }))
                          }
                          className="w-16 rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-500"
                          placeholder="Qty"
                          aria-label={`Available quantity for ${product.name}`}
                        />
                        <button
                          type="button"
                          disabled={stockBusyId === product.id}
                          onClick={() => {
                            const raw = (stockDrafts[product.id] ?? "").trim();
                            const parsed =
                              raw === "" && product.stockQuantity != null
                                ? product.stockQuantity
                                : Number(raw);
                            if (
                              !Number.isFinite(parsed) ||
                              parsed < 0 ||
                              !Number.isInteger(parsed)
                            ) {
                              setError(
                                "Available quantity must be a whole number (0 or more)."
                              );
                              return;
                            }
                            setError(null);
                            setStockBusyId(product.id);
                            updateCatalogProductStock(product.id, parsed)
                              .catch((err) => {
                                const message =
                                  err instanceof Error ? err.message : String(err);
                                setError(message);
                              })
                              .finally(() => setStockBusyId(null));
                          }}
                          className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                        >
                          {stockBusyId === product.id ? "…" : "Save qty"}
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => openEditForm(product)}
                      className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${product.name}`}
                      title="Delete product"
                      onClick={() => {
                        const confirmed = window.confirm(
                          `Delete "${product.name}" from your catalog?`
                        );
                        if (!confirmed) return;
                        setError(null);
                        deleteCatalogProduct(product.id).catch((err) => {
                          const message =
                            err instanceof Error ? err.message : String(err);
                          setError(message);
                        });
                      }}
                      className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </ConsoleScrollPage>

      {formOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
            role="dialog"
            aria-labelledby="product-form-title"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="product-form-title" className="text-lg font-semibold">
                {editingProduct ? "Edit product" : "Add product"}
              </h2>
              <button
                type="button"
                onClick={() => closeForm()}
                disabled={busy}
                className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100"
              >
                Close
              </button>
            </div>

            <form className="mt-4 space-y-3" onSubmit={onSubmit}>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  placeholder="Product name"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  maxLength={4000}
                  placeholder="Materials, fit, what’s included…"
                  className="w-full resize-y rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                />
                <span className="text-xs text-zinc-500">
                  Optional — shown on the buyer product page.
                </span>
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Price (NPR)</span>
                <input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Buy code</span>
                <input
                  value={buyCode}
                  onChange={(event) =>
                    setBuyCode(sanitizeBuyCodeInput(event.target.value).toUpperCase())
                  }
                  required
                  placeholder="MOCHI or RED SHIRT"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 uppercase outline-none focus:border-zinc-500"
                />
                <span className="text-xs text-zinc-500">
                  Up to 3 words — viewers comment this to buy.
                </span>
              </label>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-zinc-900">This product has sizes</p>
                  <p className="text-xs text-zinc-500">
                    Clothes, shoes, etc. Stock is tracked per size.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={hasSizes}
                  onChange={(event) => setHasSizes(event.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300"
                  aria-label="Enable sizes"
                />
              </div>

              {hasSizes ? (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Size stock</span>
                  {sizeRows.map((row, index) => (
                    <div key={row.key} className="flex items-center gap-2">
                      <input
                        value={row.label}
                        onChange={(event) =>
                          setSizeRows((prev) =>
                            prev.map((r, i) =>
                              i === index ? { ...r, label: event.target.value } : r
                            )
                          )
                        }
                        placeholder="S / M / 42"
                        className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                      />
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={row.stock}
                        onChange={(event) =>
                          setSizeRows((prev) =>
                            prev.map((r, i) =>
                              i === index ? { ...r, stock: event.target.value } : r
                            )
                          )
                        }
                        placeholder="Qty"
                        className="w-20 rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                      />
                      <button
                        type="button"
                        disabled={sizeRows.length <= 1}
                        onClick={() =>
                          setSizeRows((prev) =>
                            prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)
                          )
                        }
                        className="rounded-md border border-zinc-200 px-2 py-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSizeRows((prev) => [...prev, newSizeDraft("", "1")])}
                    className="w-full rounded-md border border-dashed border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    + Add size
                  </button>
                </div>
              ) : (
                <label className="block space-y-1">
                  <span className="text-sm font-medium">Available quantity</span>
                  <input
                    value={stockQuantity}
                    onChange={(event) => setStockQuantity(event.target.value)}
                    required
                    type="number"
                    min="0"
                    step="1"
                    placeholder="How many in stock"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                  />
                </label>
              )}

              <div className="space-y-2">
                <span className="text-sm font-medium">
                  Photo{editingProduct ? " (optional)" : ""}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const f = event.target.files?.[0] ?? null;
                    setImageFile(f);
                    event.target.value = "";
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                  >
                    {editingProduct ? "Change photo" : "Choose photo"}
                  </button>
                  {imageFile ? (
                    <span className="truncate text-sm text-zinc-600">{imageFile.name}</span>
                  ) : editingProduct ? (
                    <span className="text-sm text-zinc-400">Keep current photo</span>
                  ) : (
                    <span className="text-sm text-zinc-400">Required</span>
                  )}
                </div>
                {imagePreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreviewUrl}
                    alt="Selected product"
                    className="h-24 w-24 rounded-md border border-zinc-200 object-cover"
                  />
                ) : null}
              </div>
              {error ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={busy || (!editingProduct && !imageFile)}
                className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {busy
                  ? "Saving..."
                  : editingProduct
                    ? "Save changes"
                    : "Add product"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
