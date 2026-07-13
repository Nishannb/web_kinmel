/** Buy codes (SKUs / live call numbers) — max 3 words; same rule for comment matching. */

export const MAX_BUY_CODE_WORDS = 3;

export function countBuyCodeWords(value: string): number {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Collapse whitespace and cap entry at {@link MAX_BUY_CODE_WORDS} words. */
export function sanitizeBuyCodeInput(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, MAX_BUY_CODE_WORDS).join(" ");
}

export function validateBuyCode(value: string): {
  valid: boolean;
  normalized: string;
  message?: string;
} {
  const normalized = sanitizeBuyCodeInput(value);
  if (!normalized) {
    return { valid: false, normalized: "", message: "Buy code is required." };
  }
  const words = countBuyCodeWords(normalized);
  if (words > MAX_BUY_CODE_WORDS) {
    return {
      valid: false,
      normalized,
      message: `Use ${MAX_BUY_CODE_WORDS} words or fewer (e.g. MOCHI or RED SHIRT).`,
    };
  }
  return { valid: true, normalized };
}

export function commentEligibleForBuyCodeMatch(comment: string): boolean {
  const words = countBuyCodeWords(comment);
  return words > 0 && words <= MAX_BUY_CODE_WORDS;
}
