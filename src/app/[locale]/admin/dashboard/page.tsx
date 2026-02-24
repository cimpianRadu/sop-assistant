import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { OrgStats } from "@/components/admin/org-stats";
import { ProcessList } from "@/components/manager/process-list";
import { EscalationList } from "@/components/manager/escalation-list";
import type { ProcessWithCreator, HelpRequestWithDetails } from "@/lib/types";

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Admin");
  const tm = await getTranslations("Manager");
  const session = await getSessionContext();

  if (!session) return null;

  const supabase = await createClient();

  // Get org member count
  const { count: memberCount } = await supabase
    .from("org_members")
    .select("*", { count: "exact", head: true })
    .eq("org_id", session.org_id);

  // Get all org processes
  const { data: processes } = await supabase
    .from("processes")
    .select("*, profiles!created_by(email, full_name)")
    .eq("org_id", session.org_id)
    .order("created_at", { ascending: false });

  const processIds = (processes || []).map((p) => p.id);
  let totalExecutions = 0;
  let completedExecutions = 0;

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

    totalExecutions = totalCount || 0;
    completedExecutions = completedCount || 0;
  }

  // Get escalations
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
      <div>
        <h2 className="text-2xl font-bold">{session.org_name}</h2>
        <p className="text-muted-foreground">{t("dashboard")}</p>
      </div>

      <OrgStats
        memberCount={memberCount || 0}
        processCount={(processes || []).length}
        totalExecutions={totalExecutions}
        completedExecutions={completedExecutions}
      />

      <div className="flex gap-3">
        <Link href="/admin/members">
          <Button variant="outline">{t("manageMembers")}</Button>
        </Link>
        <Link href="/manager/processes/new">
          <Button>{tm("newProcess")}</Button>
        </Link>
      </div>

      <EscalationList
        escalations={(escalations as HelpRequestWithDetails[]) || []}
      />

      <div>
        <h3 className="text-lg font-semibold mb-4">{t("processes")}</h3>
        <ProcessList processes={(processes as ProcessWithCreator[]) || []} />
      </div>
    </div>
  );
}
