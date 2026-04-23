"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { condenseDiff, diffLines, diffSteps } from "@/lib/diff";
import type { DiffOp, StepDiff } from "@/lib/diff";

type VersionEntry = {
  version_number: number;
  title: string;
  description: string;
  sop_text: string;
  steps: Array<{ step_number: number; step_text: string }>;
  updated_at: string;
  author_label: string;
  is_current: boolean;
};

export function VersionHistory({
  versions,
  locale,
}: {
  versions: VersionEntry[]; // newest first
  locale: string;
}) {
  const t = useTranslations("Manager");
  const [expanded, setExpanded] = useState<number | null>(
    versions[0]?.version_number ?? null
  );

  if (versions.length <= 1) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("versionHistoryEmpty")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((version, idx) => {
        const prev = versions[idx + 1]; // older, since list is newest-first
        const isOpen = expanded === version.version_number;
        return (
          <Card key={version.version_number}>
            <CardHeader
              className="pb-3 cursor-pointer select-none"
              onClick={() =>
                setExpanded(isOpen ? null : version.version_number)
              }
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {isOpen ? (
                    <ChevronDownIcon className="size-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
                  )}
                  <CardTitle className="text-sm">
                    {t("versionLabel", { version: version.version_number })}
                  </CardTitle>
                  {version.is_current && (
                    <Badge variant="success">{t("versionCurrent")}</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {formatRelativeTime(version.updated_at, locale)} ·{" "}
                  {version.author_label}
                </div>
              </div>
            </CardHeader>
            {isOpen && (
              <CardContent className="pt-0">
                {prev ? (
                  <VersionDiff before={prev} after={version} />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t("versionInitialSnapshot")}
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function VersionDiff({
  before,
  after,
}: {
  before: VersionEntry;
  after: VersionEntry;
}) {
  const t = useTranslations("Manager");

  const titleChanged = before.title !== after.title;
  const descChanged = before.description !== after.description;
  const sopOps = condenseDiff(diffLines(before.sop_text, after.sop_text));
  const sopChanged = sopOps.some((op) => op.type !== "eq");
  const stepOps = diffSteps(before.steps, after.steps);

  const nothingChanged =
    !titleChanged && !descChanged && !sopChanged && stepOps.length === 0;

  if (nothingChanged) {
    return (
      <p className="text-xs text-muted-foreground">
        {t("versionNoChanges")}
      </p>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      {titleChanged && (
        <FieldDiff
          label={t("versionFieldTitle")}
          before={before.title}
          after={after.title}
        />
      )}
      {descChanged && (
        <FieldDiff
          label={t("versionFieldDescription")}
          before={before.description}
          after={after.description}
        />
      )}
      {sopChanged && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {t("versionFieldSop")}
          </p>
          <DiffBlock ops={sopOps} />
        </div>
      )}
      {stepOps.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {t("versionFieldChecklist")}
          </p>
          <StepsDiff ops={stepOps} />
        </div>
      )}
    </div>
  );
}

function FieldDiff({
  label,
  before,
  after,
}: {
  label: string;
  before: string;
  after: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </p>
      <div className="space-y-1">
        <DiffLine type="del" line={before} />
        <DiffLine type="add" line={after} />
      </div>
    </div>
  );
}

function DiffBlock({ ops }: { ops: DiffOp[] }) {
  return (
    <div className="rounded-md border bg-muted/30 p-2 font-mono text-[12px] leading-relaxed overflow-x-auto">
      {ops.map((op, idx) => (
        <DiffLine key={idx} type={op.type} line={op.line} />
      ))}
    </div>
  );
}

function DiffLine({
  type,
  line,
}: {
  type: "eq" | "add" | "del";
  line: string;
}) {
  return (
    <div
      className={cn(
        "whitespace-pre-wrap break-words px-2 py-0.5 rounded-sm",
        type === "add" &&
          "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
        type === "del" &&
          "bg-rose-500/10 text-rose-900 dark:text-rose-200 line-through decoration-rose-700/40",
        type === "eq" && "text-muted-foreground"
      )}
    >
      <span className="select-none mr-2 opacity-60">
        {type === "add" ? "+" : type === "del" ? "−" : " "}
      </span>
      {line || " "}
    </div>
  );
}

function StepsDiff({ ops }: { ops: StepDiff[] }) {
  const t = useTranslations("Manager");
  return (
    <ul className="space-y-1.5">
      {ops.map((op, idx) => {
        if (op.type === "added") {
          return (
            <li
              key={idx}
              className="rounded-md bg-emerald-500/10 px-2.5 py-1.5 text-emerald-900 dark:text-emerald-200"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider mr-2">
                {t("stepDiffAdded", { n: op.step_number })}
              </span>
              {op.step_text}
            </li>
          );
        }
        if (op.type === "removed") {
          return (
            <li
              key={idx}
              className="rounded-md bg-rose-500/10 px-2.5 py-1.5 text-rose-900 dark:text-rose-200 line-through decoration-rose-700/40"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider mr-2 no-underline">
                {t("stepDiffRemoved", { n: op.step_number })}
              </span>
              {op.step_text}
            </li>
          );
        }
        return (
          <li key={idx} className="space-y-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("stepDiffModified", { n: op.step_number })}
            </span>
            <div className="rounded-md bg-rose-500/10 px-2.5 py-1 text-rose-900 dark:text-rose-200 line-through decoration-rose-700/40">
              {op.before}
            </div>
            <div className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-emerald-900 dark:text-emerald-200">
              {op.after}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
