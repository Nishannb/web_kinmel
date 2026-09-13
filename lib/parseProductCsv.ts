/** Parse product catalog CSV and match images from a user-selected folder. */

export type ParsedProductCsvRow = {
  rowNumber: number;
  name: string;
  stockQuantity: number;
  price: number;
  /** Relative path from CSV, e.g. `product_images/FOO.jpg`. */
  relativeImagePath: string;
};

export type ParseProductCsvResult = {
  rows: ParsedProductCsvRow[];
  errors: string[];
};

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      cells.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").replace(/[^\d.-]/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function parseStock(raw: string): number {
  const t = raw.trim();
  if (!t || t === "-" || t.toLowerCase() === "n/a") return 0;
  const cleaned = t.replace(/,/g, "").replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function findColumnIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const want = normalizeHeader(alias);
    const exact = normalized.findIndex((h) => h === want);
    if (exact >= 0) return exact;
  }
  for (const alias of aliases) {
    const want = normalizeHeader(alias);
    const soft = normalized.findIndex(
      (h) => h.includes(want) && !(want === "product" && h.includes("image"))
    );
    if (soft >= 0) return soft;
  }
  return -1;
}

/** Normalize CSV image cell into a relative path like `product_images/FOO.jpg`. */
export function normalizeRelativeImagePath(raw: string): string {
  let trimmed = raw.trim().replace(/\\/g, "/");
  if (!trimmed) return "";
  // Strip accidental absolute Mac paths if pasted into CSV.
  const absMarker = "/scrape/";
  const absIdx = trimmed.toLowerCase().indexOf(absMarker);
  if (absIdx >= 0) {
    trimmed = trimmed.slice(absIdx + absMarker.length);
  }
  return trimmed.replace(/^\/+/, "");
}

function looksLikeImagePath(value: string): boolean {
  const v = value.trim().replace(/\\/g, "/").toLowerCase();
  return (
    v.includes("product_images/") ||
    /\.(jpe?g|png|webp)$/i.test(v) ||
    v.includes("/scrape/")
  );
}

function findImagePathInRow(cells: string[], imageIdx: number): string {
  if (imageIdx >= 0) {
    const fromCol = (cells[imageIdx] ?? "").trim();
    if (fromCol) return fromCol;
  }
  for (const cell of cells) {
    if (looksLikeImagePath(cell)) return cell.trim();
  }
  return "";
}

/** Suggest a ≤3-word buy code from a product name; ensure uniqueness in `used`. */
export function suggestBuyCodeFromName(name: string, used: Set<string>): string {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9%]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3);
  let base = words.join(" ") || "ITEM";
  if (base.length > 40) {
    base = words
      .map((w) => w.slice(0, 12))
      .join(" ")
      .trim();
  }
  let candidate = base;
  let n = 2;
  const usedLower = new Set([...used].map((u) => u.toLowerCase()));
  while (usedLower.has(candidate.toLowerCase())) {
    const suffix = String(n);
    if (words.length < 3) {
      candidate = `${base} ${suffix}`.trim();
    } else {
      const trimmedWords = words.slice(0, 2);
      candidate = `${trimmedWords.join(" ") || "ITEM"} ${suffix}`.trim();
    }
    n += 1;
    if (n > 9999) {
      candidate = `ITEM ${Date.now().toString(36).toUpperCase()}`;
      break;
    }
  }
  used.add(candidate);
  return candidate;
}

export function parseProductCsv(text: string): ParseProductCsvResult {
  const errors: string[] = [];
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { rows: [], errors: ["CSV file is empty."] };
  }

  const headerCells = splitCsvLine(lines[0]);
  const nameIdx = findColumnIndex(headerCells, [
    "product",
    "product name",
    "name",
    "description of goods",
  ]);
  const stockIdx = findColumnIndex(headerCells, [
    "available stock",
    "stock",
    "quantity",
    "qty",
  ]);
  const priceIdx = findColumnIndex(headerCells, [
    "consumer price per unit",
    "consumer price",
    "price",
    "unit price",
  ]);
  let imageIdx = findColumnIndex(headerCells, [
    "image local path",
    "image path",
    "image",
    "photo",
  ]);

  if (imageIdx < 0) {
    for (let i = 1; i < Math.min(lines.length, 15); i++) {
      const cells = splitCsvLine(lines[i]);
      const hit = cells.findIndex((c) => looksLikeImagePath(c));
      if (hit >= 0) {
        imageIdx = hit;
        break;
      }
    }
  }

  if (nameIdx < 0 || priceIdx < 0) {
    return {
      rows: [],
      errors: [
        'CSV must include "PRODUCT" and "CONSUMER PRICE PER UNIT" columns (or Name / Price).',
      ],
    };
  }

  const rows: ParsedProductCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const cells = splitCsvLine(lines[i]);
    const name = (cells[nameIdx] ?? "").trim();
    if (!name) {
      errors.push(`Row ${rowNumber}: missing product name — skipped.`);
      continue;
    }
    const priceRaw = cells[priceIdx] ?? "";
    const price = parsePrice(priceRaw);
    if (price == null) {
      errors.push(`Row ${rowNumber} (${name}): invalid price "${priceRaw}" — skipped.`);
      continue;
    }
    const stockRaw = stockIdx >= 0 ? (cells[stockIdx] ?? "") : "0";
    const stockQuantity = parseStock(stockRaw);
    const rawImagePath = findImagePathInRow(cells, imageIdx);
    const relativeImagePath = normalizeRelativeImagePath(rawImagePath);
    // Image path optional when folder files are matched by product/SKU name.
    rows.push({
      rowNumber,
      name,
      stockQuantity,
      price,
      relativeImagePath,
    });
  }

  return { rows, errors };
}

function stripExt(name: string): string {
  return name.replace(/\.(jpe?g|png|webp|gif|heic|avif)$/i, "");
}

/** Normalize product / file names for SKU matching. */
export function normalizeSkuKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function addIndexKey(map: Map<string, File[]>, key: string, file: File) {
  const k = normalizeSkuKey(key);
  if (!k) return;
  const list = map.get(k) ?? [];
  if (!list.includes(file)) list.push(file);
  map.set(k, list);
}

/**
 * Index files from a folder picker (`webkitdirectory`).
 * Keys: relative path, basename, basename without extension (SKU-style).
 */
export function indexFolderImageFiles(files: File[]): Map<string, File[]> {
  const map = new Map<string, File[]>();
  for (const file of files) {
    const nameOk =
      file.type.startsWith("image/") ||
      /\.(jpe?g|png|webp|gif|heic|avif)$/i.test(file.name);
    if (!nameOk) continue;

    const relative =
      (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const norm = relative.replace(/\\/g, "/").replace(/^\/+/, "");
    addIndexKey(map, norm, file);
    addIndexKey(map, file.name, file);
    addIndexKey(map, stripExt(file.name), file);

    const parts = norm.split("/").filter(Boolean);
    if (parts.length >= 2) {
      addIndexKey(map, parts.slice(1).join("/"), file);
      addIndexKey(map, stripExt(parts.slice(1).join("/")), file);
    }
    if (parts.length >= 3) {
      addIndexKey(map, parts.slice(2).join("/"), file);
    }
    if (parts.length === 1) {
      addIndexKey(map, `product_images/${parts[0]}`, file);
      addIndexKey(map, `product_images/${stripExt(parts[0])}`, file);
    }
  }
  return map;
}

function pickUnique(files: File[] | undefined): File | null {
  if (!files || files.length === 0) return null;
  return files[0];
}

/**
 * Match a product to an image in the selected folder.
 * Prefers product/SKU name → filename, then CSV relative path.
 */
export function matchFolderImage(
  relativeImagePath: string,
  index: Map<string, File[]>,
  productName?: string
): File | null {
  const nameKeys = productName
    ? [normalizeSkuKey(productName), normalizeSkuKey(stripExt(productName))]
    : [];
  const pathKeys = [
    normalizeSkuKey(relativeImagePath),
    normalizeSkuKey(stripExt(relativeImagePath)),
    normalizeSkuKey(relativeImagePath.split("/").pop() || ""),
    normalizeSkuKey(stripExt(relativeImagePath.split("/").pop() || "")),
  ].filter(Boolean);

  for (const key of [...nameKeys, ...pathKeys]) {
    const hit = pickUnique(index.get(key));
    if (hit) return hit;
  }

  // Prefix match on SKU basename (truncated CSV paths / long filenames).
  const bases = [...nameKeys, ...pathKeys].filter((k) => k.length >= 4);
  for (const base of bases) {
    const prefixHits: File[] = [];
    for (const [key, files] of index) {
      const keyBase = key.split("/").pop() || key;
      if (keyBase.startsWith(base) || base.startsWith(keyBase)) {
        for (const f of files) {
          if (!prefixHits.includes(f)) prefixHits.push(f);
        }
      }
    }
    if (prefixHits.length === 1) return prefixHits[0];
  }

  return null;
}
