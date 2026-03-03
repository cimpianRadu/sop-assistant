"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toggleStep, completeExecution } from "@/lib/actions/executions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChatPanel } from "./chat-panel";
import type { ExecutionStepWithDetails } from "@/lib/types";
import { MessageCircleIcon, HelpCircleIcon } from "lucide-react";

type ChecklistExecutorProps = {
  executionId: string;
  processId: string;
  processTitle: string;
  sopText: string;
  steps: ExecutionStepWithDetails[];
};

type StepContext = {
  stepId: string;
  stepText: string;
  stepNumber: number;
};

export function ChecklistExecutor({
  executionId,
  processId,
  processTitle,
  sopText,
  steps: initialSteps,
}: ChecklistExecutorProps) {
  const t = useTranslations("Checklist");
  const tc = useTranslations("Chat");
  const te = useTranslations("Errors");
  const [steps, setSteps] = useState(initialSteps);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatStepContext, setChatStepContext] = useState<StepContext | null>(
    null
  );

  const completedCount = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const allCompleted = completedCount === totalSteps;
  const progress =
    totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

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

  function openChatForStep(step: {
    id: string;
    step_text: string;
    step_number: number;
  }) {
    setChatStepContext({
      stepId: step.id,
      stepText: step.step_text,
      stepNumber: step.step_number,
    });
    setChatOpen(true);
  }

  function openChat() {
    setChatStepContext(null);
    setChatOpen(true);
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
              {t("stepsProgress", {
                completed: completedCount,
                total: totalSteps,
                percent: progress,
              })}
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

      <div className="flex justify-end">
        <Button variant="outline" onClick={openChat} className="gap-2">
          <MessageCircleIcon className="size-4" />
          {tc("chatWithAI")}
        </Button>
      </div>

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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openChatForStep(step.checklist_steps)}
                  className="gap-1.5 shrink-0"
                >
                  <HelpCircleIcon className="size-3.5" />
                  <span className="hidden sm:inline">{tc("chatWithAI")}</span>
                </Button>
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

      <ChatPanel
        open={chatOpen}
        onOpenChange={setChatOpen}
        initialStepContext={chatStepContext}
        executionId={executionId}
        processId={processId}
        processTitle={processTitle}
        sopText={sopText}
      />
    </div>
  );
}
