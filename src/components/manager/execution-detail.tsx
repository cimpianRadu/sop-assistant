"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { formatDuration } from "@/lib/format";
import {
  CheckCircle2Icon,
  CircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BotIcon,
  UserIcon,
  ClockIcon,
  AlertTriangleIcon,
  SparklesIcon,
} from "lucide-react";
import type {
  Execution,
  ExecutionStepWithDetails,
  HelpRequest,
} from "@/lib/types";

type ExecutionDetailProps = {
  execution: Execution;
  operatorName: string;
  steps: ExecutionStepWithDetails[];
  helpRequests: HelpRequest[];
  locale: string;
};

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
  const escalatedCount = helpRequests.filter((h) => h.escalated).length;
  const resolvedCount = totalAiCount - escalatedCount;
  const duration = formatDuration(execution.started_at, execution.completed_at);

  const completedSteps = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;

  function toggleStep(stepId: string) {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  }

  const isCompleted = execution.status === "completed";

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
            <div>
              <h2 className="text-xl font-bold tracking-tight">{t("title")}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {operatorName} · {completedSteps} / {totalSteps} steps
              </p>
            </div>
            <Badge variant={isCompleted ? "success" : "warning"}>
              {isCompleted ? tc("completed") : tc("inProgress")}
            </Badge>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                {t("startedAt")}
              </dt>
              <dd className="font-medium mt-1">
                {new Date(execution.started_at).toLocaleDateString(locale, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </dd>
            </div>
            {execution.completed_at && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  {t("completedAt")}
                </dt>
                <dd className="font-medium mt-1">
                  {new Date(execution.completed_at).toLocaleDateString(locale, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </dd>
              </div>
            )}
            {duration && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  {t("duration")}
                </dt>
                <dd className="font-medium mt-1 flex items-center gap-1">
                  <ClockIcon className="size-3.5" />
                  {duration}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                {t("totalAiInteractions")}
              </dt>
              <dd className="font-medium mt-1 flex items-center gap-1">
                <BotIcon className="size-3.5" />
                {totalAiCount}
                {totalAiCount > 0 && (
                  <span className="text-xs text-muted-foreground font-normal ml-1">
                    ({resolvedCount} resolved
                    {escalatedCount > 0 && `, ${escalatedCount} escalated`})
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Friction summary — shown when there were AI interactions */}
      {totalAiCount > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="size-8 rounded-lg bg-amber-500 text-white grid place-items-center shrink-0">
                <SparklesIcon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm">
                  Friction points in this run
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalAiCount}{" "}
                  {totalAiCount === 1 ? "question asked" : "questions asked"}
                  {escalatedCount > 0 && (
                    <>
                      {" "}
                      — {resolvedCount} resolved by AI, {escalatedCount}{" "}
                      escalated to you
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {helpRequests.slice(0, 3).map((hr) => {
                const step = steps.find(
                  (s) => s.checklist_step_id === hr.checklist_step_id
                );
                return (
                  <div
                    key={hr.id}
                    className="flex items-center gap-3 bg-background border rounded-md px-3 py-2 text-sm"
                  >
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums shrink-0 min-w-[3rem]">
                      {step
                        ? `Step ${step.checklist_steps.step_number}`
                        : "General"}
                    </span>
                    <Badge
                      variant={hr.escalated ? "danger" : "success"}
                      className="shrink-0"
                    >
                      {hr.escalated ? "Escalated" : "Resolved"}
                    </Badge>
                    <span className="truncate flex-1 text-sm">
                      &ldquo;{hr.question}&rdquo;
                    </span>
                  </div>
                );
              })}
              {helpRequests.length > 3 && (
                <p className="text-xs text-muted-foreground pl-[3.75rem]">
                  + {helpRequests.length - 3} more below
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step timeline */}
      <Card>
        <CardHeader>
          <CardTitle>{t("stepTimeline")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {steps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("noSteps")}
            </p>
          ) : (
            steps.map((step) => {
              const stepHelp = helpByStep.get(step.checklist_step_id) || [];
              const isExpanded = expandedSteps.has(step.id);
              const hasHelp = stepHelp.length > 0;
              const hasEscalation = stepHelp.some((h) => h.escalated);

              return (
                <div
                  key={step.id}
                  className={`border rounded-lg transition-colors ${
                    isExpanded ? "shadow-sm" : ""
                  } ${
                    hasEscalation
                      ? "border-amber-300 dark:border-amber-900/50"
                      : ""
                  }`}
                >
                  <button
                    onClick={() => hasHelp && toggleStep(step.id)}
                    className={`w-full flex items-center gap-3 p-3 text-left ${
                      hasHelp
                        ? "cursor-pointer hover:bg-muted/50"
                        : "cursor-default"
                    }`}
                  >
                    {step.completed ? (
                      hasEscalation ? (
                        <AlertTriangleIcon className="size-5 text-amber-500 shrink-0" />
                      ) : (
                        <CheckCircle2Icon className="size-5 text-primary shrink-0 fill-primary/10" />
                      )
                    ) : (
                      <CircleIcon className="size-5 text-muted-foreground/40 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          step.completed ? "" : "text-muted-foreground"
                        }`}
                      >
                        {t("step", {
                          number: step.checklist_steps.step_number,
                        })}
                        : {step.checklist_steps.step_text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step.completed && step.completed_at
                          ? t("completedStep", {
                              date: new Date(
                                step.completed_at
                              ).toLocaleString(locale, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }),
                            })
                          : t("pendingStep")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasHelp && (
                        <Badge
                          variant={hasEscalation ? "danger" : "success"}
                          className="gap-1"
                        >
                          <BotIcon className="size-2.5" />
                          <span className="sm:hidden">{stepHelp.length}</span>
                          <span className="hidden sm:inline">
                            {t("aiInteractions", { count: stepHelp.length })}
                          </span>
                        </Badge>
                      )}
                      {hasHelp &&
                        (isExpanded ? (
                          <ChevronDownIcon className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronRightIcon className="size-4 text-muted-foreground" />
                        ))}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t px-3 py-3 space-y-3 bg-muted/30">
                      {stepHelp.map((hr) => (
                        <HelpRequestCard
                          key={hr.id}
                          helpRequest={hr}
                          locale={locale}
                        />
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
                <HelpRequestCard
                  key={hr.id}
                  helpRequest={hr}
                  locale={locale}
                />
              ))}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

function HelpRequestCard({
  helpRequest,
  locale,
}: {
  helpRequest: HelpRequest;
  locale: string;
}) {
  const t = useTranslations("ExecutionDetail");

  return (
    <div className="space-y-3 text-sm">
      {/* Operator question — as bubble */}
      <div className="bg-background border rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <UserIcon className="size-3.5 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
            {t("question")} ·{" "}
            {new Date(helpRequest.created_at).toLocaleString(locale, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <p className="leading-relaxed">{helpRequest.question}</p>
      </div>

      {/* AI response — green-tinted bubble */}
      {helpRequest.ai_response && (
        <div
          className={`rounded-lg p-3 border ${
            helpRequest.escalated
              ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50"
              : "bg-primary/5 border-primary/20"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <BotIcon
              className={`size-3.5 ${
                helpRequest.escalated
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-primary"
              }`}
            />
            <span
              className={`text-[10px] uppercase tracking-wide font-semibold ${
                helpRequest.escalated
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-primary"
              }`}
            >
              {t("aiResponse")}
            </span>
          </div>
          <MarkdownRenderer
            content={helpRequest.ai_response}
            className="text-sm"
          />
        </div>
      )}

      {/* Escalation banner */}
      {helpRequest.escalated && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangleIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] uppercase tracking-wide font-semibold text-amber-700 dark:text-amber-400">
              {t("escalated")}
            </span>
          </div>
          {helpRequest.escalation_note && (
            <p className="text-sm text-amber-900 dark:text-amber-100">
              {helpRequest.escalation_note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
