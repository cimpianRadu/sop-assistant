import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChecklistExecutor } from "@/components/operator/checklist-executor";
import { ChevronRightIcon } from "lucide-react";
import type { ExecutionStepWithDetails } from "@/lib/types";

export default async function ExecutionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; executionId: string }>;
}) {
  const { locale, id, executionId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Operator");
  const tc = await getTranslations("Common");
  const supabase = await createClient();

  const { data: execution, error: executionError } = await supabase
    .from("executions")
    .select("*")
    .eq("id", executionId)
    .single();

  if (executionError) {
    console.error("Execution query error:", executionError.message);
  }

  if (!execution) {
    notFound();
  }

  if (execution.status === "completed") {
    redirect(`/operator/processes/${id}`);
  }

  const { data: process } = await supabase
    .from("processes")
    .select("title, sop_text")
    .eq("id", id)
    .single();

  const { data: executionSteps } = await supabase
    .from("execution_steps")
    .select("*, checklist_steps(*)")
    .eq("execution_id", executionId)
    .order("checklist_steps(step_number)");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-muted-foreground overflow-x-auto"
      >
        <Link
          href="/operator/dashboard"
          className="hover:text-foreground shrink-0"
        >
          {tc("dashboard")}
        </Link>
        <ChevronRightIcon className="size-3.5 shrink-0" />
        <Link
          href={`/operator/processes/${id}`}
          className="hover:text-foreground truncate min-w-0"
        >
          {process?.title || "Process"}
        </Link>
        <ChevronRightIcon className="size-3.5 shrink-0" />
        <span className="text-foreground shrink-0">Execute</span>
      </nav>

      {/* Title */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {process?.title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("executionStarted", {
            date: new Date(execution.started_at).toLocaleDateString(locale, {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          })}
        </p>
      </div>

      <ChecklistExecutor
        executionId={executionId}
        processId={id}
        processTitle={process?.title || ""}
        sopText={process?.sop_text || ""}
        steps={(executionSteps as ExecutionStepWithDetails[]) || []}
      />
    </div>
  );
}
