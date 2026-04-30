import "server-only";

/**
 * Comma-separated allowlist of emails that can access the founder /insights
 * dashboard. Reads from FOUNDER_EMAILS env var. Returns empty list if unset.
 */
function founderEmails(): string[] {
  const raw = process.env.FOUNDER_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = founderEmails();
  if (allow.length === 0) return false;
  return allow.includes(email.toLowerCase());
}
