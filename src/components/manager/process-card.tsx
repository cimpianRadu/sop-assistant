"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/format";
import {
  ListChecksIcon,
  PlayIcon,
  UsersIcon,
  ClockIcon,
} from "lucide-react";
import type { ProcessWithCreator } from "@/lib/types";
import type { ProcessCardData } from "@/lib/process-enrichment";

type Props = {
  process: ProcessWithCreator | ProcessCardData;
  locale?: string;
};

function isEnriched(p: Props["process"]): p is ProcessCardData {
  return "totalRuns" in p;
}

export function ProcessCard({ process, locale = "en" }: Props) {
  const t = useTranslations("Manager");
  const creatorName = process.profiles?.full_name || process.profiles?.email;
  const enriched = isEnriched(process) ? process : null;
  const isActive = enriched ? enriched.totalRuns > 0 || enriched.operatorCount > 0 : true;

  return (
    <Link href={`/manager/processes/${process.id}`}>
      <div className="group h-full rounded-lg border bg-card p-4 hover:border-border/80 hover:shadow-md transition-all cursor-pointer flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {process.title}
          </h3>
          <Badge
            variant="outline"
            className={
              isActive
                ? "bg-primary/10 text-primary border-primary/25 text-[10px] uppercase tracking-wide shrink-0"
                : "text-[10px] uppercase tracking-wide shrink-0"
            }
          >
            {isActive ? t("statusActive") : t("statusDraft")}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {process.description}
        </p>

        {enriched && (
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-2 mt-auto border-t flex-wrap">
            <span className="flex items-center gap-1 tabular-nums">
              <ListChecksIcon className="size-3" />
              {enriched.stepCount}
            </span>
            <span className="flex items-center gap-1 tabular-nums">
              <PlayIcon className="size-3" />
              {enriched.totalRuns}
            </span>
            {enriched.operatorCount > 0 && (
              <span className="flex items-center gap-1 tabular-nums">
                <UsersIcon className="size-3" />
                {enriched.operatorCount}
              </span>
            )}
            {enriched.lastRunAt && (
              <span className="flex items-center gap-1 ml-auto">
                <ClockIcon className="size-3" />
                {formatRelativeTime(enriched.lastRunAt, locale)}
              </span>
            )}
          </div>
        )}

        {!enriched && (
          <div className="flex items-center justify-between pt-2 mt-auto border-t text-[11px] text-muted-foreground">
            <span>
              {new Date(process.created_at).toLocaleDateString(locale, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {creatorName && <span>{creatorName}</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
