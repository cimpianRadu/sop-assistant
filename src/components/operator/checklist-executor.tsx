"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toggleStep, completeExecution } from "@/lib/actions/executions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChatPanel } from "./chat-panel";
import type { ExecutionStepWithDetails } from "@/lib/types";
import {
  MessageCircleIcon,
  HelpCircleIcon,
  CheckIcon,
  LockIcon,
} from "lucide-react";

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

    const result = await toggleStep(stepId, newCompleted);
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
    <div className="space-y-4 pb-32">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress card — prominent at top */}
      <div className="rounded-xl border bg-gradient-to-b from-primary/5 to-card p-4">
        <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
          <span className="text-sm font-semibold">{t("progress")}</span>
          <span className="text-sm text-primary font-semibold tabular-nums">
            {t("stepsProgress", {
              completed: completedCount,
              total: totalSteps,
              percent: progress,
            })}
          </span>
        </div>
        <div className="w-full bg-background rounded-full h-2.5 overflow-hidden border">
          <div
            className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {steps.map((step, idx) => {
            const isActive = !step.completed && idx === completedCount;
            const isLocked = !step.completed && !isActive;
            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  step.completed
                    ? "bg-primary/5 border-primary/25"
                    : isActive
                    ? "border-primary shadow-[0_0_0_3px_rgba(16,166,128,0.1)] bg-card"
                    : "bg-background opacity-60"
                }`}
              >
                <span
                  className={`flex items-center justify-center shrink-0 mt-0.5 size-7 rounded-full text-xs font-semibold tabular-nums ${
                    step.completed
                      ? "bg-primary text-primary-foreground"
                      : isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                  aria-hidden
                >
                  {step.completed ? (
                    <CheckIcon className="size-4" strokeWidth={3} />
                  ) : isLocked ? (
                    <LockIcon className="size-3.5" />
                  ) : (
                    step.checklist_steps.step_number
                  )}
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <span
                    className={`text-sm leading-relaxed ${
                      step.completed
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                  >
                    {step.checklist_steps.step_text}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {step.completed ? (
                    <button
                      type="button"
                      onClick={() => handleToggle(step.id, true)}
                      className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded"
                    >
                      {t("undo")}
                    </button>
                  ) : (
                    <>
                      {!isLocked && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openChatForStep(step.checklist_steps)
                          }
                          className="gap-1.5"
                        >
                          <HelpCircleIcon className="size-3.5" />
                          <span className="hidden sm:inline">
                            {tc("chatWithAI")}
                          </span>
                        </Button>
                      )}
                      {isActive && (
                        <Button
                          size="sm"
                          onClick={() => handleToggle(step.id, false)}
                          className="gap-1.5"
                        >
                          <CheckIcon className="size-3.5" strokeWidth={3} />
                          <span className="whitespace-nowrap">
                            {t("completeStep")}
                          </span>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Sticky bottom actions — Complete + Chat */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <Button
            onClick={handleComplete}
            disabled={!allCompleted || completing}
            className="flex-1"
          >
            {completing
              ? t("completing")
              : allCompleted
              ? t("completeExecution")
              : t("stepsRemaining", {
                  remaining: totalSteps - completedCount,
                })}
          </Button>
          <Button
            variant="outline"
            onClick={openChat}
            className="gap-2 shrink-0"
          >
            <MessageCircleIcon className="size-4" />
            <span className="hidden sm:inline">{tc("chatWithAI")}</span>
          </Button>
        </div>
      </div>

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
