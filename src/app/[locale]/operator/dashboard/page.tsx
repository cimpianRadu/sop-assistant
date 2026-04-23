import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import {
  ClipboardListIcon,
  PlayIcon,
  ArrowRightIcon,
  ListChecksIcon,
} from "lucide-react";

export default async function OperatorDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Operator");
  const ta = await getTranslations("Admin");

  const session = await getSessionContext();
  if (!session) return null;

  const supabase = await createClient();
  // eslint-disable-next-line react-hooks/purity -- server component, runs per-request
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: assignments },
    { count: totalCount },
    { count: completedCount },
    { count: inProgressCount },
    { count: weekCount },
    { data: activeExecutions },
  ] = await Promise.all([
    supabase
      .from("process_assignments")
      .select(
        "process_id, assigned_by, profiles!process_assignments_assigned_by_fkey(full_name, email), processes(id, title, description, created_at)"
      )
      .eq("operator_id", session.user_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("executions")
      .select("*", { count: "exact", head: true })
      .eq("operator_id", session.user_id),
    supabase
      .from("executions")
      .select("*", { count: "exact", head: true })
      .eq("operator_id", session.user_id)
      .eq("status", "completed"),
    supabase
      .from("executions")
      .select("*", { count: "exact", head: true })
      .eq("operator_id", session.user_id)
      .eq("status", "in_progress"),
    supabase
      .from("executions")
      .select("*", { count: "exact", head: true })
      .eq("operator_id", session.user_id)
      .gte("started_at", weekAgo),
    supabase
      .from("executions")
      .select("id, process_id, started_at, processes(title)")
      .eq("operator_id", session.user_id)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false }),
  ]);

  type ProcessJoin = {
    id: string;
    title: string;
    description: string;
    created_at: string;
  };
  type ProfileJoin = { full_name: string | null; email: string };

  const processes = (assignments || []).map((a) => {
    const proc = a.processes as unknown as ProcessJoin;
    const prof = a.profiles as unknown as ProfileJoin;
    return {
      ...proc,
      assignedBy: prof?.full_name || prof?.email || null,
      assignedByEmail: prof?.email || null,
    };
  });

  // Fetch step counts per process (for All Assigned Processes cards)
  const processIds = processes.map((p) => p.id);
  const stepCounts = new Map<string, number>();
  if (processIds.length > 0) {
    const { data: stepRows } = await supabase
      .from("checklist_steps")
      .select("process_id")
      .in("process_id", processIds);
    for (const s of (stepRows || []) as { process_id: string }[]) {
      stepCounts.set(s.process_id, (stepCounts.get(s.process_id) || 0) + 1);
    }
  }

  // Fetch progress per active execution (for progress bar)
  type ActiveExecution = {
    id: string;
    process_id: string;
    started_at: string;
    processes: { title: string };
  };
  const activeList = (activeExecutions as unknown as ActiveExecution[]) || [];
  const executionIds = activeList.map((e) => e.id);
  const progressMap = new Map<
    string,
    { completed: number; total: number }
  >();
  if (executionIds.length > 0) {
    const { data: execSteps } = await supabase
      .from("execution_steps")
      .select("execution_id, completed")
      .in("execution_id", executionIds);
    for (const s of (execSteps || []) as {
      execution_id: string;
      completed: boolean;
    }[]) {
      const cur = progressMap.get(s.execution_id) || {
        completed: 0,
        total: 0,
      };
      cur.total += 1;
      if (s.completed) cur.completed += 1;
      progressMap.set(s.execution_id, cur);
    }
  }

  const processCount = processes.length;
  const totalExecutions = totalCount || 0;
  const completedExecutions = completedCount || 0;
  const inProgressExecutions = inProgressCount || 0;
  const thisWeekExecutions = weekCount || 0;

  function initialsFor(nameOrEmail: string): string {
    if (!nameOrEmail) return "?";
    if (nameOrEmail.includes("@"))
      return nameOrEmail.slice(0, 2).toUpperCase();
    const parts = nameOrEmail.trim().split(/\s+/);
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return nameOrEmail.slice(0, 2).toUpperCase();
  }

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t("assignedProcesses")}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {session.org_name}
          {inProgressExecutions > 0 && (
            <>
              {" · "}You have {inProgressExecutions}{" "}
              {inProgressExecutions === 1 ? "run" : "runs"} in progress
            </>
          )}
        </p>
      </div>

      {/* Stat cards */}
      {totalExecutions > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatCard
            label={ta("totalExecutions")}
            value={totalExecutions}
            delta={
              thisWeekExecutions > 0
                ? `+${thisWeekExecutions} this week`
                : undefined
            }
            deltaTone={thisWeekExecutions > 0 ? "positive" : "neutral"}
          />
          <StatCard
            label={ta("inProgressExecutions")}
            value={inProgressExecutions}
          />
          <StatCard
            label={ta("completedExecutions")}
            value={completedExecutions}
            tone="primary"
          />
        </div>
      )}

      {/* In Progress (prioritised) */}
      {activeList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <PlayIcon className="size-4 text-primary" />
            <h3 className="font-semibold">{t("inProgressSection")}</h3>
            <Badge variant="secondary">{activeList.length}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {activeList.map((exec) => {
              const progress = progressMap.get(exec.id);
              const completed = progress?.completed ?? 0;
              const total = progress?.total ?? 0;
              const percent =
                total > 0 ? Math.round((completed / total) * 100) : 0;
              const currentStep = Math.min(completed + 1, total);
              return (
                <Link
                  key={exec.id}
                  href={`/operator/processes/${exec.process_id}/execute/${exec.id}`}
                >
                  <div className="group h-full rounded-xl border border-primary/30 bg-gradient-to-b from-primary/5 to-card p-4 hover:border-primary/60 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-base font-semibold leading-tight">
                        {exec.processes.title}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground -mt-1">
                      {t("startedOn", {
                        date: new Date(exec.started_at).toLocaleDateString(
                          locale,
                          { month: "short", day: "numeric" }
                        ),
                      })}
                      {total > 0 && (
                        <> · Step {currentStep} of {total}</>
                      )}
                    </p>

                    {/* Progress bar */}
                    {total > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Progress
                          </span>
                          <span className="text-xs font-semibold tabular-nums text-primary">
                            {percent}%
                          </span>
                        </div>
                        <div className="h-2 bg-background rounded-full overflow-hidden border">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="default"
                      className="mt-auto w-fit gap-1.5"
                    >
                      {t("continueExecution")}
                      <ArrowRightIcon className="size-3.5" />
                    </Button>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* All Assigned Processes */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold">{t("allAssignedProcesses")}</h3>
          <Badge variant="secondary">{processCount}</Badge>
        </div>

        {processCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-card">
            <ClipboardListIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">{t("noProcesses")}</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {t("noProcessesHint")}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {processes.map((process) => {
              const stepCount = stepCounts.get(process.id) || 0;
              const initials = process.assignedBy
                ? initialsFor(process.assignedBy)
                : "?";
              return (
                <Link
                  key={process.id}
                  href={`/operator/processes/${process.id}`}
                >
                  <div className="group h-full rounded-lg border bg-card p-4 hover:border-border/80 hover:shadow-md transition-all cursor-pointer flex flex-col gap-2">
                    <h4 className="text-base font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {process.title}
                    </h4>
                    {process.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {process.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-2 mt-auto border-t">
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
                        <span className="inline-flex items-center justify-center size-5 rounded-full bg-muted-foreground/10 text-[9px] font-bold text-muted-foreground shrink-0">
                          {initials}
                        </span>
                        <span className="truncate">
                          {process.assignedBy
                            ? t("assignedBy", { name: process.assignedBy })
                            : ""}
                        </span>
                      </span>
                      {stepCount > 0 && (
                        <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums shrink-0">
                          <ListChecksIcon className="size-3" />
                          {stepCount} {stepCount === 1 ? "step" : "steps"}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
