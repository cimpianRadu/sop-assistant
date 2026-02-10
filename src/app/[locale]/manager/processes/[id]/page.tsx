import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { OperatorAssignments } from "@/components/manager/operator-assignments";
import type { ChecklistStep, ExecutionWithProfile, ProcessAssignmentWithProfile } from "@/lib/types";

export default async function ProcessDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Manager");
  const tc = await getTranslations("Common");
  const supabase = await createClient();

  const { data: process } = await supabase.from("processes").select("*").eq("id", id).single();
  if (!process) notFound();

  const { data: steps } = await supabase.from("checklist_steps").select("*").eq("process_id", id).order("step_number");
  const { data: executions } = await supabase.from("executions").select("*, profiles(email)").eq("process_id", id).order("started_at", { ascending: false });
  const { data: assignments } = await supabase.from("process_assignments").select("*, profiles(email)").eq("process_id", id).order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/manager/dashboard"><Button variant="ghost" size="sm">{t("backToDashboard")}</Button></Link>
      <div>
        <h2 className="text-2xl font-bold">{process.title}</h2>
        <p className="text-muted-foreground mt-1">{process.description}</p>
        <p className="text-xs text-muted-foreground mt-2">{tc("created", { date: new Date(process.created_at).toLocaleDateString(locale) })}</p>
      </div>
      <Card><CardHeader><CardTitle>{t("standardProcedure")}</CardTitle></CardHeader><CardContent><MarkdownRenderer content={process.sop_text} /></CardContent></Card>
      <Card>
        <CardHeader><CardTitle>{t("checklistWithCount", { count: (steps as ChecklistStep[])?.length || 0 })}</CardTitle></CardHeader>
        <CardContent><ol className="list-decimal list-inside space-y-2">{(steps as ChecklistStep[])?.map((step) => (<li key={step.id} className="text-sm">{step.step_text}</li>))}</ol></CardContent>
      </Card>
      <OperatorAssignments processId={id} assignments={(assignments as ProcessAssignmentWithProfile[]) || []} />
      <Card>
        <CardHeader><CardTitle>{t("executionHistory")}</CardTitle></CardHeader>
        <CardContent>
          {!executions || executions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noExecutions")}</p>
          ) : (
            <div className="space-y-3">
              {(executions as ExecutionWithProfile[]).map((execution) => (
                <div key={execution.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium">{execution.profiles?.email}</p>
                    <p className="text-xs text-muted-foreground">{tc("started", { date: new Date(execution.started_at).toLocaleDateString(locale) })}</p>
                  </div>
                  <Badge variant={execution.status === "completed" ? "default" : "secondary"}>{execution.status === "completed" ? tc("completed") : tc("inProgress")}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
