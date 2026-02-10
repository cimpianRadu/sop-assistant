"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { startExecution } from "@/lib/actions/executions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import type { ChecklistStep } from "@/lib/types";

type ProcessViewerProps = {
  processId: string;
  sopText: string;
  steps: ChecklistStep[];
};

export function ProcessViewer({ processId, sopText, steps }: ProcessViewerProps) {
  const t = useTranslations("Operator");
  const tc = useTranslations("Checklist");
  const te = useTranslations("Errors");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setStarting(true);
    setError(null);
    const result = await startExecution(processId);
    if (result?.error) {
      setError(te(result.error));
      setStarting(false);
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
          <CardTitle>{t("standardProcedure")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MarkdownRenderer content={sopText} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tc("title")} ({steps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            {steps.map((step) => (
              <li key={step.id} className="text-sm">
                {step.step_text}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Button onClick={handleStart} disabled={starting} className="w-full">
        {starting ? t("starting") : t("startExecution")}
      </Button>
    </div>
  );
}
