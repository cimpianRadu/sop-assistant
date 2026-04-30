"use client";

import { Link } from "@/i18n/navigation";
import { trackEvent, type GaEventName } from "@/lib/analytics/events";
import type { ComponentProps, MouseEvent } from "react";

type Props = ComponentProps<typeof Link> & {
  event: GaEventName;
  eventParams?: Record<string, unknown>;
};

/**
 * Localized <Link> that fires a GA4 event on click. Use it whenever a click
 * should show up in the funnel dashboard. Wraps next-intl's Link so locale
 * routing keeps working.
 */
export function TrackedLink({
  event,
  eventParams,
  onClick,
  children,
  ...rest
}: Props) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    trackEvent(event, eventParams);
    onClick?.(e);
  }

  return (
    <Link {...rest} onClick={handleClick}>
      {children}
    </Link>
  );
}
