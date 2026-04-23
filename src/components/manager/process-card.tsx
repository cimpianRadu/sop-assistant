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
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] text-muted-foreground pt-3 mt-auto border-t">
            <span className="flex items-center gap-1.5 tabular-nums">
              <ListChecksIcon className="size-3.5 shrink-0 text-muted-foreground/70" />
              <span className="font-medium text-foreground">
                {enriched.stepCount}
              </span>
              <span className="truncate">
                {enriched.stepCount === 1 ? "step" : "steps"}
              </span>
            </span>
            <span className="flex items-center gap-1.5 tabular-nums">
              <PlayIcon className="size-3.5 shrink-0 text-muted-foreground/70" />
              <span className="font-medium text-foreground">
                {enriched.totalRuns}
              </span>
              <span className="truncate">
                {enriched.totalRuns === 1 ? "run" : "runs"}
              </span>
            </span>
            <span className="flex items-center gap-1.5 tabular-nums">
              <UsersIcon className="size-3.5 shrink-0 text-muted-foreground/70" />
              <span className="font-medium text-foreground">
                {enriched.operatorCount}
              </span>
              <span className="truncate">
                {enriched.operatorCount === 1 ? "operator" : "operators"}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <ClockIcon className="size-3.5 shrink-0 text-muted-foreground/70" />
              {enriched.lastRunAt ? (
                <span className="truncate">
                  Last run{" "}
                  <span className="font-medium text-foreground">
                    {formatRelativeTime(enriched.lastRunAt, locale)}
                  </span>
                </span>
              ) : (
                <span className="italic">No runs yet</span>
              )}
            </span>
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
