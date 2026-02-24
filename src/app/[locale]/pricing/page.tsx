import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
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

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Pricing");
  const tc = await getTranslations("Common");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let session: {
    subscription_status: string;
    trial_ends_at: string | null;
    role: string;
  } | null = null;

  if (user) {
    const { data: membership } = await supabase
      .from("org_members")
      .select("role, organizations(subscription_status, trial_ends_at)")
      .eq("user_id", user.id)
      .single();

    if (membership) {
      const org = membership.organizations as unknown as {
        subscription_status: string;
        trial_ends_at: string | null;
      };
      session = {
        role: membership.role,
        subscription_status: org.subscription_status,
        trial_ends_at: org.trial_ends_at,
      };
    }
  }

  const isTrialing = session?.subscription_status === "trialing";
  const isActive = session?.subscription_status === "active";
  const daysLeft =
    isTrialing && session?.trial_ends_at
      ? Math.max(
          0,
          Math.ceil(
            (new Date(session.trial_ends_at).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : null;

  const featureKeys = [
    "feature1",
    "feature2",
    "feature3",
    "feature4",
    "feature5",
    "feature6",
    "feature7",
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link href="/" className="font-semibold text-lg">
            {tc("appName")}
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href={`/${session?.role || "operator"}/dashboard`}>
                <Button variant="outline" size="sm">
                  {tc("dashboard")}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    {tc("logIn")}
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">{tc("startFreeTrial")}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <Badge variant="secondary">{t("planName")}</Badge>
              </div>
              <CardTitle className="text-3xl">
                {t("price")}
                <span className="text-base font-normal text-muted-foreground">
                  {t("perMonth")}
                </span>
              </CardTitle>
              <CardDescription>{t("planDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {featureKeys.map((key) => (
                  <li key={key} className="flex items-center gap-3 text-sm">
                    <span className="text-green-500 flex-shrink-0">
                      &#10003;
                    </span>
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
                    <a href="mailto:contact@sopassistant.com" className="block">
                      <Button className="w-full" size="lg">
                        {t("upgradeNow")}
                      </Button>
                    </a>
                  </div>
                ) : user ? (
                  <a href="mailto:contact@sopassistant.com" className="block">
                    <Button className="w-full" size="lg">
                      {t("contactToSubscribe")}
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
        </div>

        <div className="text-center mt-12 space-y-2">
          <p className="text-sm text-muted-foreground">{t("trialInfo")}</p>
          <p className="text-sm text-muted-foreground">
            {t("questions")}{" "}
            <a
              href="mailto:contact@sopassistant.com"
              className="underline hover:text-foreground"
            >
              {tc("contactUs")}
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
