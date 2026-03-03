"use client";

import { useTranslations } from "next-intl";
import { FileTextIcon } from "lucide-react";
import { ProcessCard } from "./process-card";
import { EmptyState } from "@/components/shared/empty-state";
import type { ProcessWithCreator } from "@/lib/types";

export function ProcessList({ processes }: { processes: ProcessWithCreator[] }) {
  const t = useTranslations("Manager");

  if (processes.length === 0) {
    return (
      <EmptyState
        icon={FileTextIcon}
        title={t("noProcesses")}
        description={t("noProcessesHint")}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {processes.map((process) => (
        <ProcessCard key={process.id} process={process} />
      ))}
    </div>
  );
}
