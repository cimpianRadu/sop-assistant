"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { cn } from "@/lib/utils";
import {
  FileTextIcon,
  ListChecksIcon,
  HistoryIcon,
  LightbulbIcon,
  ArrowRightIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { ChecklistStep } from "@/lib/types";
import type { TocItem } from "@/lib/sop-toc";

type Tab = "document" | "checklist" | "history";

type Props = {
  sopText: string;
  toc: TocItem[];
  steps: ChecklistStep[];
  openEscalationsCount: number;
  children?: React.ReactNode; // right rail content
};

export function ProcessDetailView({
  sopText,
  toc,
  steps,
  openEscalationsCount,
  children,
}: Props) {
  const t = useTranslations("Manager");
  const [tab, setTab] = useState<Tab>("document");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="inline-flex rounded-lg border bg-card p-1 gap-1 flex-wrap">
        <TabButton
          active={tab === "document"}
          onClick={() => setTab("document")}
          icon={FileTextIcon}
          label={t("tabDocument")}
        />
        <TabButton
          active={tab === "checklist"}
          onClick={() => setTab("checklist")}
          icon={ListChecksIcon}
          label={`${t("tabChecklist")} (${steps.length})`}
        />
        <TabButton
          active={tab === "history"}
          onClick={() => {
            toast.info(t("versionHistoryComingSoon"));
          }}
          icon={HistoryIcon}
          label={t("tabVersionHistory")}
          badge="Soon"
        />
      </div>

      {/* 3-column layout: TOC + main + rail (document tab) */}
      {tab === "document" && (
        <div className="grid lg:grid-cols-[180px_1fr_280px] gap-5 items-start">
          {/* TOC — desktop only. Skip H1 (rendered as page title) */}
          {toc.filter((i) => i.level > 1).length > 0 && (
            <aside className="hidden lg:block sticky top-4">
              <div className="rounded-lg border bg-card p-3 text-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                  {t("onThisPage")}
                </p>
                <ul className="flex flex-col">
                  {toc
                    .filter((i) => i.level > 1)
                    .map((item, i) => (
                      <li key={`${item.id}-${i}`}>
                        <a
                          href={`#${item.id}`}
                          className={cn(
                            "block py-1 px-2 rounded text-[13px] leading-snug transition-colors text-muted-foreground hover:text-foreground hover:bg-muted",
                            item.level === 3 && "pl-5 text-[12px]"
                          )}
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                </ul>
              </div>
            </aside>
          )}

          <Card className={cn(toc.length === 0 && "lg:col-start-1")}>
            <CardContent className="pt-6">
              <MarkdownRenderer content={sopText} />
            </CardContent>
          </Card>

          {/* Right rail — suggestion + provided content */}
          <aside className="flex flex-col gap-3 lg:col-start-3">
            {openEscalationsCount > 0 && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary mb-2">
                  <LightbulbIcon className="size-3.5" />
                  {t("smartSuggestion")}
                </div>
                <p className="text-[13px] leading-relaxed text-foreground mb-3">
                  {t("smartSuggestionEscalations", {
                    count: openEscalationsCount,
                  })}
                </p>
                <Link href="/manager/escalations">
                  <Button size="sm" className="w-full gap-1.5">
                    {t("reviewEscalations")}
                    <ArrowRightIcon className="size-3.5" />
                  </Button>
                </Link>
              </div>
            )}
            {children}
          </aside>
        </div>
      )}

      {/* Checklist tab */}
      {tab === "checklist" && (
        <div className="grid lg:grid-cols-[1fr_260px] gap-5 items-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("checklistWithCount", { count: steps.length })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2.5">
                {steps.map((step) => (
                  <li
                    key={step.id}
                    className="flex items-start gap-3 text-sm p-2 rounded hover:bg-muted/40"
                  >
                    <span className="flex items-center justify-center shrink-0 mt-0.5 size-6 rounded-full bg-muted text-xs font-semibold tabular-nums">
                      {step.step_number}
                    </span>
                    <span className="leading-relaxed pt-0.5">
                      {step.step_text}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
          <aside className="flex flex-col gap-3">{children}</aside>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <Icon className="size-4" />
      {label}
      {badge && (
        <span className="ml-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-muted-foreground/20 text-muted-foreground font-semibold">
          {badge}
        </span>
      )}
    </button>
  );
}
