import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { ProcessList } from "@/components/manager/process-list";
import { EscalationList } from "@/components/manager/escalation-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
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
  let escalations: HelpRequestWithDetails[] | null = null;

  if (processIds.length > 0) {
    const [
      { count: totalCount },
      { count: completedCount },
      { count: inProgressCount },
      { data: escalationsData },
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
        .from("help_requests")
        .select(
          "*, profiles(email), processes(title), checklist_steps(step_text, step_number)"
        )
        .eq("escalated", true)
        .eq("resolved", false)
        .in("process_id", processIds)
        .order("created_at", { ascending: false }),
    ]);

    totalExecutions = totalCount || 0;
    completedExecutions = completedCount || 0;
    inProgressExecutions = inProgressCount || 0;
    escalations = escalationsData;
  }

  const openEscalationsCount = (escalations || []).length;

  return (
    <div className="space-y-6">
      {/* Org header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{session.org_name}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("yourProcesses")}
        </p>
      </div>

      {/* Stat cards — 4 metrics including escalations */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="rounded-lg border bg-card px-3 sm:px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {ta("totalExecutions")}
          </p>
          <p className="text-2xl font-bold tabular-nums mt-1">{totalExecutions}</p>
        </div>
        <div className="rounded-lg border bg-card px-3 sm:px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {ta("inProgressExecutions")}
          </p>
          <p className="text-2xl font-bold tabular-nums mt-1">{inProgressExecutions}</p>
        </div>
        <div className="rounded-lg border bg-card px-3 sm:px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {ta("completedExecutions")}
          </p>
          <p className="text-2xl font-bold tabular-nums mt-1 text-primary">
            {completedExecutions}
          </p>
        </div>
        <div
          className={`rounded-lg border px-3 sm:px-4 py-3 ${
            openEscalationsCount > 0
              ? "border-destructive/40 bg-destructive/5"
              : "bg-card"
          }`}
        >
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            {openEscalationsCount > 0 && (
              <AlertTriangle className="size-3.5 text-destructive" />
            )}
            {ta("openEscalations")}
          </p>
          <p
            className={`text-2xl font-bold tabular-nums mt-1 ${
              openEscalationsCount > 0 ? "text-destructive" : ""
            }`}
          >
            {openEscalationsCount}
          </p>
        </div>
      </div>

      {/* Escalations — TOP when open */}
      {openEscalationsCount > 0 && (
        <EscalationList
          escalations={(escalations as HelpRequestWithDetails[]) || []}
        />
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
        <EscalationList
          escalations={(escalations as HelpRequestWithDetails[]) || []}
        />
      )}
    </div>
  );
}
