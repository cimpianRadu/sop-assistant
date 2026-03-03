"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "lucide-react";

const languages = [
  { code: "ro", label: "Romana", flag: "\u{1F1F7}\u{1F1F4}" },
  { code: "en", label: "English", flag: "\u{1F1EC}\u{1F1E7}" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = languages.find((l) => l.code === locale) || languages[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(code: string) {
    setOpen(false);
    if (code !== locale) {
      router.replace(pathname, { locale: code });
    }
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1.5 text-xs font-medium"
      >
        <span className="text-base leading-none">{current.flag}</span>
        {current.code.toUpperCase()}
        <ChevronDownIcon className="h-3 w-3 opacity-50" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-md border bg-popover p-1 shadow-md">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-sm transition-colors ${
                lang.code === locale
                  ? "bg-accent font-medium text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
