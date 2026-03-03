import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

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
  const tf = await getTranslations("FAQ");

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

  const faqs = [
    { q: tf("faq1Q"), a: tf("faq1A") },
    { q: tf("faq2Q"), a: tf("faq2A") },
    { q: tf("faq3Q"), a: tf("faq3A") },
    { q: tf("faq4Q"), a: tf("faq4A") },
    { q: tf("faq5Q"), a: tf("faq5A") },
    { q: tf("faq6Q"), a: tf("faq6A") },
    { q: tf("faq7Q"), a: tf("faq7A") },
    { q: tf("faq8Q"), a: tf("faq8A") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <span className="flex items-center gap-1.5 font-semibold text-lg">
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
          </span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
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
        <span className="inline-block mb-6 px-4 py-2 text-sm font-semibold rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 shadow-[0_0_15px_rgba(42,165,160,0.3)]">
          {t("trialBadge")}
        </span>
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

      <section className="border-t">
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-10">{tf("title")}</h2>
          <div className="space-y-0 divide-y">
            {faqs.map((faq, i) => (
              <details key={i} className="group py-4">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium hover:text-foreground text-foreground/90">
                  {faq.q}
                  <span className="ml-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <svg width="18" height="18" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <circle cx="20" cy="20" r="17.5" stroke="#2AA5A0" strokeWidth="2" fill="none" />
              <line x1="20" y1="2.5" x2="20" y2="5.5" stroke="#2AA5A0" strokeWidth="1.5" />
              <line x1="37.5" y1="20" x2="34.5" y2="20" stroke="#2AA5A0" strokeWidth="1.5" />
              <line x1="20" y1="37.5" x2="20" y2="34.5" stroke="#2AA5A0" strokeWidth="1.5" />
              <line x1="2.5" y1="20" x2="5.5" y2="20" stroke="#2AA5A0" strokeWidth="1.5" />
              <path d="M20 6 L26 20 L20 34 L14 20 Z" fill="#2AA5A0" />
              <path d="M20 6 L26 20 L20 20 L14 20 Z" fill="#1D7A76" />
            </svg>
            {tc("appName")}
          </span>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="flex items-center gap-1.5 hover:text-foreground">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              {tc("pricing")}
            </Link>
            <a href="mailto:hello@sopia.xyz" className="flex items-center gap-1.5 hover:text-foreground">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              {tc("contact")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
