import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/shared/logout-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import {
  ShieldCheckIcon,
  FileTextIcon,
  UsersIcon,
  CheckCircleIcon,
  ZapIcon,
  ArrowRightIcon,
} from "lucide-react";

export default async function TrialExpiredPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("TrialExpired");
  const tc = await getTranslations("Common");

  // Fetch org stats to show what they built
  const session = await getSessionContext();
  let processCount = 0;
  let memberCount = 0;
  let executionCount = 0;

  if (session) {
    const supabase = await createClient();

    const [processes, members, executions] = await Promise.all([
      supabase
        .from("processes")
        .select("*", { count: "exact", head: true })
        .eq("org_id", session.org_id),
      supabase
        .from("org_members")
        .select("*", { count: "exact", head: true })
        .eq("org_id", session.org_id),
      supabase
        .from("executions")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed"),
    ]);

    processCount = processes.count || 0;
    memberCount = members.count || 0;
    executionCount = executions.count || 0;
  }

  const hasStats = processCount > 0 || memberCount > 0 || executionCount > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="max-w-xl w-full space-y-5">
        {/* Header section */}
        <div className="text-center space-y-3 pt-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-600 mx-auto">
            <ZapIcon className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            {t("description")}
          </p>
        </div>

        {/* Data safety reassurance */}
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="flex items-start gap-3 py-4">
            <ShieldCheckIcon className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm text-green-900">
                {t("dataIsSafe")}
              </p>
              <p className="text-sm text-green-700 mt-0.5">
                {t("dataIsSafeDesc")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Org stats — what they built */}
        {hasStats && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("whatYouBuilt")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center gap-1.5 py-2">
                  <FileTextIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{processCount}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {t("processes", { count: processCount })}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5 py-2">
                  <UsersIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{memberCount}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {t("members", { count: memberCount })}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5 py-2">
                  <CheckCircleIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{executionCount}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {t("executions", { count: executionCount })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upgrade CTA card */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {t("continueWith")}
              </CardTitle>
              <Badge variant="secondary" className="font-semibold">
                {t("planPrice")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm space-y-2 text-muted-foreground">
              {[
                t("planFeature1"),
                t("planFeature2"),
                t("planFeature3"),
                t("planFeature4"),
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <a href="mailto:contact@sopassistant.com" className="block">
              <Button className="w-full" size="lg">
                {t("upgradeCta")}
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </a>

            <div className="flex items-center justify-between text-sm">
              <Link
                href="/pricing"
                className="text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                {t("viewFullPricing")}
              </Link>
              <a
                href="mailto:contact@sopassistant.com"
                className="text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                {t("contactToContinue")}
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <div className="flex justify-center">
          <LogoutButton
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          />
        </div>
      </div>
    </div>
  );
}
