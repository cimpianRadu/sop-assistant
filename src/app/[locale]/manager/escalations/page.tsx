import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { EscalationList } from "@/components/manager/escalation-list";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
} from "lucide-react";
import type { HelpRequestWithDetails } from "@/lib/types";

export default async function EscalationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Escalations");
  const tc = await getTranslations("Common");
  const session = await getSessionContext();
  if (!session) return null;

  const supabase = await createClient();

  // Fetch all org process ids for scoping
  const { data: processes } = await supabase
    .from("processes")
    .select("id")
    .eq("org_id", session.org_id);
  const processIds = (processes || []).map((p) => p.id);

  let openEscalations: HelpRequestWithDetails[] = [];
  let resolvedEscalations: HelpRequestWithDetails[] = [];

  if (processIds.length > 0) {
    const [{ data: open }, { data: resolved }] = await Promise.all([
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
        .from("help_requests")
        .select(
          "*, profiles(email), processes(title), checklist_steps(step_text, step_number)"
        )
        .eq("escalated", true)
        .eq("resolved", true)
        .in("process_id", processIds)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    openEscalations = (open as HelpRequestWithDetails[]) || [];
    resolvedEscalations = (resolved as HelpRequestWithDetails[]) || [];
  }

  // eslint-disable-next-line react-hooks/purity -- server component, runs per-request
  const nowMs = Date.now();
  const oldestOpenDays =
    openEscalations.length > 0
      ? Math.floor(
          (nowMs -
            new Date(
              openEscalations[openEscalations.length - 1].created_at
            ).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  return (
    <div className="max-w-5xl space-y-6">
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
        <span className="text-foreground">{t("pageTitle")}</span>
      </nav>

      {/* Head */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("pageTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("pageSubtitle")}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-md">
        <StatCard
          label={t("tabOpen")}
          value={openEscalations.length}
          tone={openEscalations.length > 0 ? "danger" : "default"}
          icon={openEscalations.length > 0 ? AlertTriangleIcon : undefined}
          delta={
            openEscalations.length > 0
              ? oldestOpenDays === 0
                ? "opened today"
                : `${oldestOpenDays} ${oldestOpenDays === 1 ? "day" : "days"} old`
              : "All clear"
          }
          deltaTone={openEscalations.length > 0 ? "danger" : "positive"}
        />
        <StatCard
          label={t("tabResolved")}
          value={resolvedEscalations.length}
          tone="primary"
        />
      </div>

      {/* Open */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          {t("tabOpen")}
        </h3>
        <EscalationList escalations={openEscalations} />
      </section>

      {/* Resolved */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          {t("tabResolved")}
        </h3>
        {resolvedEscalations.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={CheckCircle2Icon}
                title={t("noResolvedYet")}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {resolvedEscalations.map((esc) => (
              <div
                key={esc.id}
                className="border rounded-lg p-3 bg-card flex items-start justify-between gap-3 flex-wrap"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{esc.processes.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    &ldquo;{esc.question}&rdquo;
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {esc.profiles.email} ·{" "}
                    {new Date(esc.created_at).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap shrink-0">
                  {t("resolved")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
