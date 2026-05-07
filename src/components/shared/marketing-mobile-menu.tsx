"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Calendar, LogIn, MenuIcon, PlayCircle, Tag, Newspaper, ArrowRight, Home as HomeIcon } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";
import { trackEvent, GA_EVENTS } from "@/lib/analytics/events";
import { CALENDLY_DEMO_URL } from "@/lib/external-links";

type Source = string;

export function MarketingMobileMenu({ source = "mobile_menu" }: { source?: Source }) {
  const tc = useTranslations("Common");
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  const internalLinks: Array<{
    href: "/" | "/blog" | "/pricing" | "/demo" | "/auth/login";
    label: string;
    Icon: typeof HomeIcon;
    event?: keyof typeof GA_EVENTS;
  }> = [
    { href: "/", label: tc("home"), Icon: HomeIcon },
    { href: "/blog", label: tc("blog"), Icon: Newspaper },
    { href: "/pricing", label: tc("pricing"), Icon: Tag, event: "VIEW_PRICING" },
    { href: "/demo", label: tc("watchDemo"), Icon: PlayCircle, event: "WATCH_DEMO_CLICK" },
    { href: "/auth/login", label: tc("logIn"), Icon: LogIn },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden h-9 w-9"
          aria-label={tc("menu")}
        >
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-xs gap-0 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-1.5 font-semibold text-base">
            <Logo />
            {tc("appName")}
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="flex flex-col">
            {internalLinks.map(({ href, label, Icon, event }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => {
                    if (event) {
                      trackEvent(GA_EVENTS[event], { source });
                    }
                    close();
                  }}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground/90 hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Icon className="size-4 text-muted-foreground" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t p-4 space-y-2">
          <a
            href={CALENDLY_DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent(GA_EVENTS.BOOK_DEMO_CLICK, { source });
              close();
            }}
          >
            <Button variant="outline" className="w-full gap-2">
              <Calendar className="size-4" />
              {tc("bookDemo")}
            </Button>
          </a>
          <Link
            href="/auth/signup"
            onClick={() => {
              trackEvent(GA_EVENTS.START_TRIAL_CLICK, { source });
              close();
            }}
          >
            <Button className="w-full gap-2">
              {tc("startFreeTrial")}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
