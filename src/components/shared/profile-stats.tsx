"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Stat = {
  labelKey: string;
  descKey: string;
  value: number | string;
};

type ProfileStatsProps = {
  stats: Stat[];
};

export function ProfileStats({ stats }: ProfileStatsProps) {
  const t = useTranslations("Profile");

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.labelKey}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(stat.labelKey)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{t(stat.descKey)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
