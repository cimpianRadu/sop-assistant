"use client";

import { useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3Icon } from "lucide-react";

type TrendPoint = {
  month: string;
  started: number;
  completed: number;
};

function niceCeiling(value: number) {
  if (value <= 4) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const norm = value / pow;
  let nice;
  if (norm <= 1) nice = 1;
  else if (norm <= 2) nice = 2;
  else if (norm <= 5) nice = 5;
  else nice = 10;
  return nice * pow;
}

export function ExecutionTrendChart({
  data,
}: {
  data: TrendPoint[];
  locale: string;
}) {
  const t = useTranslations("Profile");
  const rawMax = Math.max(
    1,
    ...data.map((d) => Math.max(d.started, d.completed))
  );
  const max = niceCeiling(rawMax);
  const ticks = [0, max / 4, max / 2, (max * 3) / 4, max];

  const chartRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      const el = chartRef.current;
      if (!el || data.length === 0) return;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      const idx = Math.round(ratio * (data.length - 1));
      setActiveIdx(idx);
    },
    [data.length]
  );

  // Chart geometry (SVG viewBox units)
  const W = 600;
  const H = 180;
  const padY = 8;
  const chartW = W;
  const chartH = H - padY * 2;
  const n = data.length;
  const xAt = (i: number) => (n > 1 ? (chartW * i) / (n - 1) : chartW / 2);
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

  const active = activeIdx !== null ? data[activeIdx] : null;
  const activeLeftPct =
    activeIdx !== null && n > 1 ? (activeIdx / (n - 1)) * 100 : 50;

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
        <div className="flex">
          {/* Y-axis labels */}
          <div className="relative w-8 h-44 shrink-0 select-none">
            {ticks.map((tick) => (
              <span
                key={tick}
                className="absolute right-2 text-[10px] tabular-nums text-muted-foreground/70 -translate-y-1/2"
                style={{ top: `${(yAt(tick) / H) * 100}%` }}
              >
                {Math.round(tick)}
              </span>
            ))}
          </div>

          {/* Chart area */}
          <div
            ref={chartRef}
            className="relative flex-1 h-44 touch-none"
            onPointerMove={(e) => handleMove(e.clientX)}
            onPointerDown={(e) => handleMove(e.clientX)}
            onPointerLeave={() => setActiveIdx(null)}
          >
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="absolute inset-0 w-full h-full text-primary"
              preserveAspectRatio="none"
            >
              {/* Horizontal gridlines at each tick */}
              {ticks.map((tick, i) => (
                <line
                  key={i}
                  x1={0}
                  x2={W}
                  y1={yAt(tick)}
                  y2={yAt(tick)}
                  stroke="currentColor"
                  strokeOpacity={i === 0 ? "0.18" : "0.08"}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
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
                vectorEffect="non-scaling-stroke"
              />
              {/* Completed line (solid) */}
              <path
                d={completedPath}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* Active vertical guide */}
              {activeIdx !== null && (
                <line
                  x1={xAt(activeIdx)}
                  x2={xAt(activeIdx)}
                  y1={padY}
                  y2={padY + chartH}
                  stroke="currentColor"
                  strokeOpacity="0.35"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {/* Data points on completed */}
              {data.map((d, i) => (
                <circle
                  key={i}
                  cx={xAt(i)}
                  cy={yAt(d.completed)}
                  r={activeIdx === i ? "5" : "3.5"}
                  fill="currentColor"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>

            {/* Tooltip pill */}
            {active && (
              <div
                className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full"
                style={{ left: `${activeLeftPct}%` }}
              >
                <div className="rounded-md border bg-popover px-2.5 py-1.5 text-[11px] shadow-md whitespace-nowrap">
                  <div className="font-semibold text-foreground mb-0.5">
                    {active.month}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="size-2 rounded-sm bg-primary/30" />
                    <span>{t("legendStarted")}:</span>
                    <span className="text-foreground font-medium tabular-nums">
                      {active.started}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="size-2 rounded-sm bg-primary" />
                    <span>{t("legendCompleted")}:</span>
                    <span className="text-foreground font-medium tabular-nums">
                      {active.completed}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Month labels under chart */}
        <div className="flex items-stretch pt-2 pl-8 text-[11px] text-muted-foreground tabular-nums">
          {data.map((d, i) => (
            <div
              key={i}
              className={`flex-1 flex flex-col items-center gap-0.5 ${
                activeIdx === i ? "text-foreground" : ""
              }`}
            >
              <span className="font-medium">{d.month}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
