"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import {
  CheckCircle2Icon,
  CircleDotIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BotIcon,
  UserIcon,
  ClockIcon,
} from "lucide-react";
import type { Execution, ExecutionStepWithDetails, HelpRequest } from "@/lib/types";

type ExecutionDetailProps = {
  execution: Execution;
  operatorName: string;
  steps: ExecutionStepWithDetails[];
  helpRequests: HelpRequest[];
  locale: string;
};

function formatDuration(startedAt: string, completedAt: string | null): string | null {
  if (!completedAt) return null;
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function ExecutionDetail({
  execution,
  operatorName,
  steps,
  helpRequests,
  locale,
}: ExecutionDetailProps) {
  const t = useTranslations("ExecutionDetail");
  const tc = useTranslations("Common");

  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [expandedGeneral, setExpandedGeneral] = useState(false);

  // Group help requests by checklist_step_id
  const helpByStep = new Map<string | null, HelpRequest[]>();
  for (const hr of helpRequests) {
    const key = hr.checklist_step_id;
    if (!helpByStep.has(key)) helpByStep.set(key, []);
    helpByStep.get(key)!.push(hr);
  }

  const generalHelp = helpByStep.get(null) || [];
  const totalAiCount = helpRequests.length;
  const duration = formatDuration(execution.started_at, execution.completed_at);

  function toggleStep(stepId: string) {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t("operator")}</p>
              <p className="font-medium">{operatorName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("status")}</p>
              <Badge variant={execution.status === "completed" ? "default" : "secondary"}>
                {execution.status === "completed" ? tc("completed") : tc("inProgress")}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">{t("startedAt")}</p>
              <p className="font-medium">{new Date(execution.started_at).toLocaleDateString(locale)}</p>
            </div>
            {execution.completed_at && (
              <div>
                <p className="text-muted-foreground">{t("completedAt")}</p>
                <p className="font-medium">{new Date(execution.completed_at).toLocaleDateString(locale)}</p>
              </div>
            )}
            {duration && (
              <div>
                <p className="text-muted-foreground">{t("duration")}</p>
                <p className="font-medium flex items-center gap-1">
                  <ClockIcon className="size-3.5" />
                  {duration}
                </p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">{t("totalAiInteractions")}</p>
              <p className="font-medium flex items-center gap-1">
                <BotIcon className="size-3.5" />
                {totalAiCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step timeline */}
      <Card>
        <CardHeader>
          <CardTitle>{t("stepTimeline")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {steps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t("noSteps")}</p>
          ) : (
            steps.map((step) => {
              const stepHelp = helpByStep.get(step.checklist_step_id) || [];
              const isExpanded = expandedSteps.has(step.id);
              const hasHelp = stepHelp.length > 0;

              return (
                <div key={step.id} className="border rounded-lg">
                  <button
                    onClick={() => hasHelp && toggleStep(step.id)}
                    className={`w-full flex items-center gap-3 p-3 text-left ${hasHelp ? "cursor-pointer hover:bg-muted/50" : "cursor-default"}`}
                  >
                    {step.completed ? (
                      <CheckCircle2Icon className="size-5 text-primary shrink-0" />
                    ) : (
                      <CircleDotIcon className="size-5 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${step.completed ? "" : "text-muted-foreground"}`}>
                        {t("step", { number: step.checklist_steps.step_number })}:{" "}
                        {step.checklist_steps.step_text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step.completed && step.completed_at
                          ? t("completedStep", { date: new Date(step.completed_at).toLocaleString(locale) })
                          : t("pendingStep")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasHelp && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <BotIcon className="size-3" />
                          {t("aiInteractions", { count: stepHelp.length })}
                        </Badge>
                      )}
                      {hasHelp && (
                        isExpanded ? (
                          <ChevronDownIcon className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronRightIcon className="size-4 text-muted-foreground" />
                        )
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t px-3 py-2 space-y-3 bg-muted/30">
                      {stepHelp.map((hr) => (
                        <HelpRequestCard key={hr.id} helpRequest={hr} locale={locale} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* General questions */}
      {generalHelp.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => setExpandedGeneral(!expandedGeneral)}
              className="flex items-center justify-between w-full text-left"
            >
              <CardTitle className="flex items-center gap-2">
                {t("generalQuestions")}
                <Badge variant="outline" className="text-xs">
                  {generalHelp.length}
                </Badge>
              </CardTitle>
              {expandedGeneral ? (
                <ChevronDownIcon className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRightIcon className="size-4 text-muted-foreground" />
              )}
            </button>
          </CardHeader>
          {expandedGeneral && (
            <CardContent className="space-y-3">
              {generalHelp.map((hr) => (
                <HelpRequestCard key={hr.id} helpRequest={hr} locale={locale} />
              ))}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

function HelpRequestCard({ helpRequest, locale }: { helpRequest: HelpRequest; locale: string }) {
  const t = useTranslations("ExecutionDetail");

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-start gap-2">
        <UserIcon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground font-medium">
            {t("question")} · {new Date(helpRequest.created_at).toLocaleString(locale)}
          </p>
          <p className="mt-0.5">{helpRequest.question}</p>
        </div>
      </div>
      {helpRequest.ai_response && (
        <div className="flex items-start gap-2">
          <BotIcon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">{t("aiResponse")}</p>
            <div className="mt-0.5">
              <MarkdownRenderer content={helpRequest.ai_response} className="text-sm" />
            </div>
          </div>
        </div>
      )}
      {helpRequest.escalated && helpRequest.escalation_note && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-1">
          Escalated: {helpRequest.escalation_note}
        </div>
      )}
    </div>
  );
}
