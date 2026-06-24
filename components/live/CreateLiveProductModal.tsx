"use client";

import { FormEvent, useEffect, useState } from "react";

type Props = {
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    price: number;
    buyCode: string;
    stockQuantity: number;
    imageFile: File;
  }) => Promise<void>;
};

const inputClass =
  "w-full rounded-xl border border-violet-100 bg-violet-50/20 px-3 py-2.5 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100";

export function CreateLiveProductModal({
  open,
  busy,
  error,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [buyCode, setBuyCode] = useState("");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setPrice("");
      setBuyCode("");
      setStockQuantity("1");
      setImageFile(null);
      setLocalError(null);
    }
  }, [open]);

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

  if (!open) return null;

  const onFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedPrice = Number(price);
    if (!name.trim() || Number.isNaN(parsedPrice)) {
      setLocalError("Name and price are required.");
      return;
    }
    if (!buyCode.trim()) {
      setLocalError("Buy code is required.");
      return;
    }
    const parsedStock = Number(stockQuantity);
    if (!Number.isFinite(parsedStock) || parsedStock < 0 || !Number.isInteger(parsedStock)) {
      setLocalError("Available quantity must be a whole number (0 or more).");
      return;
    }
    if (/\s/.test(buyCode.trim())) {
      setLocalError("Buy code must be a single word with no spaces.");
      return;
    }
    if (!imageFile || imageFile.size === 0) {
      setLocalError("Please choose a product image (JPEG, PNG, or WebP).");
      return;
    }
    setLocalError(null);
    await onSubmit({
      name: name.trim(),
      price: parsedPrice,
      buyCode: buyCode.trim(),
      stockQuantity: parsedStock,
      imageFile,
    });
  };

  const displayError = localError ?? error;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-violet-100 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-live-product-title"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="create-live-product-title" className="text-lg font-bold text-zinc-900">
            New product
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 transition hover:bg-violet-50 disabled:opacity-60"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Product link is created automatically after you save.
        </p>
        <form className="mt-4 space-y-3" onSubmit={onFormSubmit}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="Product name"
            className={inputClass}
          />
          <input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="Price"
            className={inputClass}
          />
          <input
            value={buyCode}
            onChange={(event) => setBuyCode(event.target.value)}
            required
            placeholder="Buy code (e.g. RED50)"
            className={inputClass}
          />
          <input
            value={stockQuantity}
            onChange={(event) => setStockQuantity(event.target.value)}
            required
            type="number"
            min="0"
            step="1"
            placeholder="Available quantity"
            className={inputClass}
          />
          <div>
            <label className="block text-xs font-medium text-zinc-600">
              Product image (required)
            </label>
            <input
              type="file"
              required
              accept="image/jpeg,image/png,image/webp"
              className="mt-1 w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border file:border-violet-200 file:bg-violet-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-violet-800"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setImageFile(file);
                event.target.value = "";
              }}
            />
            {imagePreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreviewUrl}
                alt="Selected product"
                className="mt-2 h-20 w-20 rounded-xl border border-violet-100 object-cover"
              />
            ) : null}
          </div>
          {displayError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {displayError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-xl border border-violet-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-violet-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {busy ? "Creating..." : "Create product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
