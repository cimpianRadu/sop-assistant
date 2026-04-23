import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { Link } from "@/i18n/navigation";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
import { ProfileForm } from "@/components/shared/profile-form";
import { ProfileStats } from "@/components/shared/profile-stats";
import { ExecutionTrendChart } from "@/components/shared/execution-trend-chart";
import { DeleteAccountSection } from "@/components/shared/delete-account-section";
import { ChevronRightIcon } from "lucide-react";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Profile");
  const tc = await getTranslations("Common");
  const tn = await getTranslations("Nav");
  const session = await getSessionContext();
  if (!session) return null;

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, created_at")
    .eq("id", session.user_id)
    .single();

  const stats = await getStatsForRole(
    supabase,
    session.role,
    session.org_id,
    session.user_id
  );

  // Monthly trend data — last 6 months of executions
  const trendData = await getTrendData(
    supabase,
    session.role,
    session.org_id,
    session.user_id
  );

  return (
    <div className="max-w-3xl space-y-6">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-muted-foreground overflow-x-auto"
      >
        <Link
          href={`/${session.role}/dashboard`}
          className="hover:text-foreground shrink-0"
        >
          {tc("dashboard")}
        </Link>
        <ChevronRightIcon className="size-3.5 shrink-0" />
        <span className="text-foreground">{tn("profile")}</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

      <ProfileForm
        fullName={profile?.full_name ?? null}
        email={session.email}
        role={session.role}
        orgName={session.org_name}
        memberSince={profile?.created_at ?? ""}
        locale={locale}
      />

      <div>
        <h2 className="text-lg font-semibold mb-4">{t("yourStats")}</h2>
        <ProfileStats stats={stats} />
      </div>

      {trendData.length > 0 && (
        <ExecutionTrendChart data={trendData} locale={locale} />
      )}

      <DeleteAccountSection />

      <div className="pt-4 border-t text-sm text-muted-foreground flex items-center gap-4 flex-wrap">
        <Link href="/terms" className="hover:text-foreground">
          {tc("terms")}
        </Link>
        <Link href="/privacy" className="hover:text-foreground">
          {tc("privacy")}
        </Link>
        <a href="mailto:hello@sopia.xyz" className="hover:text-foreground">
          {tc("contactUs")}
        </a>
      </div>
    </div>
  );
}

type Stat = {
  labelKey: string;
  descKey: string;
  value: number | string;
};

async function getStatsForRole(
  supabase: SupabaseClient,
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
  const rate = total > 0 ? `${Math.round((completed / total) * 100)}%` : "—";

  return [
    { labelKey: "executionsCompleted", descKey: "executionsCompletedDesc", value: completed },
    { labelKey: "completionRate", descKey: "completionRateDesc", value: rate },
    { labelKey: "helpRequests", descKey: "helpRequestsDesc", value: helpCount || 0 },
  ];
}

type TrendPoint = {
  month: string;
  started: number;
  completed: number;
};

async function getTrendData(
  supabase: SupabaseClient,
  role: string,
  orgId: string,
  userId: string
): Promise<TrendPoint[]> {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  let query = supabase
    .from("executions")
    .select("started_at, completed_at, process_id, operator_id, processes(org_id)")
    .gte("started_at", sixMonthsAgo.toISOString());

  if (role === "operator") {
    query = query.eq("operator_id", userId);
  } else {
    // Admin/manager: all executions for the org
    const { data: processes } = await supabase
      .from("processes")
      .select("id")
      .eq("org_id", orgId);
    const ids = (processes || []).map((p: { id: string }) => p.id);
    if (ids.length === 0) return [];
    query = query.in("process_id", ids);
  }

  const { data: executions } = await query;
  if (!executions) return [];

  // Group by month
  const buckets = new Map<string, { started: number; completed: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, { started: 0, completed: 0 });
  }

  for (const exec of executions as { started_at: string; completed_at: string | null }[]) {
    const d = new Date(exec.started_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const b = buckets.get(key);
    if (b) {
      b.started += 1;
      if (exec.completed_at) b.completed += 1;
    }
  }

  return Array.from(buckets.entries()).map(([key, b]) => {
    const [y, m] = key.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return {
      month: d.toLocaleDateString("en", { month: "short" }),
      started: b.started,
      completed: b.completed,
    };
  });
}
