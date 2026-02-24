import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: membership } = await supabase
      .from("org_members")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      redirect("/onboarding");
    }
    redirect(`/${membership.role}/dashboard`);
  }

  const t = await getTranslations("Landing");
  const tc = await getTranslations("Common");

  const features = [
    { title: t("feature1Title"), desc: t("feature1Desc") },
    { title: t("feature2Title"), desc: t("feature2Desc") },
    { title: t("feature3Title"), desc: t("feature3Desc") },
  ];

  const painPoints = [
    t("painPoint1"),
    t("painPoint2"),
    t("painPoint3"),
    t("painPoint4"),
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <span className="font-semibold text-lg">{tc("appName")}</span>
          <div className="flex items-center gap-3">
            <Link href="/pricing">
              <Button variant="ghost" size="sm">{tc("pricing")}</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">{tc("logIn")}</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">{tc("startFreeTrial")}</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 max-w-4xl text-center">
        <Badge variant="secondary" className="mb-4">{t("trialBadge")}</Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
          {t("heroTitle")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          {t("heroSubtitle")}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/auth/signup">
            <Button size="lg">{t("startTrial")}</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" size="lg">{t("viewPricing")}</Button>
          </Link>
        </div>
      </section>

      <section className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-8">{t("soundFamiliar")}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {painPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-background border">
                <span className="text-amber-500 mt-0.5 flex-shrink-0">&#9888;</span>
                <p className="text-sm">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-2">{t("howItWorks")}</h2>
          <p className="text-center text-muted-foreground mb-10">{t("howItWorksSubtitle")}</p>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold">{feature.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-3">{t("ctaTitle")}</h2>
          <p className="text-muted-foreground mb-6">{t("ctaSubtitle")}</p>
          <Link href="/auth/signup">
            <Button size="lg">{t("getStarted")}</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>{tc("appName")}</span>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="hover:text-foreground">{tc("pricing")}</Link>
            <a href="mailto:contact@sopassistant.com" className="hover:text-foreground">{tc("contact")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
