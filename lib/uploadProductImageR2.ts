import { backendRequestHeaders } from "@/lib/backendFetch";
import { getBackendHttpBase } from "@/lib/publicConfig";
import { getSafeSession } from "@/lib/supabaseAuth";
import type { SupabaseClient } from "@supabase/supabase-js";

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Upload a product image to Cloudflare R2 via Kinmel Flask backend.
 */
export async function uploadProductImageToR2(
  supabase: SupabaseClient,
  businessId: string,
  file: File
): Promise<string> {
  const session = await getSafeSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error("You must be signed in to upload images.");
  }
  const contentType = file.type || "image/jpeg";
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(contentType)) {
    throw new Error("Please choose a JPEG, PNG, or WebP image.");
  }
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const max = 6 * 1024 * 1024;
  if (bytes.byteLength > max) {
    throw new Error("Image must be 6 MB or smaller.");
  }
  const imageBase64 = uint8ArrayToBase64(bytes);
  const url = `${getBackendHttpBase()}/storage/upload-product-image`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...backendRequestHeaders({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }),
    },
    body: JSON.stringify({
      businessId,
      imageBase64,
      contentType,
    }),
  });
  const raw = await res.text();
  let parsed: { publicUrl?: string; error?: string; detail?: string };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    throw new Error(raw.slice(0, 200) || `Upload failed (${res.status})`);
  }
  if (!res.ok || !parsed.publicUrl) {
    throw new Error(
      parsed.error || parsed.detail || `Upload failed (${res.status})`
    );
  }
  return parsed.publicUrl;
}
