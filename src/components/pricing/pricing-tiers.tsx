"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
import { CheckIcon, MailIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Cycle = "monthly" | "annual";

type Props = {
  isActive: boolean;
  isTrialing: boolean;
  daysLeft: number | null;
  hasUser: boolean;
};

const GROWTH_MONTHLY = 99;
const GROWTH_ANNUAL_PER_MONTH = 79; // 20% off, rounded
const GROWTH_ANNUAL_TOTAL = GROWTH_ANNUAL_PER_MONTH * 12; // 948

const TEAM_MONTHLY = 249;
const TEAM_ANNUAL_PER_MONTH = 199; // 20% off
const TEAM_ANNUAL_TOTAL = TEAM_ANNUAL_PER_MONTH * 12; // 2388

const BUSINESS_MONTHLY = 799;
const BUSINESS_ANNUAL_PER_MONTH = 639; // 20% off, rounded
const BUSINESS_ANNUAL_TOTAL = BUSINESS_ANNUAL_PER_MONTH * 12; // 7668

function formatEUR(value: number) {
  return `€${value.toLocaleString("en-US")}`;
}

export function PricingTiers({ isActive, isTrialing, daysLeft, hasUser }: Props) {
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
      {/* Billing cycle toggle */}
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
        {/* Growth plan */}
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

            <div className="pt-4 space-y-3">
              {isActive ? (
                <div className="text-center">
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    {t("currentPlan")}
                  </Badge>
                </div>
              ) : isTrialing && daysLeft !== null ? (
                <div className="text-center space-y-3">
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-amber-600"
                  >
                    {t("trialRemaining", { days: daysLeft })}
                  </Badge>
                  <a
                    href={`mailto:hello@sopia.xyz?subject=${encodeURIComponent(
                      `Upgrade to Growth (${cycle})`
                    )}`}
                    className="block"
                  >
                    <Button className="w-full" size="lg">
                      <MailIcon className="size-4 mr-2" />
                      {t("contactToUpgrade")}
                    </Button>
                  </a>
                </div>
              ) : hasUser ? (
                <a
                  href={`mailto:hello@sopia.xyz?subject=${encodeURIComponent(
                    `Subscribe to Growth (${cycle})`
                  )}`}
                  className="block"
                >
                  <Button className="w-full" size="lg">
                    <MailIcon className="size-4 mr-2" />
                    {t("contactToUpgrade")}
                  </Button>
                </a>
              ) : (
                <Link href="/auth/signup" className="block">
                  <Button className="w-full" size="lg">
                    {t("startTrial")}
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team plan */}
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

            <div className="pt-4">
              {!hasUser ? (
                <Link href="/auth/signup" className="block">
                  <Button className="w-full" size="lg">
                    {t("startTrial")}
                  </Button>
                </Link>
              ) : (
                <a
                  href={`mailto:hello@sopia.xyz?subject=${encodeURIComponent(
                    `Upgrade to Team (${cycle})`
                  )}`}
                  className="block"
                >
                  <Button className="w-full" size="lg">
                    <MailIcon className="size-4 mr-2" />
                    {t("contactToUpgrade")}
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business plan */}
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

            <div className="pt-4">
              {!hasUser ? (
                <Link href="/auth/signup" className="block">
                  <Button className="w-full" size="lg" variant="outline">
                    {t("startTrial")}
                  </Button>
                </Link>
              ) : (
                <a
                  href={`mailto:hello@sopia.xyz?subject=${encodeURIComponent(
                    `Upgrade to Business (${cycle})`
                  )}`}
                  className="block"
                >
                  <Button className="w-full" size="lg" variant="outline">
                    <MailIcon className="size-4 mr-2" />
                    {t("contactSales")}
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
