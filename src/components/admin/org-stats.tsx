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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
