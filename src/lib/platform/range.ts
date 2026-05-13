/**
 * Shared time-range parsing for the /platform dashboards.
 * Used by both AI usage (filters created_at) and Accounts (filters
 * last_sign_in_at).
 */

export type Range = "24h" | "7d" | "30d" | "all";

export function parseRange(raw: string | string[] | undefined): Range {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "24h" || v === "7d" || v === "30d") return v;
  return "all";
}

export function rangeLabel(r: Range): string {
  switch (r) {
    case "24h":
      return "last 24h";
    case "7d":
      return "last 7 days";
    case "30d":
      return "last 30 days";
    case "all":
      return "all time";
  }
}

/**
 * Returns the lower-bound ISO timestamp for a range, or null for "all".
 * Caller supplies `now` so server components stay deterministic-ish.
 */
export function rangeSinceIso(r: Range, nowMs: number): string | null {
  switch (r) {
    case "24h":
      return new Date(nowMs - 24 * 60 * 60 * 1000).toISOString();
    case "7d":
      return new Date(nowMs - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "30d":
      return new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString();
    case "all":
      return null;
  }
}
