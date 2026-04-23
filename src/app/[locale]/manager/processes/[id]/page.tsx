import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { OperatorAssignments } from "@/components/manager/operator-assignments";
import { StartExecutionButton } from "@/components/manager/start-execution-button";
import { getSessionContext } from "@/lib/session";
import { formatDuration } from "@/lib/format";
import {
  BotIcon,
  ClockIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  ListChecksIcon,
  FileTextIcon,
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
    supabase.from("processes").select("*").eq("id", id).single(),
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
  ]);

  const helpCountMap = new Map<string, number>();
  (helpCounts || []).forEach((hr) => {
    helpCountMap.set(hr.execution_id, (helpCountMap.get(hr.execution_id) || 0) + 1);
  });

  const stepCount = (steps as ChecklistStep[])?.length || 0;
  const createdDate = new Date(process.created_at).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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

      {/* Title block */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {process.title}
          </h2>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            {process.description}
          </p>
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <Badge variant="outline" className="gap-1">
              <ListChecksIcon className="size-3" />
              {t("steps", { count: stepCount })}
            </Badge>
            <span>{tc("created", { date: createdDate })}</span>
          </div>
        </div>
        <div className="shrink-0">
          <StartExecutionButton processId={id} />
        </div>
      </div>

      {/* SOP Document */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon className="size-4 text-muted-foreground" />
            {t("standardProcedure")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MarkdownRenderer content={process.sop_text} />
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecksIcon className="size-4 text-muted-foreground" />
            {t("checklistWithCount", { count: stepCount })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2.5">
            {(steps as ChecklistStep[])?.map((step) => (
              <li
                key={step.id}
                className="flex items-start gap-3 text-sm"
              >
                <span className="flex items-center justify-center shrink-0 mt-0.5 size-6 rounded-full bg-muted text-xs font-semibold tabular-nums">
                  {step.step_number}
                </span>
                <span className="leading-relaxed pt-0.5">{step.step_text}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Assigned operators */}
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

      {/* Execution history */}
      <Card>
        <CardHeader>
          <CardTitle>{t("executionHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!executions || executions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t("noExecutions")}
            </p>
          ) : (
            <div className="space-y-2">
              {(executions as ExecutionWithProfile[]).map((execution) => {
                const aiCount = helpCountMap.get(execution.id) || 0;
                const duration = formatDuration(
                  execution.started_at,
                  execution.completed_at
                );
                const started = new Date(execution.started_at).toLocaleDateString(locale, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                return (
                  <Link
                    key={execution.id}
                    href={`/manager/processes/${id}/executions/${execution.id}`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {execution.profiles?.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tc("started", { date: started })}
                          {duration && <> · {duration}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {duration && (
                          <Badge
                            variant="outline"
                            className="text-xs gap-1 hidden sm:inline-flex"
                          >
                            <ClockIcon className="size-3" />
                            {duration}
                          </Badge>
                        )}
                        {aiCount > 0 && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <BotIcon className="size-3" />
                            {aiCount}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            execution.status === "completed" ? "default" : "secondary"
                          }
                        >
                          {execution.status === "completed"
                            ? tc("completed")
                            : tc("inProgress")}
                        </Badge>
                        <ArrowRightIcon className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
