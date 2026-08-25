/** Shared phone → Supabase email mapping (mobile + web). */

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").trim();
}

export function phoneToEmail(phone: string): string {
  const normalized = normalizePhone(phone).replace("+", "");
  return `u_${normalized}@kinmel.app`;
}
