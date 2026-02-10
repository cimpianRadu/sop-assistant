"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function StatCard({ title, value, description }: { title: string; value: number; description?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

type AnalyticsCardsProps = { totalProcesses: number; totalExecutions: number; completedExecutions: number; inProgressExecutions: number };

export function AnalyticsCards({ totalProcesses, totalExecutions, completedExecutions, inProgressExecutions }: AnalyticsCardsProps) {
  const t = useTranslations("Analytics");
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title={t("totalProcesses")} value={totalProcesses} description={t("sopsCreated")} />
      <StatCard title={t("totalExecutions")} value={totalExecutions} description={t("acrossAll")} />
      <StatCard title={t("completed")} value={completedExecutions} description={t("successfullyFinished")} />
      <StatCard title={t("inProgress")} value={inProgressExecutions} description={t("currentlyRunning")} />
    </div>
  );
}
