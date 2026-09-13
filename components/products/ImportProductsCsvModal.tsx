"use client";

import { useMemo, useRef, useState } from "react";
import { useAppState } from "@/components/AppProvider";
import { formatStorefrontPrice } from "@/lib/formatNpr";
import { normalizeProductImageFile } from "@/lib/normalizeProductImage";
import {
  indexFolderImageFiles,
  matchFolderImage,
  parseProductCsv,
  suggestBuyCodeFromName,
  type ParsedProductCsvRow,
} from "@/lib/parseProductCsv";

type PreviewRow = ParsedProductCsvRow & {
  buyCode: string;
  imageFile: File | null;
};

type ImportProductsCsvModalProps = {
  open: boolean;
  onClose: () => void;
};

type ImportStep = "guide" | "upload";

export function ImportProductsCsvModal({ open, onClose }: ImportProductsCsvModalProps) {
  const { catalogProducts, createCatalogProduct, refreshData } = useAppState();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>("guide");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedProductCsvRow[]>([]);
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [folderLabel, setFolderLabel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [currentItem, setCurrentItem] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [importLog, setImportLog] = useState<string[]>([]);
  const [doneSummary, setDoneSummary] = useState<string | null>(null);

  const usedBuyCodes = useMemo(() => {
    const set = new Set<string>();
    for (const p of catalogProducts) {
      if (p.buyCode) set.add(p.buyCode);
    }
    return set;
  }, [catalogProducts]);

  const previewRows: PreviewRow[] = useMemo(() => {
    const index = indexFolderImageFiles(folderFiles);
    const used = new Set(usedBuyCodes);
    return parsedRows.map((row) => {
      const imageFile =
        folderFiles.length > 0
          ? matchFolderImage(row.relativeImagePath, index, row.name)
          : null;
      const buyCode = imageFile ? suggestBuyCodeFromName(row.name, used) : "";
      return { ...row, buyCode, imageFile };
    });
  }, [parsedRows, folderFiles, usedBuyCodes]);

  const validRows = previewRows.filter((r) => r.imageFile);
  const invalidRows = previewRows.filter((r) => !r.imageFile);

  const reset = () => {
    setStep("guide");
    setParseErrors([]);
    setParsedRows([]);
    setFolderFiles([]);
    setFolderLabel(null);
    setBusy(false);
    setCurrentItem(null);
    setProgress(null);
    setImportLog([]);
    setDoneSummary(null);
    if (csvInputRef.current) csvInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const onCsvSelected = async (file: File | null) => {
    // Parse only — never upload here.
    setDoneSummary(null);
    setImportLog([]);
    setProgress(null);
    setCurrentItem(null);
    if (!file) {
      setParsedRows([]);
      setParseErrors([]);
      return;
    }
    const text = await file.text();
    const parsed = parseProductCsv(text);
    setParseErrors(parsed.errors);
    setParsedRows(parsed.rows);
  };

  const onFolderSelected = (list: FileList | null) => {
    // Match only — never upload here.
    setDoneSummary(null);
    setImportLog([]);
    setCurrentItem(null);
    const files = list ? Array.from(list) : [];
    setFolderFiles(files);
    if (files.length === 0) {
      setFolderLabel(null);
      return;
    }
    const firstRel =
      (files[0] as File & { webkitRelativePath?: string }).webkitRelativePath || files[0].name;
    const top = firstRel.split(/[/\\]/)[0] || "folder";
    setFolderLabel(`${top} (${files.length} files)`);
  };

  /**
   * Upload strictly one product at a time:
   * load/convert image → create product → then next row.
   */
  const runImport = async () => {
    if (busy) return;
    const queue = validRows.filter((r) => r.imageFile);
    if (queue.length === 0) return;

    setBusy(true);
    setDoneSummary(null);
    setImportLog([]);
    setProgress({ done: 0, total: queue.length });
    setCurrentItem(null);

    let ok = 0;
    let fail = 0;
    const logs: string[] = [];
    const skipped = invalidRows.length;

    try {
      for (let i = 0; i < queue.length; i++) {
        const row = queue[i];
        setCurrentItem(`(${i + 1}/${queue.length}) ${row.name}`);
        setProgress({ done: i, total: queue.length });

        try {
          if (!row.imageFile) {
            throw new Error("Image file missing.");
          }
          // 1) Load & convert this image only
          const imageFile = await normalizeProductImageFile(row.imageFile);
          // 2) Upload + create this product only (waits until finished)
          await createCatalogProduct(
            {
              name: row.name,
              price: row.price,
              buyCode: row.buyCode,
              stockQuantity: row.stockQuantity,
              imageFile,
            },
            { skipRefresh: true }
          );
          ok += 1;
          logs.push(`✓ ${row.name}`);
        } catch (err) {
          fail += 1;
          const message = err instanceof Error ? err.message : String(err);
          logs.push(`✗ ${row.name}: ${message}`);
        }

        setImportLog([...logs]);
        setProgress({ done: i + 1, total: queue.length });
      }

      setCurrentItem("Refreshing catalog…");
      await refreshData();
      setCurrentItem(null);
      setDoneSummary(
        `Imported ${ok} product${ok === 1 ? "" : "s"}${fail ? `, ${fail} failed` : ""}${
          skipped ? `, ${skipped} skipped (no image)` : ""
        }.`
      );
    } finally {
      setBusy(false);
      setCurrentItem(null);
    }
  };

  if (!open) return null;

  if (step === "guide") {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-csv-guide-title"
          className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        >
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 id="import-csv-guide-title" className="text-lg font-semibold text-zinc-900">
              CSV import format
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Your CSV file needs to be in this format before you upload.
            </p>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div className="overflow-hidden rounded-xl border border-zinc-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50 text-zinc-700">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Product</th>
                    <th className="px-3 py-2.5 font-semibold">Stock</th>
                    <th className="px-3 py-2.5 font-semibold">Price</th>
                    <th className="px-3 py-2.5 font-semibold">Image local Path</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-600">
                  <tr className="border-t border-zinc-100">
                    <td className="px-3 py-2">ALOE SOOTHING GEL</td>
                    <td className="px-3 py-2">24</td>
                    <td className="px-3 py-2">950</td>
                    <td className="px-3 py-2">product_images/ALOE_SOOTHING_GEL.jpg</td>
                  </tr>
                  <tr className="border-t border-zinc-100 bg-zinc-50/50">
                    <td className="px-3 py-2">VITAMIN C SERUM</td>
                    <td className="px-3 py-2">10</td>
                    <td className="px-3 py-2">1500</td>
                    <td className="px-3 py-2">product_images/VITAMIN_C_SERUM.jpg</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-violet-100 bg-violet-50/80 px-4 py-3 text-sm text-violet-950">
              <p className="font-semibold">Image file names</p>
              <p className="mt-1 leading-relaxed text-violet-900/90">
                Each product image file should have the <strong>same name as the Product</strong>{" "}
                (spaces can be underscores). Example: product{" "}
                <code className="rounded bg-white/80 px-1">ALOE SOOTHING GEL</code> → image{" "}
                <code className="rounded bg-white/80 px-1">ALOE_SOOTHING_GEL.jpg</code>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-100 px-5 py-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setStep("upload")}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              I Understand, Let&apos;s Upload
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-csv-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 id="import-csv-title" className="text-lg font-semibold text-zinc-900">
              Import products from CSV
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Select your CSV and images folder first (matching only). Then click Import to upload
              products one by one.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-50"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm">
              <span className="font-medium text-zinc-800">1. CSV file</span>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                className="mt-2 block w-full text-xs text-zinc-600 file:mr-2 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                disabled={busy}
                onChange={(e) => void onCsvSelected(e.target.files?.[0] ?? null)}
              />
            </label>
            <label className="block rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm">
              <span className="font-medium text-zinc-800">2. Images folder</span>
              <p className="mt-0.5 text-xs text-zinc-500">
                Select <code className="rounded bg-white px-0.5">product_images</code> (or{" "}
                <code className="rounded bg-white px-0.5">scrape</code>). Filename should match the
                product/SKU name.
              </p>
              <input
                ref={(el) => {
                  folderInputRef.current = el;
                  if (el) {
                    el.setAttribute("webkitdirectory", "");
                    el.setAttribute("directory", "");
                  }
                }}
                type="file"
                multiple
                className="mt-2 block w-full text-xs text-zinc-600 file:mr-2 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                disabled={busy}
                onChange={(e) => onFolderSelected(e.target.files)}
              />
              {folderLabel ? (
                <p className="mt-1 text-xs font-medium text-emerald-700">Selected: {folderLabel}</p>
              ) : null}
            </label>
          </div>

          {parseErrors.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <p className="font-medium">CSV notes</p>
              <ul className="mt-1 list-inside list-disc text-xs">
                {parseErrors.slice(0, 8).map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
                {parseErrors.length > 8 ? <li>…and {parseErrors.length - 8} more</li> : null}
              </ul>
            </div>
          ) : null}

          {parsedRows.length > 0 && folderFiles.length === 0 ? (
            <p className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-900">
              CSV loaded ({parsedRows.length} products). Now select the images folder.
            </p>
          ) : null}

          {parsedRows.length > 0 && folderFiles.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-zinc-600">
                {validRows.length} with matched image · {invalidRows.length} skipped (missing
                image)
              </p>
              <div className="max-h-64 overflow-auto rounded-xl border border-zinc-200">
                <table className="min-w-full text-left text-xs">
                  <thead className="sticky top-0 bg-zinc-50 text-zinc-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Product</th>
                      <th className="px-3 py-2 font-medium">Stock</th>
                      <th className="px-3 py-2 font-medium">Price</th>
                      <th className="px-3 py-2 font-medium">Buy code</th>
                      <th className="px-3 py-2 font-medium">Image</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr
                        key={`${row.rowNumber}-${row.name}`}
                        className={`border-t border-zinc-100 ${
                          !row.imageFile ? "bg-red-50/60" : ""
                        }`}
                      >
                        <td className="max-w-[10rem] truncate px-3 py-2 font-medium text-zinc-900">
                          {row.name}
                        </td>
                        <td className="px-3 py-2 text-zinc-600">{row.stockQuantity}</td>
                        <td className="px-3 py-2 text-zinc-600">
                          {formatStorefrontPrice(row.price, "NPR")}
                        </td>
                        <td className="px-3 py-2 font-semibold uppercase text-violet-700">
                          {row.imageFile ? row.buyCode : "—"}
                        </td>
                        <td className="max-w-[14rem] px-3 py-2">
                          {row.imageFile ? (
                            <span className="text-emerald-700" title={row.imageFile.name}>
                              {row.imageFile.name}
                            </span>
                          ) : (
                            <span className="text-red-600">Missing</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {progress ? (
            <div className="space-y-1">
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full bg-violet-600 transition-all"
                  style={{
                    width: `${progress.total ? (100 * progress.done) / progress.total : 0}%`,
                  }}
                />
              </div>
              <p className="text-xs text-zinc-500">
                {busy
                  ? currentItem
                    ? `Uploading one-by-one: ${currentItem}`
                    : `Uploading ${progress.done} of ${progress.total}…`
                  : `Finished ${progress.done} of ${progress.total}`}
              </p>
            </div>
          ) : null}

          {importLog.length > 0 ? (
            <div className="max-h-32 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-[11px] text-zinc-700">
              {importLog.map((line, i) => (
                <div key={`${i}-${line}`}>{line}</div>
              ))}
            </div>
          ) : null}

          {doneSummary ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {doneSummary}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-100 px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
          >
            {doneSummary ? "Done" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => void runImport()}
            disabled={busy || validRows.length === 0 || Boolean(doneSummary)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {busy
              ? "Uploading…"
              : `Import ${validRows.length || ""} product${validRows.length === 1 ? "" : "s"} one-by-one`}
          </button>
        </div>
      </div>
    </div>
  );
}
