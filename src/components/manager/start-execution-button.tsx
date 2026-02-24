"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { startExecution } from "@/lib/actions/executions";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";

export function StartExecutionButton({ processId }: { processId: string }) {
  const t = useTranslations("Operator");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);
    const result = await startExecution(processId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={handleStart} disabled={loading}>
        {loading && <Loader2Icon className="h-4 w-4 animate-spin" />}
        {loading ? t("starting") : t("startExecution")}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
