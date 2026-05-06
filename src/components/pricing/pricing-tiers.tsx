"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { createUpgradeRequest } from "@/lib/actions/upgrade-requests";

type Cycle = "monthly" | "annual";
type Plan = "growth" | "team" | "business";

type Props = {
  isActive: boolean;
  isTrialing: boolean;
  daysLeft: number | null;
  hasUser: boolean;
  canRequestUpgrade: boolean;
};

const GROWTH_MONTHLY = 99;
const GROWTH_ANNUAL_PER_MONTH = 79;
const GROWTH_ANNUAL_TOTAL = GROWTH_ANNUAL_PER_MONTH * 12;

const TEAM_MONTHLY = 249;
const TEAM_ANNUAL_PER_MONTH = 199;
const TEAM_ANNUAL_TOTAL = TEAM_ANNUAL_PER_MONTH * 12;

const BUSINESS_MONTHLY = 799;
const BUSINESS_ANNUAL_PER_MONTH = 639;
const BUSINESS_ANNUAL_TOTAL = BUSINESS_ANNUAL_PER_MONTH * 12;

function formatEUR(value: number) {
  return `€${value.toLocaleString("en-US")}`;
}

export function PricingTiers({
  isActive,
  isTrialing,
  daysLeft,
  hasUser,
  canRequestUpgrade,
}: Props) {
  const t = useTranslations("Pricing");
  const [cycle, setCycle] = useState<Cycle>("monthly");

  const growthPrice =
    cycle === "monthly" ? GROWTH_MONTHLY : GROWTH_ANNUAL_PER_MONTH;
  const teamPrice =
    cycle === "monthly" ? TEAM_MONTHLY : TEAM_ANNUAL_PER_MONTH;
  const businessPrice =
    cycle === "monthly" ? BUSINESS_MONTHLY : BUSINESS_ANNUAL_PER_MONTH;

  const growthFeatures = [
    "growthFeature1",
    "growthFeature2",
    "growthFeature3",
    "growthFeature4",
    "growthFeature5",
    "growthFeature6",
    "growthFeature7",
  ] as const;

  const teamFeatures = [
    "teamFeature1",
    "teamFeature2",
    "teamFeature3",
    "teamFeature4",
    "teamFeature5",
    "teamFeature6",
  ] as const;

  const businessFeatures = [
    "businessFeature1",
    "businessFeature2",
    "businessFeature3",
    "businessFeature4",
    "businessFeature5",
    "businessFeature6",
  ] as const;

  return (
    <>
      <div className="flex justify-center mb-8">
        <div
          role="tablist"
          aria-label={t("billingCycle")}
          className="inline-flex items-center rounded-lg border bg-card p-1 gap-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={cycle === "monthly"}
            onClick={() => setCycle("monthly")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              cycle === "monthly"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("billingMonthly")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={cycle === "annual"}
            onClick={() => setCycle("annual")}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              cycle === "annual"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("billingAnnual")}
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
              {t("saveAnnual")}
            </span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Badge variant="secondary">{t("growthName")}</Badge>
            </div>
            <CardTitle className="text-3xl">
              {formatEUR(growthPrice)}
              <span className="text-base font-normal text-muted-foreground">
                {t("perMonth")}
              </span>
            </CardTitle>
            <CardDescription>{t("growthDescription")}</CardDescription>
            <p className="text-xs text-muted-foreground pt-1 min-h-4">
              {cycle === "annual"
                ? t("billedAnnuallyTotal", {
                    total: formatEUR(GROWTH_ANNUAL_TOTAL),
                  })
                : t("billedMonthly")}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3">
              {growthFeatures.map((key) => (
                <li key={key} className="flex items-center gap-3 text-sm">
                  <CheckIcon className="size-4 text-green-500 shrink-0" />
                  {t(key)}
                </li>
              ))}
            </ul>

            <PlanCta
              plan="growth"
              cycle={cycle}
              isActive={isActive}
              isTrialing={isTrialing}
              daysLeft={daysLeft}
              hasUser={hasUser}
              canRequestUpgrade={canRequestUpgrade}
            />
          </CardContent>
        </Card>

        <Card className="border-primary/50 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground">
              {t("bestValue")}
            </Badge>
          </div>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Badge variant="secondary">{t("teamName")}</Badge>
            </div>
            <CardTitle className="text-3xl">
              {formatEUR(teamPrice)}
              <span className="text-base font-normal text-muted-foreground">
                {t("perMonth")}
              </span>
            </CardTitle>
            <CardDescription>{t("teamDescription")}</CardDescription>
            <p className="text-xs text-muted-foreground pt-1 min-h-4">
              {cycle === "annual"
                ? t("billedAnnuallyTotal", {
                    total: formatEUR(TEAM_ANNUAL_TOTAL),
                  })
                : t("billedMonthly")}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3">
              {teamFeatures.map((key) => (
                <li key={key} className="flex items-center gap-3 text-sm">
                  <CheckIcon className="size-4 text-green-500 shrink-0" />
                  {t(key)}
                </li>
              ))}
            </ul>

            <PlanCta
              plan="team"
              cycle={cycle}
              isActive={false}
              isTrialing={isTrialing}
              daysLeft={daysLeft}
              hasUser={hasUser}
              canRequestUpgrade={canRequestUpgrade}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Badge variant="secondary">{t("businessName")}</Badge>
            </div>
            <CardTitle className="text-3xl">
              {formatEUR(businessPrice)}
              <span className="text-base font-normal text-muted-foreground">
                {t("perMonth")}
              </span>
            </CardTitle>
            <CardDescription>{t("businessDescription")}</CardDescription>
            <p className="text-xs text-muted-foreground pt-1 min-h-4">
              {cycle === "annual"
                ? t("billedAnnuallyTotal", {
                    total: formatEUR(BUSINESS_ANNUAL_TOTAL),
                  })
                : t("billedMonthly")}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3">
              {businessFeatures.map((key) => (
                <li key={key} className="flex items-center gap-3 text-sm">
                  <CheckIcon className="size-4 text-green-500 shrink-0" />
                  {t(key)}
                </li>
              ))}
            </ul>

            <PlanCta
              plan="business"
              cycle={cycle}
              isActive={false}
              isTrialing={isTrialing}
              daysLeft={daysLeft}
              hasUser={hasUser}
              canRequestUpgrade={canRequestUpgrade}
              variant="outline"
              salesCopy
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function PlanCta({
  plan,
  cycle,
  isActive,
  isTrialing,
  daysLeft,
  hasUser,
  canRequestUpgrade,
  variant = "default",
  salesCopy = false,
}: {
  plan: Plan;
  cycle: Cycle;
  isActive: boolean;
  isTrialing: boolean;
  daysLeft: number | null;
  hasUser: boolean;
  canRequestUpgrade: boolean;
  variant?: "default" | "outline";
  salesCopy?: boolean;
}) {
  const t = useTranslations("Pricing");
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  if (!hasUser) {
    return (
      <div className="pt-4 space-y-2 text-center">
        <Link href="/auth/signup" className="block">
          <Button className="w-full" size="lg" variant={variant}>
            {t("startTrial")}
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground">{t("noCardRequired")}</p>
      </div>
    );
  }

  if (isActive && plan === "growth") {
    return (
      <div className="pt-4 text-center">
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          {t("currentPlan")}
        </Badge>
      </div>
    );
  }

  const ctaLabel = salesCopy ? t("contactSales") : t("contactToUpgrade");

  if (!canRequestUpgrade) {
    return (
      <div className="pt-4 text-center">
        <Button
          className="w-full"
          size="lg"
          variant={variant}
          disabled
          title="Only admins or managers can request an upgrade"
        >
          {ctaLabel}
        </Button>
      </div>
    );
  }

  function handleClick() {
    if (pending || submitted) return;
    startTransition(async () => {
      const result = await createUpgradeRequest({ plan, cycle });
      if ("error" in result) {
        toast.error(t("requestFailedTitle"), {
          description: t("requestFailedDescription"),
        });
        return;
      }
      setSubmitted(true);
      toast.success(t("requestSubmittedTitle"), {
        description: t("requestSubmittedDescription"),
      });
    });
  }

  return (
    <div className="pt-4 space-y-3">
      {isTrialing && daysLeft !== null && (
        <div className="text-center">
          <Badge
            variant="outline"
            className="border-amber-500 text-amber-600"
          >
            {t("trialRemaining", { days: daysLeft })}
          </Badge>
        </div>
      )}
      <Button
        className="w-full"
        size="lg"
        variant={variant}
        onClick={handleClick}
        disabled={pending || submitted}
      >
        {pending && <Loader2Icon className="size-4 mr-2 animate-spin" />}
        {pending
          ? t("submittingRequest")
          : submitted
          ? t("requestSubmittedTitle")
          : ctaLabel}
      </Button>
    </div>
  );
}
