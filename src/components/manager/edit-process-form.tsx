"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { updateProcess } from "@/lib/actions/processes";

type Props = {
  processId: string;
  initialTitle: string;
  initialDescription: string;
  initialSopText: string;
  initialChecklist: string[];
};

export function EditProcessForm({
  processId,
  initialTitle,
  initialDescription,
  initialSopText,
  initialChecklist,
}: Props) {
  const t = useTranslations("Manager");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [sopText, setSopText] = useState(initialSopText);
  const [steps, setSteps] = useState<string[]>(
    initialChecklist.length > 0 ? initialChecklist : [""]
  );
  const [isPending, startTransition] = useTransition();

  function updateStep(index: number, value: string) {
    setSteps((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function addStep() {
    setSteps((prev) => [...prev, ""]);
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const toastId = toast.loading(t("saving"));
      try {
        const result = await updateProcess(processId, {
          title,
          description,
          sopText,
          checklist: steps,
        });
        // updateProcess() redirects on success and never returns a value;
        // reaching this branch means it returned an error payload.
        if (result?.error) {
          toast.error(t("saveFailed", { error: result.error }), { id: toastId });
        }
      } catch (err) {
        // NEXT_REDIRECT throws — that's the success path. Toast success then
        // let Next handle the navigation.
        const message = err instanceof Error ? err.message : "";
        if (message.includes("NEXT_REDIRECT")) {
          toast.success(t("saveSuccess"), { id: toastId });
          throw err;
        }
        toast.error(t("saveFailed", { error: message || "unknown" }), {
          id: toastId,
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("editProcess")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">{t("processTitle")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("processDescription")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sopText">{t("sopText")}</Label>
            <Textarea
              id="sopText"
              value={sopText}
              onChange={(e) => setSopText(e.target.value)}
              rows={18}
              required
              disabled={isPending}
              className="font-mono text-xs leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">{t("sopTextHint")}</p>
          </div>

          <div className="space-y-3">
            <div>
              <Label>{t("checklistSteps")}</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {t("checklistStepsHint")}
              </p>
            </div>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="inline-flex size-8 items-center justify-center rounded-md border bg-muted text-xs font-medium text-muted-foreground shrink-0">
                    {i + 1}
                  </span>
                  <Textarea
                    value={step}
                    onChange={(e) => updateStep(i, e.target.value)}
                    placeholder={t("stepPlaceholder")}
                    rows={2}
                    disabled={isPending}
                    className="flex-1 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(i)}
                    disabled={isPending || steps.length === 1}
                    aria-label={t("removeStep")}
                    className="shrink-0"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStep}
              disabled={isPending}
              className="gap-1.5"
            >
              <PlusIcon className="size-4" />
              {t("addStep")}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            {tc("cancel")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            {isPending ? t("saving") : tc("saveChanges")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
