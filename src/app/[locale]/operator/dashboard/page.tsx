import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardListIcon, PlayIcon, ArrowRightIcon } from "lucide-react";

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

  const [
    { data: assignments },
    { count: totalCount },
    { count: completedCount },
    { count: inProgressCount },
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
    };
  });

  const processCount = processes.length;
  const totalExecutions = totalCount || 0;
  const completedExecutions = completedCount || 0;
  const inProgressExecutions = inProgressCount || 0;

  type ActiveExecution = {
    id: string;
    process_id: string;
    started_at: string;
    processes: { title: string };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t("assignedProcesses")}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {session.org_name}
        </p>
      </div>

      {/* Stat cards */}
      {totalExecutions > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-lg border bg-card px-3 sm:px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {ta("totalExecutions")}
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {totalExecutions}
            </p>
          </div>
          <div className="rounded-lg border bg-card px-3 sm:px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {ta("inProgressExecutions")}
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {inProgressExecutions}
            </p>
          </div>
          <div className="rounded-lg border bg-card px-3 sm:px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {ta("completedExecutions")}
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1 text-primary">
              {completedExecutions}
            </p>
          </div>
        </div>
      )}

      {/* In Progress (prioritised — top) */}
      {activeExecutions && activeExecutions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <PlayIcon className="size-4 text-primary" />
            <h3 className="font-semibold">{t("inProgressSection")}</h3>
            <Badge variant="secondary">{activeExecutions.length}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(activeExecutions as unknown as ActiveExecution[]).map((exec) => (
              <Link
                key={exec.id}
                href={`/operator/processes/${exec.process_id}/execute/${exec.id}`}
              >
                <Card className="border-primary/40 bg-primary/5 hover:shadow-md hover:border-primary/60 transition-all cursor-pointer">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {exec.processes.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {t("startedOn", {
                        date: new Date(exec.started_at).toLocaleDateString(
                          locale,
                          { month: "short", day: "numeric" }
                        ),
                      })}
                    </p>
                    <Button
                      size="sm"
                      variant="default"
                      className="mt-2 gap-1.5 w-fit"
                    >
                      {t("continueExecution")}
                      <ArrowRightIcon className="size-3.5" />
                    </Button>
                  </CardHeader>
                </Card>
              </Link>
            ))}
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
            {processes.map((process) => (
              <Link key={process.id} href={`/operator/processes/${process.id}`}>
                <Card className="hover:shadow-md hover:border-border/80 transition-all cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="text-base leading-snug line-clamp-2">
                      {process.title}
                    </CardTitle>
                    {process.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {process.description}
                      </p>
                    )}
                    {process.assignedBy && (
                      <p className="text-xs text-muted-foreground/70 pt-2">
                        {t("assignedBy", { name: process.assignedBy })}
                      </p>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
