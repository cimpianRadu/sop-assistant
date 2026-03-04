import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getSessionContext } from "@/lib/session";
import { ExecutionDetail } from "@/components/manager/execution-detail";
import type { ExecutionStepWithDetails, HelpRequest } from "@/lib/types";

export default async function ExecutionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; executionId: string }>;
}) {
  const { locale, id, executionId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ExecutionDetail");
  const session = await getSessionContext();
  if (!session) return null;

  const supabase = await createClient();

  const { data: execution } = await supabase
    .from("executions")
    .select("*, profiles!executions_operator_id_fkey(email, full_name)")
    .eq("id", executionId)
    .single();

  if (!execution) notFound();

  const { data: steps } = await supabase
    .from("execution_steps")
    .select("*, checklist_steps(*)")
    .eq("execution_id", executionId);

  const { data: helpRequests } = await supabase
    .from("help_requests")
    .select("*")
    .eq("execution_id", executionId)
    .order("created_at");

  // Sort steps by step_number
  const sortedSteps = ((steps as ExecutionStepWithDetails[]) || []).sort(
    (a, b) => a.checklist_steps.step_number - b.checklist_steps.step_number
  );

  const operator = execution.profiles as unknown as { email: string; full_name: string | null };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href={`/manager/processes/${id}`}>
        <Button variant="ghost" size="sm">
          {t("backToProcess")}
        </Button>
      </Link>

      <ExecutionDetail
        execution={execution}
        operatorName={operator.full_name || operator.email}
        steps={sortedSteps}
        helpRequests={(helpRequests as HelpRequest[]) || []}
        locale={locale}
      />
    </div>
  );
}
