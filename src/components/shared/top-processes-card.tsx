"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { TrendingUpIcon, ArrowRightIcon } from "lucide-react";

export type TopProcess = {
  id: string;
  title: string;
  count: number;
  href: string;
};

export function TopProcessesCard({ items }: { items: TopProcess[] }) {
  const t = useTranslations("Profile");
  const max = items.reduce((m, it) => Math.max(m, it.count), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUpIcon className="size-4 text-muted-foreground" />
          {t("topProcesses")}
        </CardTitle>
        <p className="text-xs text-muted-foreground pt-0.5">
          {t("topProcessesDesc")}
        </p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {t("noDataYet")}
          </p>
        ) : (
          <ol className="space-y-2">
            {items.map((item, idx) => {
              const pct = max > 0 ? (item.count / max) * 100 : 0;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted/50 hover:border-border/80 transition-colors"
                  >
                    <span className="size-6 rounded-full bg-primary/10 text-primary text-xs font-bold grid place-items-center shrink-0 tabular-nums ring-1 ring-primary/20">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {item.title}
                      </p>
                      <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-sm font-semibold tabular-nums">
                        {item.count}
                      </span>
                      <ArrowRightIcon className="size-3.5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
