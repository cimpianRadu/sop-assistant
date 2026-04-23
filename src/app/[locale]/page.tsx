import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import {
  Clock,
  Brain,
  AlertTriangle,
  FileX,
  PlayCircle,
  Sparkles,
  CheckCircle2,
  Check,
  X,
  Minus,
  ArrowRight,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    openGraph: {
      title: t("homeTitle"),
      description: t("homeDescription"),
      locale,
      type: "website",
    },
  };
}

function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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
  );
}

/**
 * Product visual — a stylised two-pane mockup of Sopia's editor + operator
 * execution view. Pure CSS/HTML, no external image. Replace with a real
 * screenshot or Lottie/video once available.
 */
function HeroVisual({ alt }: { alt: string }) {
  return (
    <div
      role="img"
      aria-label={alt}
      className="relative mx-auto mt-12 sm:mt-14 w-full max-w-5xl rounded-xl border bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.18)] overflow-hidden"
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b bg-muted/50 px-3 sm:px-4 py-2">
        <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
        <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
        <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
        <div className="mx-auto hidden sm:block text-xs text-muted-foreground bg-background rounded px-3 py-0.5">
          app.sopia.xyz/procedures/onboarding
        </div>
      </div>

      {/* Body — two panes on md+, stacked on mobile */}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
        {/* Left: SOP editor */}
        <div className="p-4 sm:p-6 space-y-3 text-left">
          <div className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
            SOP Editor · Manager view
          </div>
          <div className="text-sm sm:text-base font-bold text-foreground">
            Onboard a new customer
          </div>
          <div className="rounded-md border bg-muted/40 p-2.5 text-xs text-muted-foreground leading-relaxed">
            &ldquo;When a new customer signs up, we verify their business, send onboarding docs, and schedule a kickoff call within 48h…&rdquo;
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-2.5 py-1 text-[11px] font-medium">
            <Sparkles className="size-3" />
            AI generating steps…
          </div>
          <div className="space-y-1.5 pt-1">
            {[
              "Verify business registration in CRM",
              "Send welcome pack via email",
              "Book kickoff call (within 48h)",
              "Assign customer success owner",
            ].map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {i + 1}
                </span>
                <span className="text-foreground/90">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Operator execution */}
        <div className="p-4 sm:p-6 space-y-3 text-left">
          <div className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
            Execution · Operator view
          </div>
          <div className="text-sm sm:text-base font-bold text-foreground">
            Onboarding — Acme Corp
          </div>

          {[
            { label: "Verify business registration", hint: "Completed 2m ago", state: "done" },
            { label: "Send welcome pack", hint: "Completed 1m ago", state: "done" },
            { label: "Book kickoff call (within 48h)", hint: "In progress", state: "active" },
            { label: "Assign customer success owner", hint: null, state: "pending" },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 rounded-md border px-2.5 py-2 text-xs ${
                item.state === "done"
                  ? "bg-primary/10 border-primary/30"
                  : item.state === "active"
                  ? "bg-background border-primary shadow-[0_0_0_3px_rgba(42,165,160,0.12)]"
                  : "bg-background"
              }`}
            >
              {item.state === "done" ? (
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              ) : (
                <div className="h-4 w-4 rounded border border-muted-foreground/30 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground/90">{item.label}</div>
                {item.hint && (
                  <div className="text-muted-foreground text-[11px] mt-0.5">{item.hint}</div>
                )}
              </div>
            </div>
          ))}

          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-2.5 py-1 text-[11px] font-medium">
            💬 Stuck? Ask AI or escalate
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustedBy({ text }: { text: string }) {
  const logos = ["ACMECORP", "NORTHWIND", "BYTEWORKS", "OPERIO", "LOGOIPSUM"];
  return (
    <div className="mt-14 flex flex-col items-center gap-5 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-7 sm:gap-y-3">
      <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
        {logos.map((name) => (
          <span
            key={name}
            className="text-xs sm:text-sm font-bold tracking-wider text-muted-foreground/60"
          >
            {name}
          </span>
        ))}
      </div>
      <span className="text-xs sm:text-sm text-muted-foreground">— {text}</span>
    </div>
  );
}

function Yes({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-start gap-1.5 text-primary font-semibold">
      <Check className="size-4 shrink-0 mt-0.5" />
      {label && <span className="text-foreground/90 font-medium">{label}</span>}
    </span>
  );
}

function No({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-start gap-1.5 text-muted-foreground/60">
      <X className="size-4 shrink-0 mt-0.5" />
      {label && <span className="text-muted-foreground">{label}</span>}
    </span>
  );
}

function Partial({ label }: { label: string }) {
  return (
    <span className="inline-flex items-start gap-1.5 text-amber-600 dark:text-amber-500">
      <Minus className="size-4 shrink-0 mt-0.5" />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

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
    {
      text: t("painPoint1"),
      Icon: Clock,
      tint: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      text: t("painPoint2"),
      Icon: Brain,
      tint: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
      text: t("painPoint3"),
      Icon: AlertTriangle,
      tint: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    },
    {
      text: t("painPoint4"),
      Icon: FileX,
      tint: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
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
      {/* Nav */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <span className="flex items-center gap-1.5 font-semibold text-lg">
            <Logo />
            {tc("appName")}
          </span>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Link href="/pricing" className="hidden sm:block">
              <Button variant="ghost" size="sm">{tc("pricing")}</Button>
            </Link>
            <Link href="/auth/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">{tc("logIn")}</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">{tc("startFreeTrial")}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-12 pb-8 sm:pt-20 sm:pb-14 max-w-5xl text-center">
        <span className="inline-block mb-6 px-4 py-2 text-sm font-semibold rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 shadow-[0_0_15px_rgba(42,165,160,0.3)]">
          {t("trialBadge")}
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-5 max-w-3xl mx-auto leading-[1.05]">
          {t("heroTitle")}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          {t("heroSubtitle")}
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-3">
          <Link href="/auth/signup" className="sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto gap-2">
              {t("startTrial")}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="#demo" className="sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
              <PlayCircle className="size-4" />
              {t("watchDemo")}
            </Button>
          </Link>
        </div>

        <HeroVisual alt={t("productAlt")} />
        <TrustedBy text={t("trustedBy")} />
      </section>

      {/* Sound familiar */}
      <section className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            {t("soundFamiliar")}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {painPoints.map((p, i) => {
              const Icon = p.Icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-lg bg-background border"
                >
                  <span className={`inline-flex items-center justify-center size-9 rounded-lg shrink-0 ${p.tint}`}>
                    <Icon className="size-5" />
                  </span>
                  <p className="text-sm leading-relaxed pt-1.5">{p.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
            {t("howItWorks")}
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            {t("howItWorksSubtitle")}
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold">{feature.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Sopia (comparison) */}
      <section className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-16 max-w-5xl">
          <div className="text-center mb-10">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              {t("whyEyebrow")}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              {t("whyTitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("whyLede")}
            </p>
          </div>

          <div className="rounded-xl border bg-background overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <caption className="sr-only">
                Comparison of Sopia, Scribe/Tango, Trainual and Notion AI
              </caption>
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left font-semibold text-xs text-foreground py-3 px-4 uppercase tracking-wide">
                    {t("whyCol1")}
                  </th>
                  <th className="text-left font-bold text-xs text-primary py-3 px-4 uppercase tracking-wide bg-primary/10">
                    {t("whyCol2")}
                  </th>
                  <th className="text-left font-semibold text-xs text-muted-foreground py-3 px-4 uppercase tracking-wide">
                    {t("whyCol3")}
                  </th>
                  <th className="text-left font-semibold text-xs text-muted-foreground py-3 px-4 uppercase tracking-wide">
                    {t("whyCol4")}
                  </th>
                  <th className="text-left font-semibold text-xs text-muted-foreground py-3 px-4 uppercase tracking-wide">
                    {t("whyCol5")}
                  </th>
                </tr>
              </thead>
              <tbody className="[&>tr:not(:last-child)]:border-b [&>tr>td]:py-3.5 [&>tr>td]:px-4 [&>tr>td]:align-top">
                <tr>
                  <td className="font-medium">{t("whyRow1")}</td>
                  <td className="bg-primary/5"><Yes label={t("whyRow1Sopia")} /></td>
                  <td><No label={t("whyRow1Col3")} /></td>
                  <td><No label={t("whyRow1Col4")} /></td>
                  <td><Partial label={t("whyRow1Col5")} /></td>
                </tr>
                <tr>
                  <td className="font-medium">{t("whyRow2")}</td>
                  <td className="bg-primary/5"><Yes label={t("whyRow2Sopia")} /></td>
                  <td><No label={t("whyRow2Col3")} /></td>
                  <td><Partial label={t("whyRow2Col4")} /></td>
                  <td><No label={t("whyRow2Col5")} /></td>
                </tr>
                <tr>
                  <td className="font-medium">{t("whyRow3")}</td>
                  <td className="bg-primary/5"><Yes label={t("whyRow3Sopia")} /></td>
                  <td><No /></td>
                  <td><No /></td>
                  <td><No /></td>
                </tr>
                <tr>
                  <td className="font-medium">{t("whyRow4")}</td>
                  <td className="bg-primary/5"><Yes /></td>
                  <td><No /></td>
                  <td><No /></td>
                  <td><No /></td>
                </tr>
                <tr>
                  <td className="font-medium">{t("whyRow5")}</td>
                  <td className="bg-primary/5"><Yes /></td>
                  <td><No /></td>
                  <td><Partial label={t("whyRow5Col4")} /></td>
                  <td><No /></td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-8 text-center italic text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("whyKicker")}
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t("ctaTitle")}</h2>
          <p className="text-muted-foreground mb-6">{t("ctaSubtitle")}</p>
          <Link href="/auth/signup">
            <Button size="lg" className="gap-2">
              {t("getStarted")}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            {tf("title")}
          </h2>
          <div className="space-y-0 divide-y rounded-lg border bg-background">
            {faqs.map((faq, i) => (
              <details key={i} className="group px-5 py-4">
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

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Logo size={18} />
            {tc("appName")}
          </span>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="flex items-center gap-1.5 hover:text-foreground">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              {tc("pricing")}
            </Link>
            <Link href="/terms" className="hover:text-foreground">{tc("terms")}</Link>
            <Link href="/privacy" className="hover:text-foreground">{tc("privacy")}</Link>
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
