"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { assignOperator, removeOperator } from "@/lib/actions/assignments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronDownIcon, Loader2Icon, Trash2Icon, UsersIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import type { ProcessAssignmentWithProfile } from "@/lib/types";

type Operator = { id: string; email: string; full_name: string | null };

type OperatorAssignmentsProps = {
  processId: string;
  assignments: ProcessAssignmentWithProfile[];
  operators: Operator[];
};

export function OperatorAssignments({
  processId,
  assignments: initialAssignments,
  operators,
}: OperatorAssignmentsProps) {
  const t = useTranslations("Assignments");
  const te = useTranslations("Errors");
  const tt = useTranslations("Toast");
  const [selectedOperatorId, setSelectedOperatorId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter out already-assigned operators
  const assignedIds = new Set(initialAssignments.map((a) => a.operator_id));
  const availableOperators = operators.filter((op) => !assignedIds.has(op.id));

  async function handleAssign() {
    if (!selectedOperatorId) return;
    setAssigning(true);
    setError(null);
    const result = await assignOperator(processId, selectedOperatorId);
    if (result.error) {
      setError(te(result.error));
    } else {
      setSelectedOperatorId("");
      toast.success(tt("operatorAssigned"));
    }
    setAssigning(false);
  }

  async function handleRemove(assignmentId: string) {
    setRemoving(assignmentId);
    setError(null);
    const result = await removeOperator(processId, assignmentId);
    if (result.error) {
      setError(te(result.error));
    } else {
      toast.success(tt("operatorRemoved"));
    }
    setRemoving(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("assignedOperators")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {availableOperators.length > 0 ? (
          <div className="flex flex-col gap-2">
            <div className="relative">
              <select
                value={selectedOperatorId}
                onChange={(e) => setSelectedOperatorId(e.target.value)}
                className="w-full h-10 appearance-none rounded-md border border-input bg-background pl-3 pr-9 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="">{t("selectOperator")}</option>
                {availableOperators.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.full_name ? `${op.full_name} (${op.email})` : op.email}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            </div>
            <Button
              onClick={handleAssign}
              disabled={assigning || !selectedOperatorId}
              className="w-full"
            >
              {assigning && <Loader2Icon className="h-4 w-4 animate-spin" />}
              {assigning ? t("assigning") : t("assign")}
            </Button>
          </div>
        ) : operators.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noOrgOperators")}</p>
        ) : null}

        {initialAssignments.length === 0 ? (
          <EmptyState icon={UsersIcon} title={t("noOperators")} />
        ) : (
          <div className="space-y-2">
            {initialAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between flex-wrap gap-2 border rounded-lg p-3"
              >
                <span className="text-sm truncate">{assignment.profiles.email}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleRemove(assignment.id)}
                  disabled={removing === assignment.id}
                  aria-label={t("remove")}
                >
                  {removing === assignment.id ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2Icon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
