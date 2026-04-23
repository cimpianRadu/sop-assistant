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
  const max = Math.max(
    4,
    ...data.map((d) => Math.max(d.started, d.completed))
  );

  // Chart geometry (SVG viewBox units)
  const W = 600;
  const H = 180;
  const padX = 24;
  const padY = 16;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;
  const n = data.length;
  const xAt = (i: number) =>
    padX + (n > 1 ? (chartW * i) / (n - 1) : chartW / 2);
  const yAt = (v: number) => padY + chartH - (chartH * v) / max;

  const linePath = (key: "started" | "completed") =>
    data
      .map((d, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(d[key])}`)
      .join(" ");

  const startedPath = linePath("started");
  const completedPath = linePath("completed");
  const completedArea =
    data.length > 0
      ? `${completedPath} L${xAt(n - 1)},${padY + chartH} L${xAt(0)},${padY + chartH} Z`
      : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3Icon className="size-4 text-muted-foreground" />
          {t("executionsLast6Months")}
        </CardTitle>
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary/30 inline-block" />
            {t("legendStarted")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary inline-block" />
            {t("legendCompleted")}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-44 text-primary"
          preserveAspectRatio="none"
        >
          {/* Horizontal gridlines */}
          {[0.25, 0.5, 0.75].map((p) => (
            <line
              key={p}
              x1={padX}
              x2={W - padX}
              y1={padY + chartH * p}
              y2={padY + chartH * p}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeWidth="1"
            />
          ))}
          {/* Area under completed */}
          <path d={completedArea} fill="currentColor" fillOpacity="0.08" />
          {/* Started line (pale) */}
          <path
            d={startedPath}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Completed line (solid) */}
          <path
            d={completedPath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Data points on completed */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={xAt(i)}
              cy={yAt(d.completed)}
              r="3.5"
              fill="currentColor"
            >
              <title>
                {d.month}: {d.completed} / {d.started}
              </title>
            </circle>
          ))}
        </svg>
        {/* Month + count labels */}
        <div className="flex items-stretch justify-between pt-2 text-[11px] text-muted-foreground tabular-nums">
          {data.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <span className="font-medium">{d.month}</span>
              <span className="text-foreground font-semibold">
                {d.started}
                {d.completed > 0 && (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    · {d.completed}
                    {"\u2713"}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
