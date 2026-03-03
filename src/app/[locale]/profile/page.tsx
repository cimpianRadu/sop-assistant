import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { ProfileForm } from "@/components/shared/profile-form";
import { ProfileStats } from "@/components/shared/profile-stats";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Profile");
  const session = await getSessionContext();
  if (!session) return null;

  const supabase = await createClient();

  // Get profile details (full_name, created_at)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, created_at")
    .eq("id", session.user_id)
    .single();

  // Fetch role-based stats
  const stats = await getStatsForRole(
    supabase,
    session.role,
    session.org_id,
    session.user_id
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <ProfileForm
        fullName={profile?.full_name ?? null}
        email={session.email}
        role={session.role}
        orgName={session.org_name}
        memberSince={profile?.created_at ?? ""}
        locale={locale}
      />

      <h2 className="text-lg font-semibold">{t("yourStats")}</h2>
      <ProfileStats stats={stats} />
    </div>
  );
}

type Stat = {
  labelKey: string;
  descKey: string;
  value: number | string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getStatsForRole(
  supabase: any,
  role: string,
  orgId: string,
  userId: string
): Promise<Stat[]> {
  if (role === "admin") {
    const { count: memberCount } = await supabase
      .from("org_members")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId);

    const { data: processes } = await supabase
      .from("processes")
      .select("id")
      .eq("org_id", orgId);

    const processIds = (processes || []).map((p: { id: string }) => p.id);
    let totalExec = 0;
    let completedExec = 0;

    if (processIds.length > 0) {
      const { count: total } = await supabase
        .from("executions")
        .select("*", { count: "exact", head: true })
        .in("process_id", processIds);
      const { count: completed } = await supabase
        .from("executions")
        .select("*", { count: "exact", head: true })
        .in("process_id", processIds)
        .eq("status", "completed");
      totalExec = total || 0;
      completedExec = completed || 0;
    }

    const rate =
      totalExec > 0 ? `${Math.round((completedExec / totalExec) * 100)}%` : "—";

    return [
      { labelKey: "orgMembers", descKey: "orgMembersDesc", value: memberCount || 0 },
      { labelKey: "orgProcesses", descKey: "orgProcessesDesc", value: (processes || []).length },
      { labelKey: "totalExecutions", descKey: "totalExecutionsDesc", value: totalExec },
      { labelKey: "completionRate", descKey: "completionRateDesc", value: rate },
    ];
  }

  if (role === "manager") {
    const { data: processes } = await supabase
      .from("processes")
      .select("id")
      .eq("org_id", orgId)
      .eq("created_by", userId);

    const processIds = (processes || []).map((p: { id: string }) => p.id);
    let totalExec = 0;
    let completedExec = 0;

    if (processIds.length > 0) {
      const { count: total } = await supabase
        .from("executions")
        .select("*", { count: "exact", head: true })
        .in("process_id", processIds);
      const { count: completed } = await supabase
        .from("executions")
        .select("*", { count: "exact", head: true })
        .in("process_id", processIds)
        .eq("status", "completed");
      totalExec = total || 0;
      completedExec = completed || 0;
    }

    const rate =
      totalExec > 0 ? `${Math.round((completedExec / totalExec) * 100)}%` : "—";

    return [
      { labelKey: "sopsCreated", descKey: "sopsCreatedDesc", value: (processes || []).length },
      { labelKey: "executionsManaged", descKey: "executionsManagedDesc", value: totalExec },
      { labelKey: "completionRate", descKey: "completionRateDesc", value: rate },
    ];
  }

  // Operator
  const { count: totalExec } = await supabase
    .from("executions")
    .select("*", { count: "exact", head: true })
    .eq("operator_id", userId);

  const { count: completedExec } = await supabase
    .from("executions")
    .select("*", { count: "exact", head: true })
    .eq("operator_id", userId)
    .eq("status", "completed");

  const { count: helpCount } = await supabase
    .from("help_requests")
    .select("*", { count: "exact", head: true })
    .eq("operator_id", userId);

  const total = totalExec || 0;
  const completed = completedExec || 0;
  const rate =
    total > 0 ? `${Math.round((completed / total) * 100)}%` : "—";

  return [
    { labelKey: "executionsCompleted", descKey: "executionsCompletedDesc", value: completed },
    { labelKey: "completionRate", descKey: "completionRateDesc", value: rate },
    { labelKey: "helpRequests", descKey: "helpRequestsDesc", value: helpCount || 0 },
  ];
}
