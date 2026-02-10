import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ChecklistExecutor } from "@/components/operator/checklist-executor";
import type { ExecutionStepWithDetails } from "@/lib/types";

export default async function ExecutionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; executionId: string }>;
}) {
  const { locale, id, executionId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Operator");
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
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/operator/processes/${id}`}>
        <Button variant="ghost" size="sm">
          {t("backToProcess")}
        </Button>
      </Link>

      <div>
        <h2 className="text-2xl font-bold">{process?.title}</h2>
        <p className="text-sm text-muted-foreground">
          {t("executionStarted", { date: new Date(execution.started_at).toLocaleDateString() })}
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
