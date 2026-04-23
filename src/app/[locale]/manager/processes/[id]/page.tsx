import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OperatorAssignments } from "@/components/manager/operator-assignments";
import { StartExecutionButton } from "@/components/manager/start-execution-button";
import { ProcessDetailView } from "@/components/manager/process-detail-view";
import { EditSopButton } from "@/components/manager/edit-sop-button";
import { getSessionContext } from "@/lib/session";
import { formatDuration } from "@/lib/format";
import { sopToHeadings } from "@/lib/sop-toc";
import {
  BotIcon,
  ClockIcon,
  ArrowRightIcon,
  ChevronRightIcon,
} from "lucide-react";
import type {
  ChecklistStep,
  ExecutionWithProfile,
  ProcessAssignmentWithProfile,
} from "@/lib/types";

export default async function ProcessDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Manager");
  const tc = await getTranslations("Common");
  const supabase = await createClient();

  const [{ data: process }, session] = await Promise.all([
    supabase
      .from("processes")
      .select("*, profiles!created_by(email, full_name)")
      .eq("id", id)
      .single(),
    getSessionContext(),
  ]);
  if (!process) notFound();
  if (!session) notFound();

  const [
    { data: steps },
    { data: executions },
    { data: assignments },
    { data: helpCounts },
    { data: orgOperators },
    { count: openEscalationsCount },
  ] = await Promise.all([
    supabase
      .from("checklist_steps")
      .select("*")
      .eq("process_id", id)
      .order("step_number"),
    supabase
      .from("executions")
      .select("*, profiles!executions_operator_id_fkey(email)")
      .eq("process_id", id)
      .order("started_at", { ascending: false }),
    supabase
      .from("process_assignments")
      .select("*, profiles!process_assignments_operator_id_fkey(email)")
      .eq("process_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("help_requests").select("execution_id").eq("process_id", id),
    supabase
      .from("org_members")
      .select("user_id, profiles!org_members_user_id_fkey(email, full_name)")
      .eq("org_id", session.org_id)
      .eq("role", "operator"),
    supabase
      .from("help_requests")
      .select("*", { count: "exact", head: true })
      .eq("process_id", id)
      .eq("escalated", true)
      .eq("resolved", false),
  ]);

  const helpCountMap = new Map<string, number>();
  (helpCounts || []).forEach((hr) => {
    helpCountMap.set(hr.execution_id, (helpCountMap.get(hr.execution_id) || 0) + 1);
  });

  const stepsList = (steps as ChecklistStep[]) || [];
  const toc = sopToHeadings(process.sop_text);
  const hasRuns = (executions || []).length > 0;
  const isActive = hasRuns || (assignments || []).length > 0;

  const creator = process.profiles as unknown as {
    email: string;
    full_name: string | null;
  } | null;
  const creatorName = creator?.full_name || creator?.email || "—";
  const createdDate = new Date(process.created_at).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="max-w-6xl space-y-5">
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
        <Link
          href="/manager/processes"
          className="hover:text-foreground shrink-0"
        >
          {t("yourProcesses")}
        </Link>
        <ChevronRightIcon className="size-3.5 shrink-0" />
        <span className="text-foreground truncate">{process.title}</span>
      </nav>

      {/* Title + actions */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {process.title}
          </h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge
              variant="outline"
              className={
                isActive
                  ? "bg-primary/10 text-primary border-primary/25 text-[10px] uppercase tracking-wide"
                  : "text-[10px] uppercase tracking-wide"
              }
            >
              {isActive ? t("statusActive") : t("statusDraft")}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {t("createdBy", { date: createdDate, name: creatorName })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <EditSopButton />
          <StartExecutionButton processId={id} />
        </div>
      </div>

      {/* Description card */}
      {process.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {process.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main tabbed view + right rail */}
      <ProcessDetailView
        sopText={process.sop_text}
        toc={toc}
        steps={stepsList}
        openEscalationsCount={openEscalationsCount || 0}
      >
        {/* Right rail content: operators + execution history */}
        <OperatorAssignments
          processId={id}
          assignments={(assignments as ProcessAssignmentWithProfile[]) || []}
          operators={(orgOperators || []).map((m) => {
            const profile = m.profiles as unknown as {
              email: string;
              full_name: string | null;
            };
            return {
              id: m.user_id,
              email: profile.email,
              full_name: profile.full_name,
            };
          })}
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("executionHistory")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {!executions || executions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                {t("noExecutions")}
              </p>
            ) : (
              <div className="space-y-1.5">
                {(executions as ExecutionWithProfile[])
                  .slice(0, 5)
                  .map((execution) => {
                    const aiCount = helpCountMap.get(execution.id) || 0;
                    const duration = formatDuration(
                      execution.started_at,
                      execution.completed_at
                    );
                    return (
                      <Link
                        key={execution.id}
                        href={`/manager/processes/${id}/executions/${execution.id}`}
                        className="block"
                      >
                        <div className="group flex items-center justify-between gap-2 border rounded-md px-2.5 py-2 hover:bg-muted/50 transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">
                              {execution.profiles?.email}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {new Date(
                                execution.started_at
                              ).toLocaleDateString(locale, {
                                month: "short",
                                day: "numeric",
                              })}
                              {duration && ` · ${duration}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {aiCount > 0 && (
                              <Badge
                                variant="outline"
                                className="text-[10px] gap-0.5 py-0 px-1.5"
                              >
                                <BotIcon className="size-2.5" />
                                {aiCount}
                              </Badge>
                            )}
                            <Badge
                              variant={
                                execution.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-[10px] py-0 px-1.5"
                            >
                              {execution.status === "completed" ? (
                                <ClockIcon className="size-2.5 hidden" />
                              ) : null}
                              {execution.status === "completed"
                                ? tc("completed")
                                : tc("inProgress")}
                            </Badge>
                            <ArrowRightIcon className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </ProcessDetailView>
    </div>
  );
}
