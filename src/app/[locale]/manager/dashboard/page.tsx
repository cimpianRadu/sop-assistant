import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { ProcessList } from "@/components/manager/process-list";
import { AnalyticsCards } from "@/components/manager/analytics-cards";
import { EscalationList } from "@/components/manager/escalation-list";
import { Button } from "@/components/ui/button";
import type { ProcessWithCreator, HelpRequestWithDetails } from "@/lib/types";

export default async function ManagerDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Manager");

  const session = await getSessionContext();
  if (!session) return null;

  const supabase = await createClient();

  // All processes in the org (managers and admins can see all)
  const { data: processes } = await supabase
    .from("processes")
    .select("*, profiles!created_by(email, full_name)")
    .eq("org_id", session.org_id)
    .order("created_at", { ascending: false });

  const processIds = (processes || []).map((p) => p.id);
  let totalExecutions = 0;
  let completedExecutions = 0;
  let inProgressExecutions = 0;

  if (processIds.length > 0) {
    const { count: totalCount } = await supabase.from("executions").select("*", { count: "exact", head: true }).in("process_id", processIds);
    const { count: completedCount } = await supabase.from("executions").select("*", { count: "exact", head: true }).in("process_id", processIds).eq("status", "completed");
    const { count: inProgressCount } = await supabase.from("executions").select("*", { count: "exact", head: true }).in("process_id", processIds).eq("status", "in_progress");
    totalExecutions = totalCount || 0;
    completedExecutions = completedCount || 0;
    inProgressExecutions = inProgressCount || 0;
  }

  const { data: escalations } = await supabase
    .from("help_requests")
    .select("*, profiles(email), processes(title), checklist_steps(step_text, step_number)")
    .eq("escalated", true)
    .eq("resolved", false)
    .in("process_id", processIds.length > 0 ? processIds : ["none"])
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <AnalyticsCards totalProcesses={(processes || []).length} totalExecutions={totalExecutions} completedExecutions={completedExecutions} inProgressExecutions={inProgressExecutions} />
      <EscalationList escalations={(escalations as HelpRequestWithDetails[]) || []} />
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("yourProcesses")}</h2>
        <Link href="/manager/processes/new"><Button>{t("newProcess")}</Button></Link>
      </div>
      <ProcessList processes={(processes as ProcessWithCreator[]) || []} />
    </div>
  );
}
