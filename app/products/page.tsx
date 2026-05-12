"use client";

import { FormEvent, useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { useAppState } from "@/components/AppProvider";

export default function ProductsPage() {
  const { catalogProducts, createCatalogProduct, deleteCatalogProduct } = useAppState();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const n = name.trim();
    const p = Number(price);
    if (!n || Number.isNaN(p)) return;
    if (!imageFile || imageFile.size === 0) {
      setError("Please choose a product image (JPEG, PNG, or WebP).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createCatalogProduct({
        name: n,
        price: p,
        imageFile,
      });
      setName("");
      setPrice("");
      setImageFile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <RequireAuth>
      <section className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Manage reusable product catalog. These can be attached to events.             A product photo is required for each item. Images are uploaded to Cloudflare R2 and
            the public URL is stored in Supabase.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Add Product</h2>
            <form className="mt-4 space-y-3" onSubmit={onSubmit}>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Product name"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
              />
              <input
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="Price"
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
                  onChange={(event) => {
                    const f = event.target.files?.[0] ?? null;
                    setImageFile(f);
                    event.target.value = "";
                  }}
                />
                {imagePreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreviewUrl}
                    alt="Selected product"
                    className="mt-2 h-24 w-24 rounded-md border border-zinc-200 object-cover"
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
                disabled={busy}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {busy ? "Saving..." : "Save Product"}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Product List</h2>
            <div className="mt-4 space-y-2">
              {catalogProducts.length === 0 ? (
                <p className="text-sm text-zinc-600">No products yet.</p>
              ) : (
                catalogProducts.map((product) => (
                  <article
                    key={product.id}
                    className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{product.name}</p>
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
                        className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        🗑
                      </button>
                    </div>
                    <p className="text-zinc-600">
                      {product.currency} {product.price.toFixed(2)}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </RequireAuth>
  );
}
