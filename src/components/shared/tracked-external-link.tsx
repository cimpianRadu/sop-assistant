"use client";

import { trackEvent, type GaEventName } from "@/lib/analytics/events";
import type { AnchorHTMLAttributes, MouseEvent } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  event: GaEventName;
  eventParams?: Record<string, unknown>;
};

/**
 * <a> for off-site URLs (Calendly, etc.) that fires a GA4 event on click.
 * Always opens in a new tab and uses noopener for security.
 */
export function TrackedExternalLink({
  event,
  eventParams,
  onClick,
  children,
  target = "_blank",
  rel = "noopener noreferrer",
  ...rest
}: Props) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    trackEvent(event, eventParams);
    onClick?.(e);
  }

  return (
    <a {...rest} target={target} rel={rel} onClick={handleClick}>
      {children}
    </a>
  );
}
