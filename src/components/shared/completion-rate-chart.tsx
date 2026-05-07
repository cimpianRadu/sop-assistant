"use client";

import { useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PercentIcon } from "lucide-react";

type TrendPoint = {
  month: string;
  started: number;
  completed: number;
};

export function CompletionRateChart({ data }: { data: TrendPoint[] }) {
  const t = useTranslations("Profile");

  const points = data.map((d) => ({
    month: d.month,
    rate: d.started > 0 ? Math.round((d.completed / d.started) * 100) : null,
  }));

  const hasData = points.some((p) => p.rate !== null);
  const ticks = [0, 25, 50, 75, 100];

  const chartRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      const el = chartRef.current;
      if (!el || points.length === 0) return;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      const idx = Math.round(ratio * (points.length - 1));
      setActiveIdx(idx);
    },
    [points.length]
  );

  // Chart geometry
  const W = 600;
  const H = 160;
  const padY = 10;
  const chartW = W;
  const chartH = H - padY * 2;
  const n = points.length;
  const xAt = (i: number) => (n > 1 ? (chartW * i) / (n - 1) : chartW / 2);
  const yAt = (v: number) => padY + chartH - (chartH * v) / 100;

  // Build a path that skips null months
  const linePath = (() => {
    let d = "";
    let started = false;
    points.forEach((p, i) => {
      if (p.rate === null) {
        started = false;
        return;
      }
      d += `${!started ? "M" : "L"}${xAt(i)},${yAt(p.rate)} `;
      started = true;
    });
    return d.trim();
  })();

  const active = activeIdx !== null ? points[activeIdx] : null;
  const activeLeftPct =
    activeIdx !== null && n > 1 ? (activeIdx / (n - 1)) * 100 : 50;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PercentIcon className="size-4 text-muted-foreground" />
          {t("completionRateTrend")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t("noDataYet")}
          </p>
        ) : (
          <>
            <div className="flex">
              {/* Y-axis labels */}
              <div className="relative w-9 h-40 shrink-0 select-none">
                {ticks.map((tick) => (
                  <span
                    key={tick}
                    className="absolute right-2 text-[10px] tabular-nums text-muted-foreground/70 -translate-y-1/2"
                    style={{ top: `${(yAt(tick) / H) * 100}%` }}
                  >
                    {tick}%
                  </span>
                ))}
              </div>

              {/* Chart area */}
              <div
                ref={chartRef}
                className="relative flex-1 h-40 touch-none"
                onPointerMove={(e) => handleMove(e.clientX)}
                onPointerDown={(e) => handleMove(e.clientX)}
                onPointerLeave={() => setActiveIdx(null)}
              >
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  className="absolute inset-0 w-full h-full text-primary"
                  preserveAspectRatio="none"
                >
                  {/* Horizontal gridlines */}
                  {ticks.map((tick) => (
                    <line
                      key={tick}
                      x1={0}
                      x2={W}
                      y1={yAt(tick)}
                      y2={yAt(tick)}
                      stroke="currentColor"
                      strokeOpacity={tick === 0 || tick === 100 ? "0.18" : "0.08"}
                      strokeWidth="1"
                      strokeDasharray={tick === 50 ? "2 2" : undefined}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  {/* Line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  {/* Active vertical guide */}
                  {activeIdx !== null && points[activeIdx]?.rate !== null && (
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
                  {/* Points */}
                  {points.map((p, i) =>
                    p.rate !== null ? (
                      <circle
                        key={i}
                        cx={xAt(i)}
                        cy={yAt(p.rate)}
                        r={activeIdx === i ? "5" : "3.5"}
                        fill="currentColor"
                        vectorEffect="non-scaling-stroke"
                      />
                    ) : null
                  )}
                </svg>

                {/* Tooltip pill */}
                {active && active.rate !== null && (
                  <div
                    className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full"
                    style={{ left: `${activeLeftPct}%` }}
                  >
                    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-[11px] shadow-md whitespace-nowrap">
                      <div className="font-semibold text-foreground">
                        {active.month}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="size-2 rounded-sm bg-primary" />
                        <span className="text-foreground font-medium tabular-nums">
                          {active.rate}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Month labels */}
            <div className="flex items-stretch pt-2 pl-9 text-[11px] text-muted-foreground tabular-nums">
              {points.map((p, i) => (
                <div
                  key={i}
                  className={`flex-1 flex flex-col items-center gap-0.5 ${
                    activeIdx === i ? "text-foreground" : ""
                  }`}
                >
                  <span className="font-medium">{p.month}</span>
                  <span
                    className={
                      p.rate !== null
                        ? "text-foreground/80 font-semibold"
                        : "text-muted-foreground/40"
                    }
                  >
                    {p.rate !== null ? `${p.rate}%` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
