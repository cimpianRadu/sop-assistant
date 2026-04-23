"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3Icon } from "lucide-react";

type TrendPoint = {
  month: string;
  started: number;
  completed: number;
};

export function ExecutionTrendChart({
  data,
}: {
  data: TrendPoint[];
  locale: string;
}) {
  const t = useTranslations("Profile");
  const tcommon = useTranslations("Common");
  const max = Math.max(
    1,
    ...data.map((d) => Math.max(d.started, d.completed))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3Icon className="size-4 text-muted-foreground" />
          Executions — last 6 months
        </CardTitle>
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary/30 inline-block" />
            {tcommon("started", { date: "" }).replace(" ", "")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary inline-block" />
            {t("executionsCompleted")}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2 sm:gap-4 h-44">
          {data.map((point, i) => {
            const startedPct = (point.started / max) * 100;
            const completedPct = (point.completed / max) * 100;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-2 min-w-0"
              >
                <div className="flex items-end gap-1 h-32 w-full justify-center">
                  {/* Started bar (pale) */}
                  <div className="relative flex-1 max-w-[18px] min-w-[6px]">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-primary/25 rounded-t-sm transition-all"
                      style={{ height: `${startedPct}%` }}
                      title={`${point.started} started`}
                    />
                  </div>
                  {/* Completed bar (solid) */}
                  <div className="relative flex-1 max-w-[18px] min-w-[6px]">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-sm transition-all"
                      style={{ height: `${completedPct}%` }}
                      title={`${point.completed} completed`}
                    />
                  </div>
                </div>
                <div className="text-[11px] font-medium text-muted-foreground tabular-nums">
                  {point.month}
                </div>
                <div className="text-[11px] text-foreground tabular-nums font-semibold">
                  {point.started}
                  {point.completed > 0 && (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      · {point.completed}✓
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
