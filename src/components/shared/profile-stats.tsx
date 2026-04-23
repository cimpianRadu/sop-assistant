"use client";

import { useTranslations } from "next-intl";
import {
  UsersIcon,
  FileTextIcon,
  PlayIcon,
  PercentIcon,
  CheckCircle2Icon,
  MessageSquareIcon,
  BarChart3Icon,
  LayersIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Stat = {
  labelKey: string;
  descKey: string;
  value: number | string;
  delta?: {
    value: number;
    unit: "runs" | "points";
    direction: "up" | "down" | "flat";
  };
};

type ProfileStatsProps = {
  stats: Stat[];
};

const ICONS: Record<string, LucideIcon> = {
  orgMembers: UsersIcon,
  orgProcesses: FileTextIcon,
  totalExecutions: PlayIcon,
  completionRate: PercentIcon,
  sopsCreated: FileTextIcon,
  executionsManaged: LayersIcon,
  executionsCompleted: CheckCircle2Icon,
  helpRequests: MessageSquareIcon,
};

export function ProfileStats({ stats }: ProfileStatsProps) {
  const t = useTranslations("Profile");

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => {
        const Icon = ICONS[stat.labelKey] || BarChart3Icon;
        const delta = stat.delta;
        const DeltaIcon =
          delta?.direction === "up"
            ? TrendingUpIcon
            : delta?.direction === "down"
            ? TrendingDownIcon
            : MinusIcon;
        return (
          <div
            key={stat.labelKey}
            className="rounded-lg border bg-gradient-to-br from-muted/30 via-card to-card p-4 hover:shadow-sm hover:border-border/80 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {t(stat.labelKey)}
                </p>
                <p className="text-2xl font-bold tabular-nums mt-1.5 tracking-tight">
                  {stat.value}
                </p>
              </div>
              <div className="size-8 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0 ring-1 ring-primary/20">
                <Icon className="size-4" />
              </div>
            </div>
            {delta ? (
              <div className="mt-2.5 flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded",
                    delta.direction === "up" &&
                      "bg-primary/10 text-primary",
                    delta.direction === "down" &&
                      "bg-destructive/10 text-destructive",
                    delta.direction === "flat" &&
                      "bg-muted text-muted-foreground"
                  )}
                >
                  <DeltaIcon className="size-3" />
                  {delta.direction === "up"
                    ? `+${delta.value}`
                    : delta.direction === "down"
                    ? `-${delta.value}`
                    : "0"}
                  {delta.unit === "points" ? "pts" : ""}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {t("vsLast30d")}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed">
                {t(stat.descKey)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
