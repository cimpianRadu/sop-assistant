/**
 * Simple in-memory rate limiter keyed by user ID.
 *
 * Uses a sliding-window counter: each window is `windowMs` long and we track
 * the number of requests made in the current window. The window resets after
 * `windowMs` milliseconds of the first request.
 *
 * NOTE: This is per-process — it resets on deploy/restart and does not share
 * state across serverless instances. Fine for an MVP; swap for Redis later.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimiterOptions {
  /** Maximum number of requests allowed in the window. */
  maxRequests: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor({ maxRequests, windowMs }: RateLimiterOptions) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check whether `key` (typically a user ID) is allowed to make a request.
   *
   * @returns `{ allowed: true }` or `{ allowed: false, retryAfterMs }`.
   */
  check(key: string): { allowed: true } | { allowed: false; retryAfterMs: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    // No entry or window expired — start a new window.
    if (!entry || now >= entry.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + this.windowMs });
      return { allowed: true };
    }

    // Within the window — check the counter.
    if (entry.count < this.maxRequests) {
      entry.count += 1;
      return { allowed: true };
    }

    // Limit exceeded.
    return { allowed: false, retryAfterMs: entry.resetTime - now };
  }

  /**
   * Periodically clean up expired entries to avoid unbounded memory growth.
   * Call this on a timer if you want, or leave it — stale entries are harmless
   * and get overwritten on the next request from the same key.
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now >= entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Pre-configured limiters for each AI route
// ---------------------------------------------------------------------------

/** /api/generate-sop — 10 req / min */
export const generateSopLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60_000,
});

/** /api/operator-help — 30 req / min */
export const operatorHelpLimiter = new RateLimiter({
  maxRequests: 30,
  windowMs: 60_000,
});

/** /api/chat — 60 req / min */
export const chatLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60_000,
});

// ---------------------------------------------------------------------------
// Helper to build a 429 Response
// ---------------------------------------------------------------------------

export function rateLimitResponse(retryAfterMs: number): Response {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again shortly.",
      retryAfterSeconds: retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    },
  );
}
