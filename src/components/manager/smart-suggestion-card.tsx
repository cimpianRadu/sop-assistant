import { getTranslations } from "next-intl/server";
import { LightbulbIcon, ArrowRightIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getProcessSuggestion } from "@/lib/ai/suggest-edits";

type Props = {
  processId: string;
  locale: string;
  /** Open escalations is independent of the AI insight — surface it as a CTA. */
  openEscalationsCount: number;
};

export async function SmartSuggestionCard({
  processId,
  locale,
  openEscalationsCount,
}: Props) {
  const t = await getTranslations("Manager");
  const suggestion = await getProcessSuggestion(processId, locale);

  // No access (operator, missing session) — render nothing.
  if (!suggestion) return null;

  const { payload, based_on_count } = suggestion;

  // No actionable insight AND no open escalations → hide entirely.
  if (!payload.has_insights && openEscalationsCount === 0) return null;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary mb-2">
        <LightbulbIcon className="size-3.5" />
        {t("smartSuggestion")}
      </div>

      {payload.has_insights ? (
        <>
          <p className="text-[13px] leading-relaxed text-foreground font-medium mb-2">
            {payload.headline}
          </p>
          {payload.edits.length > 0 && (
            <ul className="text-[12px] leading-relaxed text-muted-foreground space-y-1 mb-3 list-disc pl-4">
              {payload.edits.map((edit, i) => (
                <li key={i}>{edit}</li>
              ))}
            </ul>
          )}
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
            {t("suggestionBasedOn", { count: based_on_count })}
          </p>
        </>
      ) : (
        openEscalationsCount > 0 && (
          <p className="text-[13px] leading-relaxed text-foreground mb-3">
            {t("smartSuggestionEscalations", { count: openEscalationsCount })}
          </p>
        )
      )}

      {openEscalationsCount > 0 && (
        <Link href="/manager/escalations">
          <Button size="sm" className="w-full gap-1.5">
            {t("reviewEscalations")}
            <ArrowRightIcon className="size-3.5" />
          </Button>
        </Link>
      )}
    </div>
  );
}
