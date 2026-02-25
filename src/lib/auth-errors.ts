/**
 * Maps raw Supabase auth error messages to i18n translation keys.
 * Falls back to a generic "unknown_error" for unrecognized errors.
 */

const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "invalid_credentials",
  "Email not confirmed": "email_not_confirmed",
  "User already registered": "user_already_registered",
  "Email rate limit exceeded": "email_rate_limit",
  "Password should be at least 6 characters": "weak_password",
  "Password should be at least 6 characters.": "weak_password",
};

export function translateAuthError(
  rawError: string,
  te: (key: string) => string
): string {
  const key = ERROR_MAP[rawError];
  if (key) {
    return te(key);
  }
  // If we don't recognize the error, show the generic message
  return te("unknown_error");
}
