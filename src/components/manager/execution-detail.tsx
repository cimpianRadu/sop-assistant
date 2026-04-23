"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { StatCard } from "@/components/shared/stat-card";
import { Link } from "@/i18n/navigation";
import { formatDuration, formatRelativeTime } from "@/lib/format";
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
  HashIcon,
  ListChecksIcon,
  TimerIcon,
  ArrowRightIcon,
} from "lucide-react";
import type {
  Execution,
  ExecutionStatus,
  ExecutionStepWithDetails,
  HelpRequest,
} from "@/lib/types";

const LONG_GAP_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24h

type SiblingExecution = {
  id: string;
  number: number;
  status: ExecutionStatus;
  started_at: string;
  completed_at: string | null;
  operator_name: string;
};

type ExecutionDetailProps = {
  execution: Execution;
  processId: string;
  processTitle: string;
  operatorName: string;
  steps: ExecutionStepWithDetails[];
  helpRequests: HelpRequest[];
  executionNumber: number;
  siblingExecutions: SiblingExecution[];
  locale: string;
};

export function ExecutionDetail({
  execution,
  processId,
  processTitle,
  operatorName,
  steps,
  helpRequests,
  executionNumber,
  siblingExecutions,
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
  const isCompleted = execution.status === "completed";

  // ── Metrics for right rail ──────────────────────────────────────────────
  // Avg time per step: total duration / completed steps (only meaningful when completed)
  const avgTimePerStep = (() => {
    if (!execution.completed_at || completedSteps === 0) return "—";
    const totalMs =
      new Date(execution.completed_at).getTime() -
      new Date(execution.started_at).getTime();
    const avgMs = Math.floor(totalMs / completedSteps);
    return formatMs(avgMs);
  })();

  // AI help rate: questions per completed step
  const aiHelpRate =
    completedSteps > 0
      ? `${(totalAiCount / completedSteps).toFixed(1)}/step`
      : "—";

  // Longest gap between consecutive completed steps
  const longestGap = (() => {
    const completed = steps
      .filter((s) => s.completed && s.completed_at)
      .sort(
        (a, b) =>
          new Date(a.completed_at!).getTime() -
          new Date(b.completed_at!).getTime()
      );
    if (completed.length < 2) return null;

    let maxGapMs = 0;
    let aStep = 0;
    let bStep = 0;
    for (let i = 1; i < completed.length; i++) {
      const gap =
        new Date(completed[i].completed_at!).getTime() -
        new Date(completed[i - 1].completed_at!).getTime();
      if (gap > maxGapMs) {
        maxGapMs = gap;
        aStep = completed[i - 1].checklist_steps.step_number;
        bStep = completed[i].checklist_steps.step_number;
      }
    }
    return { ms: maxGapMs, label: formatMs(maxGapMs), aStep, bStep };
  })();

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
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight">
            {t("titleNumbered", {
              number: executionNumber,
              process: processTitle,
            })}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isCompleted
              ? t("subtitleCompleted", {
                  operator: operatorName,
                  current: completedSteps,
                  total: totalSteps,
                })
              : t("subtitleInProgress", {
                  operator: operatorName,
                  current: completedSteps,
                  total: totalSteps,
                })}
          </p>
        </div>
        <Badge variant={isCompleted ? "success" : "warning"}>
          {isCompleted ? tc("completed") : tc("inProgress")}
        </Badge>
      </div>

      {/* 2-column layout: timeline (left) + right rail */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left column */}
        <div className="space-y-6 min-w-0">
          {/* Friction summary */}
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
                      {totalAiCount === 1
                        ? "question asked"
                        : "questions asked"}
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
                  const stepHelp =
                    helpByStep.get(step.checklist_step_id) || [];
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
                              <span className="sm:hidden">
                                {stepHelp.length}
                              </span>
                              <span className="hidden sm:inline">
                                {t("aiInteractions", {
                                  count: stepHelp.length,
                                })}
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

        {/* Right rail */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          {/* Run summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                {t("runSummary")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <StatCard
                label={t("executionNumber")}
                value={`#${executionNumber}`}
                icon={HashIcon}
              />
              <StatCard
                label={t("stepsCompleted")}
                value={`${completedSteps}/${totalSteps}`}
                icon={ListChecksIcon}
              />
              <StatCard
                label={t("avgTimePerStep")}
                value={avgTimePerStep}
                icon={TimerIcon}
              />
              <StatCard
                label={t("aiHelpRate")}
                value={aiHelpRate}
                icon={BotIcon}
              />
              {longestGap && (
                <div className="col-span-2">
                  <StatCard
                    label={t("longestGap")}
                    value={longestGap.label}
                    icon={ClockIcon}
                    tone={
                      longestGap.ms >= LONG_GAP_THRESHOLD_MS
                        ? "danger"
                        : "default"
                    }
                  />
                </div>
              )}
              {duration && (
                <div className="col-span-2 text-xs text-muted-foreground flex items-center gap-1.5 px-1 pt-1">
                  <ClockIcon className="size-3.5" />
                  {t("duration")}: <span className="font-medium">{duration}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Long-gap alert */}
          {longestGap && longestGap.ms >= LONG_GAP_THRESHOLD_MS && (
            <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50">
              <CardContent className="pt-5">
                <div className="flex items-start gap-2.5">
                  <AlertTriangleIcon className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      {t("longGapDetected")}
                    </p>
                    <p className="text-xs text-amber-800/90 dark:text-amber-200/90 mt-1 leading-relaxed">
                      {t("longGapDescription", {
                        duration: longestGap.label,
                        a: longestGap.aStep,
                        b: longestGap.bStep,
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other runs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                {t("otherRunsTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {siblingExecutions.length === 0 ? (
                <p className="text-xs text-muted-foreground py-1">
                  {t("otherRunsNone")}
                </p>
              ) : (
                siblingExecutions.map((s) => {
                  const sDone = s.status === "completed";
                  return (
                    <Link
                      key={s.id}
                      href={`/manager/processes/${processId}/executions/${s.id}`}
                      className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold tabular-nums">
                          #{s.number}
                          {!sDone && (
                            <span className="ml-1.5 text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-500 font-medium">
                              {t("ongoing")}
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {s.operator_name} · {formatRelativeTime(s.started_at, locale)}
                        </p>
                      </div>
                      <ArrowRightIcon className="size-3.5 text-muted-foreground/60 group-hover:text-foreground shrink-0" />
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function formatMs(ms: number): string {
  if (ms < 0) return "—";
  const totalMinutes = Math.floor(ms / 60000);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${minutes}m`;
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
