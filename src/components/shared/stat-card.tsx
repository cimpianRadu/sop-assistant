import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: "neutral" | "positive" | "warning" | "danger";
  icon?: LucideIcon;
  tone?: "default" | "primary" | "danger";
};

export function StatCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  icon: Icon,
  tone = "default",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border px-3 sm:px-4 py-3 transition-all hover:shadow-sm",
        tone === "danger" &&
          "border-destructive/25 bg-gradient-to-br from-destructive/[0.06] via-card to-card",
        tone === "primary" &&
          "border-primary/25 bg-gradient-to-br from-primary/[0.06] via-card to-card",
        tone === "default" &&
          "bg-gradient-to-br from-muted/40 via-card to-card"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "text-[11px] font-medium text-muted-foreground uppercase tracking-wide leading-tight",
            tone === "danger" && "text-destructive/80"
          )}
        >
          {label}
        </p>
        {Icon && (
          <div
            className={cn(
              "size-6 rounded-md grid place-items-center shrink-0 ring-1",
              tone === "danger" &&
                "bg-destructive/10 text-destructive ring-destructive/20",
              tone === "primary" &&
                "bg-primary/10 text-primary ring-primary/20",
              tone === "default" &&
                "bg-muted text-muted-foreground ring-border/60"
            )}
          >
            <Icon className="size-3.5" />
          </div>
        )}
      </div>
      <p
        className={cn(
          "text-2xl font-bold tabular-nums mt-1.5 tracking-tight",
          tone === "danger" && "text-destructive",
          tone === "primary" && "text-primary"
        )}
      >
        {value}
      </p>
      {delta && (
        <p
          className={cn(
            "text-[11px] mt-1 tabular-nums",
            deltaTone === "positive" && "text-primary font-medium",
            deltaTone === "warning" && "text-amber-600 dark:text-amber-500 font-medium",
            deltaTone === "danger" && "text-destructive font-medium",
            deltaTone === "neutral" && "text-muted-foreground"
          )}
        >
          {delta}
        </p>
      )}
    </div>
  );
}
