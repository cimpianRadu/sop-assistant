import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { ProcessList } from "@/components/manager/process-list";
import { EscalationList } from "@/components/manager/escalation-list";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangleIcon } from "lucide-react";
import type { ProcessWithCreator, HelpRequestWithDetails } from "@/lib/types";

export default async function ManagerDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Manager");
  const ta = await getTranslations("Admin");

  const session = await getSessionContext();
  if (!session) return null;

  const supabase = await createClient();
  // eslint-disable-next-line react-hooks/purity -- server component, runs per-request
  const nowMs = Date.now();
  const weekAgo = new Date(nowMs - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: processes } = await supabase
    .from("processes")
    .select("*, profiles!created_by(email, full_name)")
    .eq("org_id", session.org_id)
    .order("created_at", { ascending: false });

  const processCount = (processes || []).length;
  const processIds = (processes || []).map((p) => p.id);
  let totalExecutions = 0;
  let completedExecutions = 0;
  let inProgressExecutions = 0;
  let thisWeekExecutions = 0;
  let thisMonthCompleted = 0;
  let thisMonthTotal = 0;
  let activeOperators = 0;
  let escalations: HelpRequestWithDetails[] | null = null;

  if (processIds.length > 0) {
    const [
      { count: totalCount },
      { count: completedCount },
      { count: inProgressCount },
      { count: weekCount },
      { count: monthCompleted },
      { count: monthTotal },
      { data: escalationsData },
      { data: activeOps },
    ] = await Promise.all([
      supabase
        .from("executions")
        .select("*", { count: "exact", head: true })
        .in("process_id", processIds),
      supabase
        .from("executions")
        .select("*", { count: "exact", head: true })
        .in("process_id", processIds)
        .eq("status", "completed"),
      supabase
        .from("executions")
        .select("*", { count: "exact", head: true })
        .in("process_id", processIds)
        .eq("status", "in_progress"),
      supabase
        .from("executions")
        .select("*", { count: "exact", head: true })
        .in("process_id", processIds)
        .gte("started_at", weekAgo),
      supabase
        .from("executions")
        .select("*", { count: "exact", head: true })
        .in("process_id", processIds)
        .eq("status", "completed")
        .gte("completed_at", monthAgo),
      supabase
        .from("executions")
        .select("*", { count: "exact", head: true })
        .in("process_id", processIds)
        .gte("started_at", monthAgo),
      supabase
        .from("help_requests")
        .select(
          "*, profiles(email), processes(title), checklist_steps(step_text, step_number)"
        )
        .eq("escalated", true)
        .eq("resolved", false)
        .in("process_id", processIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("executions")
        .select("operator_id")
        .in("process_id", processIds)
        .eq("status", "in_progress"),
    ]);

    totalExecutions = totalCount || 0;
    completedExecutions = completedCount || 0;
    inProgressExecutions = inProgressCount || 0;
    thisWeekExecutions = weekCount || 0;
    thisMonthCompleted = monthCompleted || 0;
    thisMonthTotal = monthTotal || 0;
    escalations = escalationsData;
    activeOperators = new Set(
      (activeOps || []).map((e: { operator_id: string }) => e.operator_id)
    ).size;
  }

  const openEscalationsCount = (escalations || []).length;
  const oldestEscalationDays =
    escalations && escalations.length > 0
      ? Math.floor(
          (nowMs -
            new Date(
              escalations[escalations.length - 1].created_at
            ).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const completionRate =
    thisMonthTotal > 0
      ? Math.round((thisMonthCompleted / thisMonthTotal) * 100)
      : null;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Org header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {session.org_name}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("yourProcesses")}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
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
          delta={
            inProgressExecutions > 0
              ? `${activeOperators} ${activeOperators === 1 ? "operator" : "operators"} active`
              : undefined
          }
          deltaTone="neutral"
        />
        <StatCard
          label={ta("completedExecutions")}
          value={completedExecutions}
          tone="primary"
          delta={
            completionRate !== null
              ? `${completionRate}% this month`
              : undefined
          }
          deltaTone="positive"
        />
        <StatCard
          label={ta("openEscalations")}
          value={openEscalationsCount}
          tone={openEscalationsCount > 0 ? "danger" : "default"}
          icon={openEscalationsCount > 0 ? AlertTriangleIcon : undefined}
          delta={
            openEscalationsCount > 0
              ? oldestEscalationDays === 0
                ? "opened today"
                : `${oldestEscalationDays} ${oldestEscalationDays === 1 ? "day" : "days"} old`
              : ta("allClear")
          }
          deltaTone={openEscalationsCount > 0 ? "danger" : "positive"}
        />
      </div>

      {/* Escalations — TOP when open */}
      {openEscalationsCount > 0 && (
        <div id="escalations">
          <EscalationList
            escalations={(escalations as HelpRequestWithDetails[]) || []}
          />
        </div>
      )}

      {/* Processes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{ta("processes")}</h3>
            <Badge variant="secondary">{processCount}</Badge>
          </div>
          <Link href="/manager/processes/new">
            <Button size="sm">{t("newProcess")}</Button>
          </Link>
        </div>
        <ProcessList processes={(processes as ProcessWithCreator[]) || []} />
      </div>

      {/* Empty-state card when clear */}
      {openEscalationsCount === 0 && (
        <div id="escalations">
          <EscalationList
            escalations={(escalations as HelpRequestWithDetails[]) || []}
          />
        </div>
      )}
    </div>
  );
}
