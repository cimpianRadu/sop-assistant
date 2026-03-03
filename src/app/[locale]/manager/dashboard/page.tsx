import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { ProcessList } from "@/components/manager/process-list";
import { EscalationList } from "@/components/manager/escalation-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const tc = await getTranslations("Common");

  const session = await getSessionContext();
  if (!session) return null;

  const supabase = await createClient();

  // All processes in the org (managers and admins can see all)
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

  if (processIds.length > 0) {
    const { count: totalCount } = await supabase
      .from("executions")
      .select("*", { count: "exact", head: true })
      .in("process_id", processIds);

    const { count: completedCount } = await supabase
      .from("executions")
      .select("*", { count: "exact", head: true })
      .in("process_id", processIds)
      .eq("status", "completed");

    const { count: inProgressCount } = await supabase
      .from("executions")
      .select("*", { count: "exact", head: true })
      .in("process_id", processIds)
      .eq("status", "in_progress");

    totalExecutions = totalCount || 0;
    completedExecutions = completedCount || 0;
    inProgressExecutions = inProgressCount || 0;
  }

  const { data: escalations } = await supabase
    .from("help_requests")
    .select(
      "*, profiles(email), processes(title), checklist_steps(step_text, step_number)"
    )
    .eq("escalated", true)
    .eq("resolved", false)
    .in("process_id", processIds.length > 0 ? processIds : ["none"])
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Org header */}
      <div>
        <h2 className="text-2xl font-bold">{session.org_name}</h2>
        <p className="text-sm text-muted-foreground">
          {t("yourProcesses")}
        </p>
      </div>

      {/* Processes section with inline stats */}
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
        <div className="inline-flex flex-wrap gap-3 mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-muted-foreground dark:border-amber-900/50 dark:bg-amber-950/20">
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
        <ProcessList processes={(processes as ProcessWithCreator[]) || []} />
      </div>

      {/* Escalations — always visible */}
      <EscalationList
        escalations={(escalations as HelpRequestWithDetails[]) || []}
      />
    </div>
  );
}
