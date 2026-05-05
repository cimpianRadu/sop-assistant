import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { getSessionContext } from "@/lib/session";
import { ExecutionDetail } from "@/components/manager/execution-detail";
import { ChevronRightIcon } from "lucide-react";
import type {
  Execution,
  ExecutionStepWithDetails,
  HelpRequest,
} from "@/lib/types";

export default async function ExecutionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; executionId: string }>;
}) {
  const { locale, id, executionId } = await params;
  setRequestLocale(locale);
  const tc = await getTranslations("Common");
  const tm = await getTranslations("Manager");
  const session = await getSessionContext();
  if (!session) return null;

  const supabase = await createClient();

  const [{ data: execution }, { data: process }] = await Promise.all([
    supabase
      .from("executions")
      .select("*, profiles!executions_operator_id_fkey(email, full_name)")
      .eq("id", executionId)
      .single(),
    supabase.from("processes").select("title").eq("id", id).single(),
  ]);

  if (!execution) notFound();

  const [{ data: steps }, { data: helpRequests }, { data: allExecutions }] =
    await Promise.all([
      supabase
        .from("execution_steps")
        .select("*, checklist_steps(*)")
        .eq("execution_id", executionId),
      supabase
        .from("help_requests")
        .select("*")
        .eq("execution_id", executionId)
        .order("created_at"),
      supabase
        .from("executions")
        .select(
          "id, status, started_at, completed_at, profiles!executions_operator_id_fkey(email, full_name)"
        )
        .eq("process_id", id)
        .order("started_at", { ascending: true }),
    ]);

  const sortedSteps = ((steps as ExecutionStepWithDetails[]) || []).sort(
    (a, b) => a.checklist_steps.step_number - b.checklist_steps.step_number
  );

  const operator = execution.profiles as unknown as {
    email: string;
    full_name: string | null;
  };

  type SiblingRow = Pick<
    Execution,
    "id" | "status" | "started_at" | "completed_at"
  > & {
    profiles:
      | { email: string; full_name: string | null }
      | { email: string; full_name: string | null }[]
      | null;
  };
  const allExecs = (allExecutions as unknown as SiblingRow[]) || [];
  const executionNumber =
    allExecs.findIndex((e) => e.id === executionId) + 1 || 1;
  const siblingExecutions = allExecs
    .map((e, idx) => {
      const p = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles;
      return {
        id: e.id,
        number: idx + 1,
        status: e.status,
        started_at: e.started_at,
        completed_at: e.completed_at,
        operator_name: p?.full_name || p?.email || "—",
      };
    })
    .filter((e) => e.id !== executionId)
    .reverse() // newest first
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
          {tm("yourProcesses")}
        </Link>
        <ChevronRightIcon className="size-3.5 shrink-0" />
        <Link
          href={`/manager/processes/${id}`}
          className="hover:text-foreground truncate min-w-0"
        >
          {process?.title || "Process"}
        </Link>
        <ChevronRightIcon className="size-3.5 shrink-0" />
        <span className="text-foreground shrink-0">
          Execution #{executionNumber}
        </span>
      </nav>

      <ExecutionDetail
        execution={execution}
        processId={id}
        processTitle={process?.title || ""}
        operatorName={operator.full_name || operator.email}
        steps={sortedSteps}
        helpRequests={(helpRequests as HelpRequest[]) || []}
        executionNumber={executionNumber}
        siblingExecutions={siblingExecutions}
        locale={locale}
      />
    </div>
  );
}
