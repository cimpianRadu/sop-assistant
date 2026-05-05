/**
 * Client-side GA4 event helpers. Safe to call from anywhere — they no-op when
 * gtag isn't loaded (dev/preview builds, ad-blocked sessions, etc.).
 *
 * Event naming follows GA4 best practice: snake_case verbs that describe a
 * user intent (not a UI element label). Use the same constant on both the
 * tracking call and the dashboard query so they match.
 */

declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "consent",
      action: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

export const GA_EVENTS = {
  /** Click on any "Start free trial" CTA — landing hero, footer, pricing band. */
  START_TRIAL_CLICK: "start_trial_click",
  /** Click on "View pricing" / "View plans" / Pricing nav link. */
  VIEW_PRICING: "view_pricing",
  /** Click on "Watch 60s demo" CTA. Fires before the demo loads. */
  WATCH_DEMO_CLICK: "watch_demo_click",
  /** Demo video reached play — fires from the <video> onPlay handler. */
  DEMO_VIDEO_PLAY: "demo_video_play",
  /** Click on "Book a demo" CTA (Calendly) — header, post-hero band, FAQ tail. */
  BOOK_DEMO_CLICK: "book_demo_click",
  /** User submitted the signup form (auth/signup page). */
  SIGNUP_SUBMIT: "signup_submit",
} as const;

export type GaEventName = (typeof GA_EVENTS)[keyof typeof GA_EVENTS];

export function trackEvent(name: GaEventName, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", name, params ?? {});
}
