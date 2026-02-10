"use client";

import { useTranslations } from "next-intl";
import { ProcessCard } from "./process-card";
import type { Process } from "@/lib/types";

export function ProcessList({ processes }: { processes: Process[] }) {
  const t = useTranslations("Manager");

  if (processes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">{t("noProcesses")}</p>
        <p className="text-sm mt-1">{t("noProcessesHint")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {processes.map((process) => (<ProcessCard key={process.id} process={process} />))}
    </div>
  );
}
