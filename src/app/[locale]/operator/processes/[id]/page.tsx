import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProcessViewer } from "@/components/operator/process-viewer";
import type { ChecklistStep, Execution } from "@/lib/types";

export default async function OperatorProcessPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Operator");
  const tc = await getTranslations("Common");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: process } = await supabase
    .from("processes")
    .select("*")
    .eq("id", id)
    .single();

  if (!process) {
    notFound();
  }

  const { data: steps } = await supabase
    .from("checklist_steps")
    .select("*")
    .eq("process_id", id)
    .order("step_number");

  const { data: myExecutions } = await supabase
    .from("executions")
    .select("*")
    .eq("process_id", id)
    .eq("operator_id", user!.id)
    .order("started_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/operator/dashboard">
        <Button variant="ghost" size="sm">
          {t("backToDashboard")}
        </Button>
      </Link>

      <div>
        <h2 className="text-2xl font-bold">{process.title}</h2>
        <p className="text-muted-foreground mt-1">{process.description}</p>
      </div>

      {myExecutions && myExecutions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">{t("yourExecutions")}</h3>
          {(myExecutions as Execution[]).map((execution) => (
            <div
              key={execution.id}
              className="flex items-center justify-between border rounded-lg p-3"
            >
              <div>
                <p className="text-sm">
                  {tc("started", { date: new Date(execution.started_at).toLocaleDateString() })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    execution.status === "completed" ? "default" : "secondary"
                  }
                >
                  {execution.status === "completed"
                    ? tc("completed")
                    : tc("inProgress")}
                </Badge>
                {execution.status === "in_progress" && (
                  <Link
                    href={`/operator/processes/${id}/execute/${execution.id}`}
                  >
                    <Button size="sm" variant="outline">
                      {t("continue")}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ProcessViewer
        processId={id}
        sopText={process.sop_text}
        steps={(steps as ChecklistStep[]) || []}
      />
    </div>
  );
}
