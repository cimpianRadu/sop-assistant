import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardListIcon, PlayIcon, ArrowRightIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

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

  // Get processes with assignment info (who assigned them)
  const { data: assignments } = await supabase
    .from("process_assignments")
    .select(
      "process_id, assigned_by, profiles!process_assignments_assigned_by_fkey(full_name, email), processes(id, title, description, created_at)"
    )
    .eq("operator_id", session.user_id)
    .order("created_at", { ascending: false });

  type ProcessJoin = { id: string; title: string; description: string; created_at: string };
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

  // Get execution stats for this operator
  const { count: totalCount } = await supabase
    .from("executions")
    .select("*", { count: "exact", head: true })
    .eq("operator_id", session.user_id);

  const { count: completedCount } = await supabase
    .from("executions")
    .select("*", { count: "exact", head: true })
    .eq("operator_id", session.user_id)
    .eq("status", "completed");

  const { count: inProgressCount } = await supabase
    .from("executions")
    .select("*", { count: "exact", head: true })
    .eq("operator_id", session.user_id)
    .eq("status", "in_progress");

  const totalExecutions = totalCount || 0;
  const completedExecutions = completedCount || 0;
  const inProgressExecutions = inProgressCount || 0;

  // Fetch in-progress executions with process info
  const { data: activeExecutions } = await supabase
    .from("executions")
    .select("id, process_id, started_at, processes(title)")
    .eq("operator_id", session.user_id)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false });

  type ActiveExecution = {
    id: string;
    process_id: string;
    started_at: string;
    processes: { title: string };
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("assignedProcesses")}</h2>

      {/* Execution stats */}
      {totalExecutions > 0 && (
        <div className="inline-flex flex-col sm:flex-row gap-1 sm:gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-muted-foreground dark:border-amber-900/50 dark:bg-amber-950/20">
          <span>
            {ta("totalExecutions")}:{" "}
            <span className="font-medium text-foreground">
              {totalExecutions}
            </span>
          </span>
          <span className="text-amber-300 dark:text-amber-800 hidden sm:inline">|</span>
          <span>
            {ta("completedExecutions")}:{" "}
            <span className="font-medium text-foreground">
              {completedExecutions}
            </span>
          </span>
          <span className="text-amber-300 dark:text-amber-800 hidden sm:inline">|</span>
          <span>
            {ta("inProgressExecutions")}:{" "}
            <span className="font-medium text-foreground">
              {inProgressExecutions}
            </span>
          </span>
        </div>
      )}

      {/* In Progress section */}
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
                <Card className="border-primary/30 bg-primary/5 hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{exec.processes.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {t("startedOn", { date: new Date(exec.started_at).toLocaleDateString(locale) })}
                    </p>
                    <Button size="sm" variant="default" className="mt-2 gap-1.5 w-fit">
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
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">{t("allAssignedProcesses")}</h3>
        <Badge variant="secondary">{processCount}</Badge>
      </div>

      {processCount === 0 ? (
        <EmptyState
          icon={ClipboardListIcon}
          title={t("noProcesses")}
          description={t("noProcessesHint")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {processes.map((process) => (
            <Link
              key={process.id}
              href={`/operator/processes/${process.id}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{process.title}</CardTitle>
                  {process.assignedBy && (
                    <p className="text-xs text-muted-foreground pt-1">
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
  );
}
