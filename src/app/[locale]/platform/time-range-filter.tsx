"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Range = "24h" | "7d" | "30d" | "all";

const OPTIONS: { value: Range; label: string }[] = [
  { value: "24h", label: "Last 24h" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "Since ever" },
];

export function TimeRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active: Range = parseRange(params.get("range"));

  const setRange = (r: Range) => {
    const next = new URLSearchParams(params.toString());
    if (r === "all") next.delete("range");
    else next.set("range", r);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="inline-flex rounded-md border bg-card p-0.5 text-xs">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setRange(opt.value)}
          className={cn(
            "px-3 py-1.5 rounded-[5px] font-medium transition-colors",
            active === opt.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function parseRange(raw: string | null): Range {
  if (raw === "24h" || raw === "7d" || raw === "30d") return raw;
  return "all";
}
