/**
 * Format a duration between two timestamps into a human-readable string.
 *
 * Examples:
 *   45 minutes  →  "45m"
 *   2h 15m      →  "2h 15m"
 *   26 days     →  "26d"
 *   3d 4h       →  "3d 4h"
 *
 * Returns null if `completedAt` is null (execution still in progress).
 */
export function formatDuration(
  startedAt: string,
  completedAt: string | null
): string | null {
  if (!completedAt) return null;
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 0) return null;

  const totalMinutes = Math.floor(ms / 60000);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${minutes}m`;
}

/**
 * Render a date as a relative time in plain English/Romanian-ish format.
 * Examples: "2m ago", "3h ago", "5d ago", "Apr 19"
 */
export function formatRelativeTime(
  date: string | Date,
  locale: string = "en"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  const agoEn = "ago";
  const agoRo = "in urma";
  const ago = locale.startsWith("ro") ? agoRo : agoEn;

  if (diffMin < 1) return locale.startsWith("ro") ? "acum" : "just now";
  if (diffMin < 60) return `${diffMin}m ${ago}`;
  if (diffHr < 24) return `${diffHr}h ${ago}`;
  if (diffDay < 30) return `${diffDay}d ${ago}`;

  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}
