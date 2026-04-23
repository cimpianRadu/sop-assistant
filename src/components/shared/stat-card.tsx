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
        "rounded-lg border px-3 sm:px-4 py-3 transition-colors",
        tone === "danger" &&
          "border-destructive/25 bg-gradient-to-b from-destructive/5 to-transparent",
        tone === "primary" &&
          "border-primary/25 bg-gradient-to-b from-primary/5 to-transparent",
        tone === "default" && "bg-card"
      )}
    >
      <p
        className={cn(
          "text-xs font-medium text-muted-foreground flex items-center gap-1.5",
          tone === "danger" && "text-destructive/80"
        )}
      >
        {Icon && <Icon className="size-3.5" />}
        {label}
      </p>
      <p
        className={cn(
          "text-2xl font-bold tabular-nums mt-1 tracking-tight",
          tone === "danger" && "text-destructive",
          tone === "primary" && "text-primary"
        )}
      >
        {value}
      </p>
      {delta && (
        <p
          className={cn(
            "text-[11px] mt-1",
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
