"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { resolveHelpRequest } from "@/lib/actions/help-requests";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2Icon,
  PencilIcon,
  MessageCircleIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import type { HelpRequestWithDetails } from "@/lib/types";

function formatWaitingTime(
  createdAt: string,
  nowMs: number,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string {
  const diffMs = nowMs - new Date(createdAt).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days >= 1) return t("waitingDays", { days });
  return t("waitingHours", { hours: Math.max(1, hours) });
}

export function EscalationList({
  escalations: initialEscalations,
}: {
  escalations: HelpRequestWithDetails[];
}) {
  const t = useTranslations("Escalations");
  const te = useTranslations("Errors");
  const tt = useTranslations("Toast");
  const [escalations, setEscalations] = useState(initialEscalations);
  const [resolving, setResolving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Snapshot "now" at mount so age labels don't flicker on re-renders.
  const [nowMs] = useState(() => Date.now());

  async function handleResolve(id: string) {
    setResolving(id);
    setError(null);
    const result = await resolveHelpRequest(id);
    if (result.error) {
      setError(te(result.error));
    } else {
      setEscalations((prev) => prev.filter((e) => e.id !== id));
      toast.success(tt("escalationResolved"));
    }
    setResolving(null);
  }

  if (escalations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={CheckCircle2Icon}
            title={t("noEscalations")}
            description={t("noEscalationsHint")}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/30 shadow-[0_0_0_1px_rgba(220,38,38,0.05)]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangleIcon className="size-4" />
          {t("title")}
          <span className="text-[10px] font-bold uppercase tracking-wider bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
            {t("open", { count: escalations.length })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {escalations.map((escalation) => (
          <div
            key={escalation.id}
            className="border rounded-lg p-4 space-y-3 bg-muted/30"
          >
            {/* Head: process + step + from + age */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {escalation.processes.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("from", {
                    email: escalation.profiles.email,
                    date: new Date(escalation.created_at).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric", year: "numeric" }
                    ),
                  })}
                  {escalation.checklist_steps && (
                    <>
                      {" · "}
                      {t("step", {
                        number: escalation.checklist_steps.step_number,
                        text: escalation.checklist_steps.step_text,
                      })}
                    </>
                  )}
                </p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-destructive/10 text-destructive px-2 py-1 rounded-full whitespace-nowrap shrink-0">
                {formatWaitingTime(escalation.created_at, nowMs, t)}
              </span>
            </div>

            {/* Operator question bubble */}
            <div className="bg-background border-l-2 border-muted-foreground/40 rounded-r rounded-b p-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                {t("operatorQuestion")}
              </p>
              <p className="text-sm">{escalation.question}</p>
            </div>

            {/* AI response bubble */}
            {escalation.ai_response && (
              <div className="bg-background border-l-2 border-primary rounded-r rounded-b p-3">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-primary mb-1">
                  {t("aiResponseGiven")}
                </p>
                <MarkdownRenderer
                  content={escalation.ai_response}
                  className="text-sm text-muted-foreground"
                />
              </div>
            )}

            {/* Operator note */}
            {escalation.escalation_note && (
              <div className="bg-background border-l-2 border-amber-400 rounded-r rounded-b p-3">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400 mb-1">
                  {t("operatorNote")}
                </p>
                <p className="text-sm">{escalation.escalation_note}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href={`/manager/processes/${escalation.process_id}`}>
                <Button size="sm" className="gap-1.5">
                  <PencilIcon className="size-3.5" />
                  {t("updateSop")}
                </Button>
              </Link>
              <a
                href={`mailto:${escalation.profiles.email}?subject=Re: ${escalation.processes.title}&body=${encodeURIComponent(`Regarding your question: "${escalation.question}"\n\n`)}`}
              >
                <Button size="sm" variant="outline" className="gap-1.5">
                  <MessageCircleIcon className="size-3.5" />
                  {t("replyOperator")}
                </Button>
              </a>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleResolve(escalation.id)}
                disabled={resolving === escalation.id}
              >
                {resolving === escalation.id
                  ? t("resolving")
                  : t("markResolved")}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
