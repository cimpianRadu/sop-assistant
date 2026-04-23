"use client";

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

  // Only keep months with at least one started execution
  const points = data.map((d) => ({
    month: d.month,
    rate: d.started > 0 ? Math.round((d.completed / d.started) * 100) : null,
  }));

  const hasData = points.some((p) => p.rate !== null);

  // Chart geometry
  const W = 600;
  const H = 160;
  const padX = 28;
  const padY = 20;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;
  const n = points.length;
  const xAt = (i: number) =>
    padX + (n > 1 ? (chartW * i) / (n - 1) : chartW / 2);
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
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-40 text-primary"
              preserveAspectRatio="none"
            >
              {/* Horizontal gridlines at 25/50/75/100% */}
              {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                <line
                  key={p}
                  x1={padX}
                  x2={W - padX}
                  y1={padY + chartH * (1 - p)}
                  y2={padY + chartH * (1 - p)}
                  stroke="currentColor"
                  strokeOpacity={p === 1 || p === 0 ? "0.15" : "0.08"}
                  strokeWidth="1"
                  strokeDasharray={p === 0.5 ? "2 2" : undefined}
                />
              ))}
              {/* Y-axis % labels */}
              {[0, 50, 100].map((pct) => (
                <text
                  key={pct}
                  x={padX - 6}
                  y={yAt(pct) + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="currentColor"
                  fillOpacity="0.45"
                >
                  {pct}
                </text>
              ))}
              {/* Line */}
              <path
                d={linePath}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Points */}
              {points.map((p, i) =>
                p.rate !== null ? (
                  <circle
                    key={i}
                    cx={xAt(i)}
                    cy={yAt(p.rate)}
                    r="3.5"
                    fill="currentColor"
                  >
                    <title>{t("completionRatePoint", { month: p.month, rate: p.rate })}</title>
                  </circle>
                ) : null
              )}
            </svg>
            <div className="flex items-stretch justify-between pt-2 text-[11px] text-muted-foreground tabular-nums">
              {points.map((p, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="font-medium">{p.month}</span>
                  <span
                    className={
                      p.rate !== null
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground/50"
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
