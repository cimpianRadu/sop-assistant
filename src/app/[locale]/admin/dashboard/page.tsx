import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProcessList } from "@/components/manager/process-list";
import { EscalationList } from "@/components/manager/escalation-list";
import { MemberList } from "@/components/admin/member-list";
import { AlertTriangle } from "lucide-react";
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

  const [{ data: org }, { data: members }, { data: processes }] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("created_at")
        .eq("id", session.org_id)
        .single(),
      supabase
        .from("org_members")
        .select("*, profiles!org_members_user_id_fkey(email, full_name)")
        .eq("org_id", session.org_id)
        .order("joined_at", { ascending: true }),
      supabase
        .from("processes")
        .select("*, profiles!created_by(email, full_name)")
        .eq("org_id", session.org_id)
        .order("created_at", { ascending: false }),
    ]);

  const memberCount = (members || []).length;
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
  const allProcesses = (processes as ProcessWithCreator[]) || [];
  const PROCESS_LIMIT = 6;
  const visibleProcesses = allProcesses.slice(0, PROCESS_LIMIT);

  const orgDate = org?.created_at
    ? new Date(org.created_at).toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Org header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{session.org_name}</h2>
        {orgDate && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("createdAt", { date: orgDate })} · {memberCount} {memberCount === 1 ? "member" : "members"} · {processCount} {processCount === 1 ? "process" : "processes"}
          </p>
        )}
      </div>

      {/* Stat cards — promoted from the buried amber pill */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="rounded-lg border bg-card px-3 sm:px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {t("totalExecutions")}
          </p>
          <p className="text-2xl font-bold tabular-nums mt-1">{totalExecutions}</p>
        </div>
        <div className="rounded-lg border bg-card px-3 sm:px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {t("inProgressExecutions")}
          </p>
          <p className="text-2xl font-bold tabular-nums mt-1">{inProgressExecutions}</p>
        </div>
        <div className="rounded-lg border bg-card px-3 sm:px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {t("completedExecutions")}
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
            {t("openEscalations")}
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

      {/* Escalations — moved to TOP when there are any */}
      {openEscalationsCount > 0 && (
        <EscalationList
          escalations={(escalations as HelpRequestWithDetails[]) || []}
        />
      )}

      {/* Processes section */}
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
        <ProcessList processes={visibleProcesses} />
      </div>

      {/* Members section */}
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

      {/* Empty-state escalations card — only shown when clear (confidence signal) */}
      {openEscalationsCount === 0 && (
        <EscalationList
          escalations={(escalations as HelpRequestWithDetails[]) || []}
        />
      )}
    </div>
  );
}
