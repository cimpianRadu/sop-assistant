import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProcessDetailView } from "@/components/manager/process-detail-view";
import { StartExecutionButton } from "@/components/manager/start-execution-button";
import { formatDuration, formatRelativeTime } from "@/lib/format";
import { sopToHeadings } from "@/lib/sop-toc";
import { ArrowRightIcon, ChevronRightIcon, ClockIcon } from "lucide-react";
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
  const tm = await getTranslations("Manager");
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

  const [{ data: steps }, { data: myExecutions }] = await Promise.all([
    supabase
      .from("checklist_steps")
      .select("*")
      .eq("process_id", id)
      .order("step_number"),
    supabase
      .from("executions")
      .select("*")
      .eq("process_id", id)
      .eq("operator_id", user!.id)
      .order("started_at", { ascending: false }),
  ]);

  const stepsList = (steps as ChecklistStep[]) || [];
  const toc = sopToHeadings(process.sop_text);
  const executions = (myExecutions as Execution[]) || [];
  const inProgress = executions.find((e) => e.status === "in_progress");
  const completedRuns = executions.filter((e) => e.status === "completed");

  return (
    <div className="max-w-7xl space-y-5">
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

      {/* Title + actions */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {process.title}
          </h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="neutral">
              {tm("versionBadge", {
                version: process.current_version ?? 1,
                updated: formatRelativeTime(
                  process.updated_at ?? process.created_at,
                  locale
                ),
              })}
            </Badge>
            {completedRuns.length > 0 && (
              <Badge variant="success">
                {t("runsCompleted", { count: completedRuns.length })}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!inProgress && <StartExecutionButton processId={id} />}
        </div>
      </div>

      {/* Description */}
      {process.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {process.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabbed view + right rail */}
      <ProcessDetailView
        sopText={process.sop_text}
        toc={toc}
        steps={stepsList}
      >
        {/* In-progress prominent callout */}
        {inProgress && (
          <Card className="border-primary/40 bg-gradient-to-b from-primary/5 to-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="relative inline-flex size-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                {t("inProgressSection")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <p className="text-xs text-muted-foreground">
                {t("startedOn", {
                  date: new Date(inProgress.started_at).toLocaleDateString(
                    locale,
                    { month: "short", day: "numeric" }
                  ),
                })}
              </p>
              <Link
                href={`/operator/processes/${id}/execute/${inProgress.id}`}
                className="block"
              >
                <Button size="sm" className="w-full gap-1.5">
                  {t("continueExecution")}
                  <ArrowRightIcon className="size-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Your executions history */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("yourExecutions")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {executions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                {t("noExecutionsYet")}
              </p>
            ) : (
              <div className="space-y-1.5">
                {executions.slice(0, 8).map((execution) => {
                  const duration = formatDuration(
                    execution.started_at,
                    execution.completed_at
                  );
                  const started = new Date(
                    execution.started_at
                  ).toLocaleDateString(locale, {
                    month: "short",
                    day: "numeric",
                  });
                  const isInProgress = execution.status === "in_progress";
                  const row = (
                    <div
                      className={
                        "group flex items-center justify-between gap-2 border rounded-md px-2.5 py-2 transition-colors " +
                        (isInProgress
                          ? "hover:bg-muted/50 cursor-pointer"
                          : "")
                      }
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">
                          {started}
                        </p>
                        {duration && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <ClockIcon className="size-3" />
                            {duration}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant={isInProgress ? "warning" : "success"}
                        >
                          {isInProgress
                            ? tc("inProgress")
                            : tc("completed")}
                        </Badge>
                        {isInProgress && (
                          <ArrowRightIcon className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                  );
                  return isInProgress ? (
                    <Link
                      key={execution.id}
                      href={`/operator/processes/${id}/execute/${execution.id}`}
                      className="block"
                    >
                      {row}
                    </Link>
                  ) : (
                    <div key={execution.id}>{row}</div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </ProcessDetailView>
    </div>
  );
}
