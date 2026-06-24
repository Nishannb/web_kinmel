"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useAppState } from "@/components/AppProvider";
import { ConsoleScrollPage } from "@/components/ConsoleScrollPage";
import { formatStorefrontPrice } from "@/lib/formatNpr";

export default function ProductsPage() {
  const { catalogProducts, createCatalogProduct, deleteCatalogProduct, updateCatalogProductStock } =
    useAppState();
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [buyCode, setBuyCode] = useState("");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [stockBusyId, setStockBusyId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  const resetForm = () => {
    setName("");
    setPrice("");
    setBuyCode("");
    setStockQuantity("1");
    setImageFile(null);
    setError(null);
  };

  const closeForm = (force = false) => {
    if (busy && !force) return;
    setFormOpen(false);
    resetForm();
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const n = name.trim();
    const code = buyCode.trim();
    const p = Number(price);
    const stock = Number(stockQuantity);
    if (!n || !code || Number.isNaN(p)) return;
    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      setError("Available quantity must be a whole number (0 or more).");
      return;
    }
    if (/\s/.test(code)) {
      setError("Buy code must be a single word with no spaces.");
      return;
    }
    if (!imageFile || imageFile.size === 0) {
      setError("Please choose a product photo.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createCatalogProduct({
        name: n,
        price: p,
        buyCode: code,
        stockQuantity: stock,
        imageFile,
      });
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
              onClick={() => {
                resetForm();
                setFormOpen(true);
              }}
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
          catalogProducts.map((product) => (
            <article
              key={product.id}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3"
            >
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
                {product.stockQuantity != null ? (
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {product.stockQuantity <= 0 ? "Sold out" : `${product.stockQuantity} available`}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={
                    stockDrafts[product.id] ??
                    (product.stockQuantity != null ? String(product.stockQuantity) : "")
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
                    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
                      setError("Available quantity must be a whole number (0 or more).");
                      return;
                    }
                    setError(null);
                    setStockBusyId(product.id);
                    updateCatalogProductStock(product.id, parsed)
                      .catch((err) => {
                        const message = err instanceof Error ? err.message : String(err);
                        setError(message);
                      })
                      .finally(() => setStockBusyId(null));
                  }}
                  className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                >
                  {stockBusyId === product.id ? "…" : "Save"}
                </button>
              </div>
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
                    const message = err instanceof Error ? err.message : String(err);
                    setError(message);
                  });
                }}
                className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </article>
          ))
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
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
            role="dialog"
            aria-labelledby="add-product-title"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="add-product-title" className="text-lg font-semibold">
                Add product
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
                    setBuyCode(event.target.value.replace(/\s/g, "").toUpperCase())
                  }
                  required
                  placeholder="MOCHI"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 uppercase outline-none focus:border-zinc-500"
                />
                <span className="text-xs text-zinc-500">
                  Shown on overlay — viewers comment this to buy.
                </span>
              </label>
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
              <div className="space-y-2">
                <span className="text-sm font-medium">Photo</span>
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
                    Choose photo
                  </button>
                  {imageFile ? (
                    <span className="truncate text-sm text-zinc-600">{imageFile.name}</span>
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
                disabled={busy || !imageFile}
                className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {busy ? "Saving..." : "Add product"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
