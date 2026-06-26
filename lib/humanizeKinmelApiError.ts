/**
 * Maps noisy proxy / fetch failures to copy suited for sellers on the live workspace.
 */
export function humanizeKinmelApiError(message: string): string {
  const m = message.trim();
  if (!m) return m;

  if (
    m.includes("Cannot reach Kinmel API") ||
    m.includes("backend_unreachable") ||
    (m.includes("NetworkError") &&
      /timeout|aborted|fetch failed/i.test(m)) ||
    /^fetch failed/i.test(m)
  ) {
    return "The stream is disconnected.";
  }

  return m;
}
