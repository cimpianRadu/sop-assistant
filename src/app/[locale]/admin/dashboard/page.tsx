import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProcessList } from "@/components/manager/process-list";
import { EscalationList } from "@/components/manager/escalation-list";
import { MemberList } from "@/components/admin/member-list";
import type {
  ProcessWithCreator,
  HelpRequestWithDetails,
  OrgMemberWithProfile,
} from "@/lib/types";

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Admin");
  const tc = await getTranslations("Common");
  const tm = await getTranslations("Manager");
  const session = await getSessionContext();

  if (!session) return null;

  const supabase = await createClient();

  // Get org details (for created_at)
  const { data: org } = await supabase
    .from("organizations")
    .select("created_at")
    .eq("id", session.org_id)
    .single();

  // Get org members
  const { data: members } = await supabase
    .from("org_members")
    .select("*, profiles!org_members_user_id_fkey(email, full_name)")
    .eq("org_id", session.org_id)
    .order("joined_at", { ascending: true });

  const memberCount = (members || []).length;

  // Get all org processes
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

  const allProcesses = (processes as ProcessWithCreator[]) || [];
  const PROCESS_LIMIT = 6;
  const visibleProcesses = allProcesses.slice(0, PROCESS_LIMIT);

  const orgDate = org?.created_at
    ? new Date(org.created_at).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Org header */}
      <div>
        <h2 className="text-2xl font-bold">{session.org_name}</h2>
        {orgDate && (
          <p className="text-sm text-muted-foreground">
            {t("createdAt", { date: orgDate })}
          </p>
        )}
      </div>

      {/* Processes section with inline stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{t("processes")}</h3>
            <Badge variant="secondary">{processCount}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/manager/processes">
              <Button variant="ghost" size="sm">
                {tc("viewAll")}
              </Button>
            </Link>
            <Link href="/manager/processes/new">
              <Button size="sm">{tm("newProcess")}</Button>
            </Link>
          </div>
        </div>
        <div className="inline-flex flex-col sm:flex-row gap-1 sm:gap-3 mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-muted-foreground dark:border-amber-900/50 dark:bg-amber-950/20">
          <span>
            {t("totalExecutions")}:{" "}
            <span className="font-medium text-foreground">
              {totalExecutions}
            </span>
          </span>
          <span className="text-amber-300 dark:text-amber-800 hidden sm:inline">|</span>
          <span>
            {t("completedExecutions")}:{" "}
            <span className="font-medium text-foreground">
              {completedExecutions}
            </span>
          </span>
          <span className="text-amber-300 dark:text-amber-800 hidden sm:inline">|</span>
          <span>
            {t("inProgressExecutions")}:{" "}
            <span className="font-medium text-foreground">
              {inProgressExecutions}
            </span>
          </span>
        </div>
        <ProcessList processes={visibleProcesses} />
      </div>

      {/* Escalations — always visible */}
      <EscalationList
        escalations={(escalations as HelpRequestWithDetails[]) || []}
      />

      {/* Members section with count in header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{t("members")}</h3>
            <Badge variant="secondary">{memberCount}</Badge>
          </div>
          <Link href="/admin/members">
            <Button variant="outline" size="sm">
              {t("manageMembers")}
            </Button>
          </Link>
        </div>
        <MemberList
          members={(members as OrgMemberWithProfile[]) || []}
          currentUserId={session.user_id}
        />
      </div>
    </div>
  );
}
