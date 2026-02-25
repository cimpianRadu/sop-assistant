"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { SopPreview } from "./sop-preview";
import type { GenerateSopResponse } from "@/lib/types";

export function CreateProcessForm() {
  const t = useTranslations("Manager");
  const te = useTranslations("Errors");
  const locale = useLocale();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateSopResponse | null>(null);

  async function handleGenerate() {
    if (!title.trim() || !description.trim()) { setError(te("titleRequired")); return; }
    if (description.trim().length < 20) { setError(te("descriptionTooShort")); return; }

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/generate-sop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, locale }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || te("failedToGenerateSOP")); return; }
      setResult(data);
    } catch {
      setError(te("networkError"));
    } finally {
      setGenerating(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setResult(null)}>{t("backToEdit")}</Button>
        <SopPreview title={title} description={description} sop={result.sop} checklist={result.checklist} />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t("describeProcess")}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <div className="space-y-2">
          <Label htmlFor="title">{t("processTitle")}</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("titlePlaceholder")} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">{t("processDescription")}</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("descriptionPlaceholder")} rows={6} required />
          <p className="text-xs text-muted-foreground">{t("descriptionHint")}</p>
        </div>
        {generating ? (
          <div className="py-8">
            <LoadingSpinner />
            <p className="text-center text-sm text-muted-foreground mt-4">{t("generatingSOP")}</p>
          </div>
        ) : (
          <Button onClick={handleGenerate} className="w-full">{t("generateSOP")}</Button>
        )}
      </CardContent>
    </Card>
  );
}
