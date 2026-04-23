import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProcessViewer } from "@/components/operator/process-viewer";
import { formatDuration } from "@/lib/format";
import { ChevronRightIcon, ClockIcon } from "lucide-react";
import type { ChecklistStep, Execution } from "@/lib/types";

export default async function OperatorProcessPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Operator");
  const tc = await getTranslations("Common");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: process } = await supabase
    .from("processes")
    .select("*")
    .eq("id", id)
    .single();

  if (!process) {
    notFound();
  }

  const { data: steps } = await supabase
    .from("checklist_steps")
    .select("*")
    .eq("process_id", id)
    .order("step_number");

  const { data: myExecutions } = await supabase
    .from("executions")
    .select("*")
    .eq("process_id", id)
    .eq("operator_id", user!.id)
    .order("started_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-muted-foreground overflow-x-auto"
      >
        <Link
          href="/operator/dashboard"
          className="hover:text-foreground shrink-0"
        >
          {tc("dashboard")}
        </Link>
        <ChevronRightIcon className="size-3.5 shrink-0" />
        <span className="text-foreground truncate">{process.title}</span>
      </nav>

      {/* Title */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {process.title}
        </h2>
        {process.description && (
          <p className="text-muted-foreground mt-2 leading-relaxed">
            {process.description}
          </p>
        )}
      </div>

      {/* Your executions */}
      {myExecutions && myExecutions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-base">{t("yourExecutions")}</h3>
          <div className="space-y-2">
            {(myExecutions as Execution[]).map((execution) => {
              const duration = formatDuration(
                execution.started_at,
                execution.completed_at
              );
              const started = new Date(execution.started_at).toLocaleDateString(
                locale,
                { month: "short", day: "numeric", year: "numeric" }
              );
              return (
                <div
                  key={execution.id}
                  className="flex items-center justify-between flex-wrap gap-2 border rounded-lg p-3 bg-card"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {tc("started", { date: started })}
                    </p>
                    {duration && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <ClockIcon className="size-3" />
                        {duration}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={
                        execution.status === "completed"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {execution.status === "completed"
                        ? tc("completed")
                        : tc("inProgress")}
                    </Badge>
                    {execution.status === "in_progress" && (
                      <Link
                        href={`/operator/processes/${id}/execute/${execution.id}`}
                      >
                        <Button size="sm" variant="outline">
                          {t("continue")}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ProcessViewer
        processId={id}
        sopText={process.sop_text}
        steps={(steps as ChecklistStep[]) || []}
      />
    </div>
  );
}
