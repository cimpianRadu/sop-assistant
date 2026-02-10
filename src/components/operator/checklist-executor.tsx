"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toggleStep, completeExecution } from "@/lib/actions/executions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HelpDialog } from "./help-dialog";
import type { ExecutionStepWithDetails } from "@/lib/types";

type ChecklistExecutorProps = {
  executionId: string;
  processId: string;
  processTitle: string;
  sopText: string;
  steps: ExecutionStepWithDetails[];
};

export function ChecklistExecutor({
  executionId,
  processId,
  processTitle,
  sopText,
  steps: initialSteps,
}: ChecklistExecutorProps) {
  const t = useTranslations("Checklist");
  const te = useTranslations("Errors");
  const [steps, setSteps] = useState(initialSteps);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completedCount = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const allCompleted = completedCount === totalSteps;
  const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  async function handleToggle(stepId: string, currentCompleted: boolean) {
    const newCompleted = !currentCompleted;

    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId ? { ...s, completed: newCompleted } : s
      )
    );

    const result = await toggleStep(stepId, newCompleted, executionId);
    if (result?.error) {
      setSteps((prev) =>
        prev.map((s) =>
          s.id === stepId ? { ...s, completed: currentCompleted } : s
        )
      );
      setError(te(result.error));
    }
  }

  async function handleComplete() {
    setCompleting(true);
    setError(null);
    const result = await completeExecution(executionId, processId);
    if (result?.error) {
      setError(te(result.error));
      setCompleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t("progress")}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {t("stepsProgress", { completed: completedCount, total: totalSteps, percent: progress })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <label className="flex items-start gap-3 flex-1 cursor-pointer">
                <Checkbox
                  checked={step.completed}
                  onCheckedChange={() => handleToggle(step.id, step.completed)}
                  className="mt-0.5"
                />
                <span
                  className={`text-sm ${
                    step.completed
                      ? "line-through text-muted-foreground"
                      : ""
                  }`}
                >
                  {step.checklist_steps.step_text}
                </span>
              </label>
              {!step.completed && (
                <HelpDialog
                  executionId={executionId}
                  processId={processId}
                  processTitle={processTitle}
                  sopText={sopText}
                  stepId={step.checklist_steps.id}
                  stepText={step.checklist_steps.step_text}
                  stepNumber={step.checklist_steps.step_number}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        onClick={handleComplete}
        disabled={!allCompleted || completing}
        className="w-full"
      >
        {completing
          ? t("completing")
          : allCompleted
          ? t("completeExecution")
          : t("stepsRemaining", { remaining: totalSteps - completedCount })}
      </Button>
    </div>
  );
}
