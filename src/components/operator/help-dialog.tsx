"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  createHelpRequest,
  escalateHelpRequest,
} from "@/lib/actions/help-requests";

type HelpDialogProps = {
  executionId: string;
  processId: string;
  processTitle: string;
  sopText: string;
  stepId: string;
  stepText: string;
  stepNumber: number;
};

export function HelpDialog({
  executionId,
  processId,
  processTitle,
  sopText,
  stepId,
  stepText,
  stepNumber,
}: HelpDialogProps) {
  const t = useTranslations("Help");
  const te = useTranslations("Errors");
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [helpRequestId, setHelpRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [escalationNote, setEscalationNote] = useState("");
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [escalated, setEscalated] = useState(false);

  async function handleAskHelp() {
    if (!question.trim()) {
      setError(te("questionRequired"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/operator-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processTitle,
          sopText,
          stepText,
          stepNumber,
          question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || te("failedToGetHelp"));
        return;
      }

      setAiResponse(data.response);

      const saveResult = await createHelpRequest({
        executionId,
        checklistStepId: stepId,
        processId,
        question,
        aiResponse: data.response,
      });

      if (saveResult.helpRequestId) {
        setHelpRequestId(saveResult.helpRequestId);
      }
    } catch {
      setError(te("networkError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleEscalate() {
    if (!helpRequestId) {
      setError(te("noHelpRequest"));
      return;
    }

    setEscalating(true);
    setError(null);

    const result = await escalateHelpRequest(
      helpRequestId,
      escalationNote.trim() || t("defaultEscalationNote")
    );

    if (result.error) {
      setError(te(result.error));
    } else {
      setEscalated(true);
    }
    setEscalating(false);
  }

  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      setQuestion("");
      setAiResponse(null);
      setHelpRequestId(null);
      setError(null);
      setShowEscalation(false);
      setEscalationNote("");
      setEscalating(false);
      setEscalated(false);
    }, 200);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => (isOpen ? setOpen(true) : handleClose())}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {t("needHelp")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("helpWithStep", { number: stepNumber })}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">{stepText}</p>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!aiResponse ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="help-question">{t("whatHelp")}</Label>
              <Textarea
                id="help-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t("questionPlaceholder")}
                rows={3}
              />
            </div>
            {loading ? (
              <div className="py-4">
                <LoadingSpinner />
                <p className="text-center text-sm text-muted-foreground mt-2">
                  {t("gettingHelp")}
                </p>
              </div>
            ) : (
              <Button onClick={handleAskHelp} className="w-full">
                {t("askAI")}
              </Button>
            )}
          </div>
        ) : escalated ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>{t("escalatedMessage")}</AlertDescription>
            </Alert>
            <Button onClick={handleClose} className="w-full">
              {t("close")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {t("aiResponse")}
              </p>
              <div className="text-sm whitespace-pre-wrap">{aiResponse}</div>
            </div>

            {!showEscalation ? (
              <div className="flex gap-2">
                <Button onClick={handleClose} className="flex-1">
                  {t("thisHelped")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEscalation(true)}
                  className="flex-1"
                >
                  {t("stillStuck")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="escalation-note">{t("noteForManager")}</Label>
                  <Textarea
                    id="escalation-note"
                    value={escalationNote}
                    onChange={(e) => setEscalationNote(e.target.value)}
                    placeholder={t("notePlaceholder")}
                    rows={2}
                  />
                </div>
                <Button
                  onClick={handleEscalate}
                  disabled={escalating}
                  variant="destructive"
                  className="w-full"
                >
                  {escalating ? t("escalating") : t("escalateToManager")}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
