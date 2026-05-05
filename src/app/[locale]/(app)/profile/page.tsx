import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { Link } from "@/i18n/navigation";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
import { ProfileForm } from "@/components/shared/profile-form";
import { ProfileStats, type Stat } from "@/components/shared/profile-stats";
import { ExecutionTrendChart } from "@/components/shared/execution-trend-chart";
import { CompletionRateChart } from "@/components/shared/completion-rate-chart";
import {
  TopProcessesCard,
  type TopProcess,
} from "@/components/shared/top-processes-card";
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
    session.user_id,
    locale
  );

  const topProcesses = await getTopProcesses(
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

      {trendData.length > 0 && <CompletionRateChart data={trendData} />}

      {topProcesses.length > 0 && <TopProcessesCard items={topProcesses} />}

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

// ── Delta helpers ───────────────────────────────────────────────────────
function buildCountDelta(current: number, prior: number): Stat["delta"] {
  const diff = current - prior;
  return {
    value: Math.abs(diff),
    unit: "runs",
    direction: diff > 0 ? "up" : diff < 0 ? "down" : "flat",
  };
}

function buildRateDelta(
  currCompleted: number,
  currTotal: number,
  priorCompleted: number,
  priorTotal: number
): Stat["delta"] | undefined {
  if (currTotal === 0 && priorTotal === 0) return undefined;
  const currRate = currTotal > 0 ? (currCompleted / currTotal) * 100 : 0;
  const priorRate = priorTotal > 0 ? (priorCompleted / priorTotal) * 100 : 0;
  const diff = Math.round(currRate - priorRate);
  return {
    value: Math.abs(diff),
    unit: "points",
    direction: diff > 0 ? "up" : diff < 0 ? "down" : "flat",
  };
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function getStatsForRole(
  supabase: SupabaseClient,
  role: string,
  orgId: string,
  userId: string
): Promise<Stat[]> {
  const now = Date.now();
  const since30 = new Date(now - 30 * MS_PER_DAY).toISOString();
  const since60 = new Date(now - 60 * MS_PER_DAY).toISOString();

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
    let curTotal = 0;
    let curCompleted = 0;
    let prevTotal = 0;
    let prevCompleted = 0;

    if (processIds.length > 0) {
      const [total, completed, cTotal, cCompleted, pTotal, pCompleted] =
        await Promise.all([
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
            .gte("started_at", since30),
          supabase
            .from("executions")
            .select("*", { count: "exact", head: true })
            .in("process_id", processIds)
            .eq("status", "completed")
            .gte("started_at", since30),
          supabase
            .from("executions")
            .select("*", { count: "exact", head: true })
            .in("process_id", processIds)
            .gte("started_at", since60)
            .lt("started_at", since30),
          supabase
            .from("executions")
            .select("*", { count: "exact", head: true })
            .in("process_id", processIds)
            .eq("status", "completed")
            .gte("started_at", since60)
            .lt("started_at", since30),
        ]);
      totalExec = total.count || 0;
      completedExec = completed.count || 0;
      curTotal = cTotal.count || 0;
      curCompleted = cCompleted.count || 0;
      prevTotal = pTotal.count || 0;
      prevCompleted = pCompleted.count || 0;
    }

    const rate =
      totalExec > 0
        ? `${Math.round((completedExec / totalExec) * 100)}%`
        : "—";

    return [
      {
        labelKey: "orgMembers",
        descKey: "orgMembersDesc",
        value: memberCount || 0,
      },
      {
        labelKey: "orgProcesses",
        descKey: "orgProcessesDesc",
        value: (processes || []).length,
      },
      {
        labelKey: "totalExecutions",
        descKey: "totalExecutionsDesc",
        value: totalExec,
        delta: buildCountDelta(curTotal, prevTotal),
      },
      {
        labelKey: "completionRate",
        descKey: "completionRateDesc",
        value: rate,
        delta: buildRateDelta(
          curCompleted,
          curTotal,
          prevCompleted,
          prevTotal
        ),
      },
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
    let curTotal = 0;
    let curCompleted = 0;
    let prevTotal = 0;
    let prevCompleted = 0;

    if (processIds.length > 0) {
      const [total, completed, cTotal, cCompleted, pTotal, pCompleted] =
        await Promise.all([
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
            .gte("started_at", since30),
          supabase
            .from("executions")
            .select("*", { count: "exact", head: true })
            .in("process_id", processIds)
            .eq("status", "completed")
            .gte("started_at", since30),
          supabase
            .from("executions")
            .select("*", { count: "exact", head: true })
            .in("process_id", processIds)
            .gte("started_at", since60)
            .lt("started_at", since30),
          supabase
            .from("executions")
            .select("*", { count: "exact", head: true })
            .in("process_id", processIds)
            .eq("status", "completed")
            .gte("started_at", since60)
            .lt("started_at", since30),
        ]);
      totalExec = total.count || 0;
      completedExec = completed.count || 0;
      curTotal = cTotal.count || 0;
      curCompleted = cCompleted.count || 0;
      prevTotal = pTotal.count || 0;
      prevCompleted = pCompleted.count || 0;
    }

    const rate =
      totalExec > 0
        ? `${Math.round((completedExec / totalExec) * 100)}%`
        : "—";

    return [
      {
        labelKey: "sopsCreated",
        descKey: "sopsCreatedDesc",
        value: (processes || []).length,
      },
      {
        labelKey: "executionsManaged",
        descKey: "executionsManagedDesc",
        value: totalExec,
        delta: buildCountDelta(curTotal, prevTotal),
      },
      {
        labelKey: "completionRate",
        descKey: "completionRateDesc",
        value: rate,
        delta: buildRateDelta(
          curCompleted,
          curTotal,
          prevCompleted,
          prevTotal
        ),
      },
    ];
  }

  // Operator
  const [total, completed, help, cTotal, cCompleted, pTotal, pCompleted] =
    await Promise.all([
      supabase
        .from("executions")
        .select("*", { count: "exact", head: true })
        .eq("operator_id", userId),
      supabase
        .from("executions")
        .select("*", { count: "exact", head: true })
        .eq("operator_id", userId)
        .eq("status", "completed"),
      supabase
        .from("help_requests")
        .select("*", { count: "exact", head: true })
        .eq("operator_id", userId),
      supabase
        .from("executions")
        .select("*", { count: "exact", head: true })
        .eq("operator_id", userId)
        .gte("started_at", since30),
      supabase
        .from("executions")
        .select("*", { count: "exact", head: true })
        .eq("operator_id", userId)
        .eq("status", "completed")
        .gte("started_at", since30),
      supabase
        .from("executions")
        .select("*", { count: "exact", head: true })
        .eq("operator_id", userId)
        .gte("started_at", since60)
        .lt("started_at", since30),
      supabase
        .from("executions")
        .select("*", { count: "exact", head: true })
        .eq("operator_id", userId)
        .eq("status", "completed")
        .gte("started_at", since60)
        .lt("started_at", since30),
    ]);

  const totalExec = total.count || 0;
  const completedExec = completed.count || 0;
  const rate =
    totalExec > 0 ? `${Math.round((completedExec / totalExec) * 100)}%` : "—";
  const curTotal = cTotal.count || 0;
  const curCompleted = cCompleted.count || 0;
  const prevTotal = pTotal.count || 0;
  const prevCompleted = pCompleted.count || 0;

  return [
    {
      labelKey: "executionsCompleted",
      descKey: "executionsCompletedDesc",
      value: completedExec,
      delta: buildCountDelta(curCompleted, prevCompleted),
    },
    {
      labelKey: "completionRate",
      descKey: "completionRateDesc",
      value: rate,
      delta: buildRateDelta(curCompleted, curTotal, prevCompleted, prevTotal),
    },
    {
      labelKey: "helpRequests",
      descKey: "helpRequestsDesc",
      value: help.count || 0,
    },
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
  userId: string,
  locale: string
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
      month: d.toLocaleDateString(locale, { month: "short" }),
      started: b.started,
      completed: b.completed,
    };
  });
}

async function getTopProcesses(
  supabase: SupabaseClient,
  role: string,
  orgId: string,
  userId: string
): Promise<TopProcess[]> {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  let query = supabase
    .from("executions")
    .select("process_id, processes(id, title, org_id)")
    .gte("started_at", sixMonthsAgo.toISOString());

  if (role === "operator") {
    query = query.eq("operator_id", userId);
  } else {
    const { data: processes } = await supabase
      .from("processes")
      .select("id")
      .eq("org_id", orgId);
    const ids = (processes || []).map((p: { id: string }) => p.id);
    if (ids.length === 0) return [];
    query = query.in("process_id", ids);
  }

  const { data: rows } = await query;
  if (!rows) return [];

  const byProcess = new Map<string, { title: string; count: number }>();
  for (const r of rows as {
    process_id: string;
    processes:
      | { id: string; title: string }
      | { id: string; title: string }[]
      | null;
  }[]) {
    const p = Array.isArray(r.processes) ? r.processes[0] : r.processes;
    if (!p) continue;
    const existing = byProcess.get(p.id);
    if (existing) existing.count += 1;
    else byProcess.set(p.id, { title: p.title, count: 1 });
  }

  const hrefBase =
    role === "admin" || role === "manager" ? "/manager/processes" : "/operator/processes";

  return Array.from(byProcess.entries())
    .map(([id, { title, count }]) => ({
      id,
      title,
      count,
      href: `${hrefBase}/${id}` as const,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
