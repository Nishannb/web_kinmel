/**
 * Convert any browser-decodable image (incl. AVIF mislabeled as .jpg) to JPEG for R2 upload.
 */
export async function normalizeProductImageFile(file: File): Promise<File> {
  const type = (file.type || "").toLowerCase();
  if (type === "image/jpeg" || type === "image/jpg") {
    // Still re-encode if the extension lies (many scrape files are AVIF named .jpg).
    // Cheap size check: try decode; if it fails, throw a clear error.
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Fallback via HTMLImageElement for some formats.
    bitmap = await decodeViaImageElement(file);
  }

  try {
    const maxEdge = 1600;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not prepare image for upload.");
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Could not encode JPEG."))),
        "image/jpeg",
        0.9
      );
    });

    const base = file.name.replace(/\.[^.]+$/, "") || "product";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}

async function decodeViaImageElement(file: File): Promise<ImageBitmap> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Browser could not decode this image."));
      el.src = url;
    });
    return await createImageBitmap(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}
