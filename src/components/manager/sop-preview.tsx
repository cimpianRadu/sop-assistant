"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { saveProcess } from "@/lib/actions/processes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";

type SopPreviewProps = { title: string; description: string; sop: string; checklist: string[] };

export function SopPreview({ title, description, sop, checklist }: SopPreviewProps) {
  const t = useTranslations("Manager");
  const te = useTranslations("Errors");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await saveProcess({ title, description, sopText: sop, checklist });
    if (result?.error) { setError(te(result.error)); setSaving(false); }
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <Card><CardHeader><CardTitle>{t("generatedSOP")}</CardTitle></CardHeader><CardContent><MarkdownRenderer content={sop} /></CardContent></Card>
      <Card>
        <CardHeader><CardTitle>{t("checklistWithCount", { count: checklist.length })}</CardTitle></CardHeader>
        <CardContent><ol className="list-decimal list-inside space-y-2">{checklist.map((step, i) => (<li key={i} className="text-sm">{step}</li>))}</ol></CardContent>
      </Card>
      <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? t("saving") : t("saveProcess")}</Button>
    </div>
  );
}
