/**
 * Heuristics for flagging signup-form spam / bot accounts in /platform/accounts.
 * Anything flagged is shown to the platform admin for manual review + bulk
 * delete — never auto-deleted.
 */

export type SuspicionFlag =
  | "random_email_localpart"
  | "disposable_email_domain"
  | "random_name"
  | "no_space_in_name"
  | "name_email_mismatch"
  | "all_consonants_name"
  | "very_short_name";

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "throwawaymail.com",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "sharklasers.com",
  "maildrop.cc",
  "fakeinbox.com",
  "tempinbox.com",
  "mintemail.com",
]);

/**
 * Score how "random" a string looks. Returns 0–1: higher = more suspicious.
 * Heuristic: high consonant runs + low vowel ratio + mixed digits + alphanumeric
 * sequences are typical signals of bot-generated identifiers.
 */
function randomnessScore(s: string): number {
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (clean.length < 4) return 0;

  const vowels = (clean.match(/[aeiouy]/g) ?? []).length;
  const letters = (clean.match(/[a-z]/g) ?? []).length;
  const digits = (clean.match(/[0-9]/g) ?? []).length;

  const vowelRatio = letters > 0 ? vowels / letters : 1;
  const digitRatio = digits / clean.length;

  let longestConsonantRun = 0;
  let run = 0;
  for (const ch of clean) {
    if (/[bcdfghjklmnpqrstvwxz]/.test(ch)) {
      run += 1;
      longestConsonantRun = Math.max(longestConsonantRun, run);
    } else {
      run = 0;
    }
  }

  let score = 0;
  if (vowelRatio < 0.2 && letters > 4) score += 0.4;
  if (longestConsonantRun >= 5) score += 0.3;
  if (digitRatio > 0.3 && clean.length >= 8) score += 0.2;
  // Long all-alphanumeric local-parts with no separator
  if (clean.length >= 10 && !/[._-]/.test(s)) score += 0.2;
  return Math.min(1, score);
}

export function flagsFor(
  email: string,
  fullName: string | null
): SuspicionFlag[] {
  const flags: SuspicionFlag[] = [];
  const [local, domain] = email.split("@");

  if (domain && DISPOSABLE_DOMAINS.has(domain.toLowerCase())) {
    flags.push("disposable_email_domain");
  }

  if (local && randomnessScore(local) >= 0.5) {
    flags.push("random_email_localpart");
  }

  const name = (fullName ?? "").trim();
  if (name) {
    if (name.length < 3) flags.push("very_short_name");
    if (randomnessScore(name) >= 0.5) flags.push("random_name");
    if (!name.includes(" ") && name.length >= 6) flags.push("no_space_in_name");
    // Name with no vowels at all (e.g. "Xkdf Mzzz")
    if (!/[aeiouy]/i.test(name.replace(/\s+/g, ""))) {
      flags.push("all_consonants_name");
    }
    // Local-part is a recognisable form of the name? if NOT, weak signal.
    if (local && local.length >= 4 && name.length >= 4) {
      const localClean = local.toLowerCase().replace(/[^a-z]/g, "");
      const nameClean = name.toLowerCase().replace(/[^a-z]/g, "");
      const firstTwo = nameClean.slice(0, 2);
      const overlap =
        localClean.includes(nameClean.slice(0, 4)) ||
        nameClean.includes(localClean.slice(0, 4)) ||
        (firstTwo.length === 2 && localClean.startsWith(firstTwo));
      if (!overlap && flags.length > 0) {
        flags.push("name_email_mismatch");
      }
    }
  }

  return flags;
}

export const FLAG_LABELS: Record<SuspicionFlag, string> = {
  random_email_localpart: "Random-looking email",
  disposable_email_domain: "Disposable email domain",
  random_name: "Random-looking name",
  no_space_in_name: "Name has no space",
  name_email_mismatch: "Name doesn't match email",
  all_consonants_name: "Name has no vowels",
  very_short_name: "Very short name",
};
