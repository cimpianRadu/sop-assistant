import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardListIcon } from "lucide-react";
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

  return (
    <div className="space-y-6">
      {/* Header with process count */}
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">{t("assignedProcesses")}</h2>
        <Badge variant="secondary">{processCount}</Badge>
      </div>

      {/* Execution stats */}
      {totalExecutions > 0 && (
        <div className="inline-flex flex-wrap gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-muted-foreground dark:border-amber-900/50 dark:bg-amber-950/20">
          <span>
            {ta("totalExecutions")}:{" "}
            <span className="font-medium text-foreground">
              {totalExecutions}
            </span>
          </span>
          <span className="text-amber-300 dark:text-amber-800">|</span>
          <span>
            {ta("completedExecutions")}:{" "}
            <span className="font-medium text-foreground">
              {completedExecutions}
            </span>
          </span>
          <span className="text-amber-300 dark:text-amber-800">|</span>
          <span>
            {ta("inProgressExecutions")}:{" "}
            <span className="font-medium text-foreground">
              {inProgressExecutions}
            </span>
          </span>
        </div>
      )}

      {/* Process cards */}
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
