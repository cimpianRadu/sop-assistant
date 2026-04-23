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
  type LucideIcon,
} from "lucide-react";

type Stat = {
  labelKey: string;
  descKey: string;
  value: number | string;
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
        return (
          <div
            key={stat.labelKey}
            className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {t(stat.labelKey)}
                </p>
                <p className="text-2xl font-bold tabular-nums mt-1 tracking-tight">
                  {stat.value}
                </p>
              </div>
              <div className="size-8 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                <Icon className="size-4" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              {t(stat.descKey)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
