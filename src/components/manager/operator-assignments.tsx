"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { assignOperator, removeOperator } from "@/lib/actions/assignments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ProcessAssignmentWithProfile } from "@/lib/types";

type OperatorAssignmentsProps = { processId: string; assignments: ProcessAssignmentWithProfile[] };

export function OperatorAssignments({ processId, assignments: initialAssignments }: OperatorAssignmentsProps) {
  const t = useTranslations("Assignments");
  const te = useTranslations("Errors");
  const [email, setEmail] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleAssign() {
    if (!email.trim()) { setError(te("emailRequired")); return; }
    setAssigning(true); setError(null); setSuccess(null);
    const result = await assignOperator(processId, email.trim());
    if (result.error) { setError(te(result.error)); } else { setSuccess(t("assignSuccess", { email })); setEmail(""); }
    setAssigning(false);
  }

  async function handleRemove(assignmentId: string) {
    setRemoving(assignmentId); setError(null); setSuccess(null);
    const result = await removeOperator(processId, assignmentId);
    if (result.error) { setError(te(result.error)); }
    setRemoving(null);
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t("assignedOperators")}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="operator-email" className="sr-only">{t("assignedOperators")}</Label>
            <Input id="operator-email" type="email" placeholder={t("operatorPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAssign()} />
          </div>
          <Button onClick={handleAssign} disabled={assigning}>{assigning ? t("assigning") : t("assign")}</Button>
        </div>
        {initialAssignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noOperators")}</p>
        ) : (
          <div className="space-y-2">
            {initialAssignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between border rounded-lg p-3">
                <span className="text-sm">{assignment.profiles.email}</span>
                <Button variant="outline" size="sm" onClick={() => handleRemove(assignment.id)} disabled={removing === assignment.id}>
                  {removing === assignment.id ? t("removing") : t("remove")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
