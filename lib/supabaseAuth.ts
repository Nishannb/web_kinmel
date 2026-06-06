import type { AuthError, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function isRecoverableAuthError(
  error: { message?: string; code?: string } | null | undefined
): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();
  return (
    msg.includes("refresh token") ||
    msg.includes("invalid jwt") ||
    msg.includes("session not found") ||
    code === "refresh_token_not_found"
  );
}

/** Clears a broken local session without calling the auth server. */
export async function clearStaleAuthSession(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    /* best-effort */
  }
}

/**
 * Returns the current session, or null when tokens are missing or invalid.
 * Invalid refresh tokens are cleared locally so the app can show login again.
 */
export async function getSafeSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      if (isRecoverableAuthError(error)) {
        await clearStaleAuthSession();
        return null;
      }
      throw error;
    }
    return data.session;
  } catch (err) {
    if (isRecoverableAuthError(err as AuthError)) {
      await clearStaleAuthSession();
      return null;
    }
    throw err;
  }
}
