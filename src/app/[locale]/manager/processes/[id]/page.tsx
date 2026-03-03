import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { OperatorAssignments } from "@/components/manager/operator-assignments";
import { StartExecutionButton } from "@/components/manager/start-execution-button";
import { getSessionContext } from "@/lib/session";
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

  const session = await getSessionContext();
  // Fetch operators in the org for the dropdown
  const { data: orgOperators } = await supabase
    .from("org_members")
    .select("user_id, profiles!org_members_user_id_fkey(email, full_name)")
    .eq("org_id", session!.org_id)
    .eq("role", "operator");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href={`/${session!.role}/dashboard`}><Button variant="ghost" size="sm">{t("backToDashboard")}</Button></Link>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{process.title}</h2>
          <p className="text-muted-foreground mt-1">{process.description}</p>
          <p className="text-xs text-muted-foreground mt-2">{tc("created", { date: new Date(process.created_at).toLocaleDateString(locale) })}</p>
        </div>
        <StartExecutionButton processId={id} />
      </div>
      <Card><CardHeader><CardTitle>{t("standardProcedure")}</CardTitle></CardHeader><CardContent><MarkdownRenderer content={process.sop_text} /></CardContent></Card>
      <Card>
        <CardHeader><CardTitle>{t("checklistWithCount", { count: (steps as ChecklistStep[])?.length || 0 })}</CardTitle></CardHeader>
        <CardContent><ol className="list-decimal list-inside space-y-2">{(steps as ChecklistStep[])?.map((step) => (<li key={step.id} className="text-sm">{step.step_text}</li>))}</ol></CardContent>
      </Card>
      <OperatorAssignments
        processId={id}
        assignments={(assignments as ProcessAssignmentWithProfile[]) || []}
        operators={(orgOperators || []).map((m) => {
          const profile = m.profiles as unknown as { email: string; full_name: string | null };
          return { id: m.user_id, email: profile.email, full_name: profile.full_name };
        })}
      />
      <Card>
        <CardHeader><CardTitle>{t("executionHistory")}</CardTitle></CardHeader>
        <CardContent>
          {!executions || executions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t("noExecutions")}</p>
          ) : (
            <div className="space-y-3">
              {(executions as ExecutionWithProfile[]).map((execution) => (
                <div key={execution.id} className="flex items-center justify-between flex-wrap gap-2 border rounded-lg p-3">
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
