import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { MarketingMobileMenu } from "@/components/shared/marketing-mobile-menu";
import { PricingTiers } from "@/components/pricing/pricing-tiers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("pricingTitle"),
    description: t("pricingDescription"),
    openGraph: {
      title: t("pricingTitle"),
      description: t("pricingDescription"),
      locale,
    },
  };
}

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

  // Server component renders per-request — current time is the source of truth.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const daysLeft =
    isTrialing && session?.trial_ends_at
      ? Math.max(
          0,
          Math.ceil(
            (new Date(session.trial_ends_at).getTime() - nowMs) /
              (1000 * 60 * 60 * 24)
          )
        )
      : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            {!user && <MarketingMobileMenu source="pricing_mobile_menu" />}
            <Link href="/" className="flex items-center gap-1.5 font-semibold text-lg">
              <svg
                width="24"
                height="24"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <circle cx="20" cy="20" r="17.5" stroke="#2AA5A0" strokeWidth="2" fill="none" />
                <line x1="20" y1="2.5" x2="20" y2="5.5" stroke="#2AA5A0" strokeWidth="1.5" />
                <line x1="37.5" y1="20" x2="34.5" y2="20" stroke="#2AA5A0" strokeWidth="1.5" />
                <line x1="20" y1="37.5" x2="20" y2="34.5" stroke="#2AA5A0" strokeWidth="1.5" />
                <line x1="2.5" y1="20" x2="5.5" y2="20" stroke="#2AA5A0" strokeWidth="1.5" />
                <path d="M20 6 L26 20 L20 34 L14 20 Z" fill="#2AA5A0" />
                <path d="M20 6 L26 20 L20 20 L14 20 Z" fill="#1D7A76" />
              </svg>
              {tc("appName")}
            </Link>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <LanguageSwitcher />
            {user ? (
              <Link href={`/${session?.role || "operator"}/dashboard`}>
                <Button variant="outline" size="sm">
                  {tc("dashboard")}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="hidden sm:block">
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

      <main className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <PricingTiers
          isActive={isActive}
          isTrialing={isTrialing}
          daysLeft={daysLeft}
          hasUser={!!user}
          canRequestUpgrade={
            session?.role === "admin" || session?.role === "manager"
          }
        />

        <div className="text-center mt-12 space-y-2">
          <p className="text-sm text-muted-foreground">{t("trialInfo")}</p>
          <p className="text-sm text-muted-foreground">
            {t("questions")}{" "}
            <a
              href="mailto:hello@sopia.xyz"
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
