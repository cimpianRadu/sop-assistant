"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { resolveHelpRequest } from "@/lib/actions/help-requests";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { HelpRequestWithDetails } from "@/lib/types";

export function EscalationList({ escalations: initialEscalations }: { escalations: HelpRequestWithDetails[] }) {
  const t = useTranslations("Escalations");
  const te = useTranslations("Errors");
  const [escalations, setEscalations] = useState(initialEscalations);
  const [resolving, setResolving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleResolve(id: string) {
    setResolving(id); setError(null);
    const result = await resolveHelpRequest(id);
    if (result.error) { setError(te(result.error)); } else { setEscalations((prev) => prev.filter((e) => e.id !== id)); }
    setResolving(null);
  }

  if (escalations.length === 0) return null;

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{t("title")}<Badge variant="destructive">{escalations.length}</Badge></CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {escalations.map((escalation) => (
          <div key={escalation.id} className="border rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm font-medium">{escalation.processes.title}</p>
              <p className="text-xs text-muted-foreground">{t("step", { number: escalation.checklist_steps.step_number, text: escalation.checklist_steps.step_text })}</p>
              <p className="text-xs text-muted-foreground">{t("from", { email: escalation.profiles.email, date: new Date(escalation.created_at).toLocaleDateString() })}</p>
            </div>
            <div className="bg-muted rounded p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">{t("operatorQuestion")}</p>
              <p className="text-sm">{escalation.question}</p>
            </div>
            {escalation.ai_response && (
              <div className="bg-muted/50 rounded p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">{t("aiResponseGiven")}</p>
                <p className="text-sm whitespace-pre-wrap">{escalation.ai_response}</p>
              </div>
            )}
            {escalation.escalation_note && (
              <div className="bg-muted/50 rounded p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">{t("operatorNote")}</p>
                <p className="text-sm">{escalation.escalation_note}</p>
              </div>
            )}
            <Button size="sm" onClick={() => handleResolve(escalation.id)} disabled={resolving === escalation.id}>
              {resolving === escalation.id ? t("resolving") : t("markResolved")}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
