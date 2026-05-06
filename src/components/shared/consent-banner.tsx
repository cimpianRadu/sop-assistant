"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const STORAGE_KEY = "sopia-consent-v1";

type ConsentChoice = "all" | "essential";

function applyConsent(choice: ConsentChoice) {
  if (typeof window === "undefined") return;
  const granted = choice === "all" ? "granted" : "denied";
  window.gtag?.("consent", "update", {
    ad_storage: granted,
    ad_user_data: granted,
    ad_personalization: granted,
    analytics_storage: granted,
  });
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ choice, ts: Date.now() }),
    );
  } catch {
    // localStorage unavailable — choice won't persist, banner re-shows next visit
  }
}

export function ConsentBanner() {
  const t = useTranslations("Consent");
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const handle = (choice: ConsentChoice) => {
    applyConsent(choice);
    setShow(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("ariaLabel")}
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-lg border bg-background/95 backdrop-blur-sm shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
          {t("body")}{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {t("privacyLink")}
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handle("essential")}
          >
            {t("reject")}
          </Button>
          <Button size="sm" onClick={() => handle("all")}>
            {t("accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
