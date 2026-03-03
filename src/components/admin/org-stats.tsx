"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OrgStats({
  memberCount,
  processCount,
  totalExecutions,
  completedExecutions,
}: {
  memberCount: number;
  processCount: number;
  totalExecutions: number;
  completedExecutions: number;
}) {
  const t = useTranslations("Admin");

  const stats = [
    { label: t("members"), value: memberCount },
    { label: t("processes"), value: processCount },
    { label: t("totalExecutions"), value: totalExecutions },
    { label: t("completedExecutions"), value: completedExecutions },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="gap-0 px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            {stat.label}
          </p>
          <p className="text-xl font-bold">{stat.value}</p>
        </Card>
      ))}
    </div>
  );
}
