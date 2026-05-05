import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { TrackedLink } from "@/components/shared/tracked-link";
import { TrackedExternalLink } from "@/components/shared/tracked-external-link";
import { Logo } from "@/components/shared/logo";
import { GA_EVENTS } from "@/lib/analytics/events";
import { CALENDLY_DEMO_URL } from "@/lib/external-links";
import {
  Clock,
  Brain,
  AlertTriangle,
  FileX,
  PlayCircle,
  Calendar,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Rocket,
  LifeBuoy,
  Target,
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

/**
 * Mini illustrations for the "How it works" section. Pure SVG, no images.
 * Each frame is a tiny screenshot-like diagram that mirrors the actual UI.
 */
function StepIllustration1() {
  return (
    <svg
      viewBox="0 0 120 80"
      role="img"
      aria-hidden="true"
      className="w-full h-full"
    >
      {/* prompt bubble */}
      <rect x="6" y="20" width="36" height="22" rx="4" fill="#F4F4F5" stroke="#E4E4E7" />
      <rect x="11" y="26" width="24" height="2" rx="1" fill="#A1A1AA" />
      <rect x="11" y="31" width="18" height="2" rx="1" fill="#A1A1AA" />
      <rect x="11" y="36" width="14" height="2" rx="1" fill="#A1A1AA" />
      {/* sparkle + arrow */}
      <path d="M53 18 l1.5 3 l3 1.5 l-3 1.5 l-1.5 3 l-1.5 -3 l-3 -1.5 l3 -1.5 z" fill="#2AA5A0" />
      <path d="M48 32 L66 32 M62 28 L66 32 L62 36" stroke="#2AA5A0" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* document with numbered steps */}
      <rect x="72" y="10" width="42" height="60" rx="4" fill="white" stroke="#2AA5A0" strokeWidth="1.5" />
      <circle cx="80" cy="22" r="2.5" fill="#2AA5A0" />
      <rect x="86" y="20.5" width="22" height="3" rx="1.5" fill="#A1A1AA" />
      <circle cx="80" cy="34" r="2.5" fill="#2AA5A0" />
      <rect x="86" y="32.5" width="20" height="3" rx="1.5" fill="#A1A1AA" />
      <circle cx="80" cy="46" r="2.5" fill="#2AA5A0" />
      <rect x="86" y="44.5" width="22" height="3" rx="1.5" fill="#A1A1AA" />
      <circle cx="80" cy="58" r="2.5" fill="#2AA5A0" />
      <rect x="86" y="56.5" width="16" height="3" rx="1.5" fill="#A1A1AA" />
    </svg>
  );
}

function StepIllustration2() {
  return (
    <svg
      viewBox="0 0 120 80"
      role="img"
      aria-hidden="true"
      className="w-full h-full"
    >
      {/* row 1 — done */}
      <rect x="6" y="6" width="108" height="20" rx="4" fill="#2AA5A0" fillOpacity="0.1" stroke="#2AA5A0" strokeOpacity="0.3" />
      <circle cx="18" cy="16" r="6" fill="#2AA5A0" />
      <path d="M14.5 16 l2.5 2.5 l4.5 -4.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="30" y="11" width="56" height="3" rx="1.5" fill="#52525B" />
      <rect x="30" y="17.5" width="34" height="2.5" rx="1.25" fill="#A1A1AA" />
      {/* row 2 — active */}
      <rect x="6" y="30" width="108" height="20" rx="4" fill="white" stroke="#2AA5A0" strokeWidth="2" />
      <circle cx="18" cy="40" r="6" fill="white" stroke="#2AA5A0" strokeWidth="2" />
      <rect x="30" y="35" width="50" height="3" rx="1.5" fill="#27272A" />
      <rect x="30" y="41.5" width="30" height="2.5" rx="1.25" fill="#A1A1AA" />
      {/* row 3 — pending */}
      <rect x="6" y="54" width="108" height="20" rx="4" fill="white" stroke="#E4E4E7" />
      <circle cx="18" cy="64" r="6" fill="white" stroke="#A1A1AA" strokeWidth="1.5" />
      <rect x="30" y="59" width="48" height="3" rx="1.5" fill="#A1A1AA" />
      <rect x="30" y="65.5" width="26" height="2.5" rx="1.25" fill="#D4D4D8" />
    </svg>
  );
}

/**
 * Bespoke checkmark badge — echoes the Sopia compass logo's two-tone teal.
 * Soft halo + main teal disc + darker bottom-half overlay for depth + crisp
 * rounded white check.
 */
function FancyCheck({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="11" fill="#2AA5A0" fillOpacity="0.14" />
      <circle cx="12" cy="12" r="9" fill="#2AA5A0" />
      <path d="M3 12 a9 9 0 0 0 18 0 Z" fill="#1D7A76" fillOpacity="0.35" />
      <path
        d="M7.5 12.3 l2.8 2.8 l6.2 -6.4"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function StepIllustration3() {
  return (
    <svg
      viewBox="0 0 120 80"
      role="img"
      aria-hidden="true"
      className="w-full h-full"
    >
      {/* operator question bubble */}
      <path
        d="M6 14 a4 4 0 0 1 4 -4 h26 a4 4 0 0 1 4 4 v14 a4 4 0 0 1 -4 4 h-18 l-5 5 v-5 h-3 a4 4 0 0 1 -4 -4 z"
        fill="#F4F4F5"
        stroke="#E4E4E7"
      />
      <text x="23" y="26" fontSize="14" fontWeight="700" fill="#71717A" textAnchor="middle">
        ?
      </text>
      {/* AI response bubble */}
      <path
        d="M114 38 a4 4 0 0 0 -4 -4 h-46 a4 4 0 0 0 -4 4 v18 a4 4 0 0 0 4 4 h36 l5 5 v-5 h5 a4 4 0 0 0 4 -4 z"
        fill="#2AA5A0"
        fillOpacity="0.1"
        stroke="#2AA5A0"
      />
      <path
        d="M68 42 l1.5 3 l3 1.5 l-3 1.5 l-1.5 3 l-1.5 -3 l-3 -1.5 l3 -1.5 z"
        fill="#2AA5A0"
      />
      <rect x="78" y="44" width="30" height="2.5" rx="1.25" fill="#2AA5A0" fillOpacity="0.55" />
      <rect x="78" y="49" width="24" height="2.5" rx="1.25" fill="#2AA5A0" fillOpacity="0.55" />
      <rect x="78" y="54" width="18" height="2.5" rx="1.25" fill="#2AA5A0" fillOpacity="0.55" />
    </svg>
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
    { title: t("feature1Title"), desc: t("feature1Desc"), Illustration: StepIllustration1 },
    { title: t("feature2Title"), desc: t("feature2Desc"), Illustration: StepIllustration2 },
    { title: t("feature3Title"), desc: t("feature3Desc"), Illustration: StepIllustration3 },
  ];

  const benefitsGroupA = [
    {
      title: t("benefit1Title"),
      desc: t("benefit1Desc"),
      Icon: Clock,
      tint: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      title: t("benefit2Title"),
      desc: t("benefit2Desc"),
      Icon: TrendingUp,
      tint: "bg-primary/10 text-primary",
      featured: true,
    },
    {
      title: t("benefit3Title"),
      desc: t("benefit3Desc"),
      Icon: ShieldCheck,
      tint: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
  ];

  const benefitsGroupB = [
    {
      title: t("benefit4Title"),
      desc: t("benefit4Desc"),
      Icon: Rocket,
      tint: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
      title: t("benefit5Title"),
      desc: t("benefit5Desc"),
      Icon: LifeBuoy,
      tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      title: t("benefit6Title"),
      desc: t("benefit6Desc"),
      Icon: Target,
      tint: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    },
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
            <TrackedLink href="/pricing" event={GA_EVENTS.VIEW_PRICING} eventParams={{ source: "header_nav" }} className="hidden sm:block">
              <Button variant="ghost" size="sm">{tc("pricing")}</Button>
            </TrackedLink>
            <Link href="/auth/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">{tc("logIn")}</Button>
            </Link>
            <TrackedExternalLink
              href={CALENDLY_DEMO_URL}
              event={GA_EVENTS.BOOK_DEMO_CLICK}
              eventParams={{ source: "header_cta" }}
              className="hidden sm:block"
            >
              <Button variant="outline" size="sm" className="gap-1.5">
                <Calendar className="size-3.5" />
                {tc("bookDemo")}
              </Button>
            </TrackedExternalLink>
            <TrackedLink href="/auth/signup" event={GA_EVENTS.START_TRIAL_CLICK} eventParams={{ source: "header_cta" }}>
              <Button size="sm">{tc("startFreeTrial")}</Button>
            </TrackedLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden isolate">
        {/* Soft teal wash at the top — meshes with the page background, no hard edges */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 h-[760px] bg-[radial-gradient(ellipse_70%_55%_at_50%_-5%,rgba(42,165,160,0.12),transparent_70%)]"
        />
        {/* Big compass — anchors the hero on the left. Tilted right and faded at
            the edges (radial mask) so it dissolves into the page background instead
            of reading as a hard logo dropped on top of the section. */}
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 40 40"
          fill="none"
          className="pointer-events-none absolute -z-10 -left-16 sm:-left-8 md:left-4 lg:left-12 top-4 sm:top-8 md:top-12 lg:top-16 w-[260px] sm:w-[440px] md:w-[680px] lg:w-[900px] h-auto rotate-[20deg] opacity-25 dark:opacity-35"
          style={{
            // Mask anchored on the left so the compass dissolves to transparent
            // before it reaches the centered headline. Protects text contrast
            // and readability — nothing visible bleeds behind the title area.
            maskImage:
              "radial-gradient(ellipse 60% 70% at 20% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 35%, transparent 65%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 70% at 20% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 35%, transparent 65%)",
          }}
        >
          <circle cx="20" cy="20" r="17.5" stroke="#2AA5A0" strokeWidth="0.5" />
          <line x1="20" y1="2.5" x2="20" y2="5.5" stroke="#2AA5A0" strokeWidth="0.4" />
          <line x1="37.5" y1="20" x2="34.5" y2="20" stroke="#2AA5A0" strokeWidth="0.4" />
          <line x1="20" y1="37.5" x2="20" y2="34.5" stroke="#2AA5A0" strokeWidth="0.4" />
          <line x1="2.5" y1="20" x2="5.5" y2="20" stroke="#2AA5A0" strokeWidth="0.4" />
          <path d="M20 6 L26 20 L20 34 L14 20 Z" fill="#2AA5A0" />
          <path d="M20 6 L26 20 L20 20 L14 20 Z" fill="#1D7A76" />
        </svg>
        <div className="relative container mx-auto px-4 pt-12 pb-8 sm:pt-20 sm:pb-14 max-w-5xl text-center">
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
          <TrackedLink href="/auth/signup" event={GA_EVENTS.START_TRIAL_CLICK} eventParams={{ source: "hero" }} className="sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto gap-2">
              {t("startTrial")}
              <ArrowRight className="size-4" />
            </Button>
          </TrackedLink>
          <TrackedLink href="/demo" event={GA_EVENTS.WATCH_DEMO_CLICK} eventParams={{ source: "hero" }} className="sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
              <PlayCircle className="size-4" />
              {t("watchDemo")}
            </Button>
          </TrackedLink>
        </div>

          <HeroVisual alt={t("productAlt")} />
        </div>
      </section>

      {/* Book a demo band — sits below the hero/demo visual to capture viewers
          who finished watching and want a human conversation before they sign up. */}
      <section className="border-t bg-gradient-to-br from-primary/[0.04] via-background to-background">
        <div className="container mx-auto px-4 py-12 sm:py-14 max-w-3xl text-center">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-3">
            {t("bookDemoBandTitle")}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-6 leading-relaxed">
            {t("bookDemoBandSub")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <TrackedExternalLink
              href={CALENDLY_DEMO_URL}
              event={GA_EVENTS.BOOK_DEMO_CLICK}
              eventParams={{ source: "post_hero_band" }}
            >
              <Button size="lg" className="gap-2">
                <Calendar className="size-4" />
                {t("bookDemoBandCta")}
              </Button>
            </TrackedExternalLink>
            <TrackedLink
              href="/demo"
              event={GA_EVENTS.WATCH_DEMO_CLICK}
              eventParams={{ source: "post_hero_band" }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("bookDemoBandSecondary")}
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* Problem → Solution (merged Sound Familiar + How It Works) */}
      <section className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-16 max-w-5xl">
          <div className="text-center mb-10 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
              {t("problemSolutionTitle")}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              {t("problemSolutionSub")}
            </p>
          </div>

          {/* Sound familiar — compact pain pills */}
          <div className="mb-12">
            <p className="text-center text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-4">
              {t("soundFamiliar")}
            </p>
            <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
              {painPoints.map((p, i) => {
                const Icon = p.Icon;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border"
                  >
                    <span className={`inline-flex items-center justify-center size-8 rounded-lg shrink-0 ${p.tint}`}>
                      <Icon className="size-4" />
                    </span>
                    <p className="text-sm leading-relaxed pt-1">{p.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Solution — 3 step cards */}
          <div className="mb-10">
            <p className="text-center text-xs uppercase tracking-widest font-semibold text-primary mb-4">
              {t("howItWorks")}
            </p>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {features.map((feature, i) => {
                const Illustration = feature.Illustration;
                return (
                  <div
                    key={i}
                    className="group rounded-xl border bg-card p-5 sm:p-6 transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(42,165,160,0.25)]"
                  >
                    <div className="aspect-[3/2] w-full rounded-lg border bg-background p-3 mb-5 flex items-center justify-center">
                      <Illustration />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                        {i + 1}
                      </span>
                      <h3 className="font-semibold">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA strip — one decisive action + soft secondary */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <TrackedLink
              href="/auth/signup"
              event={GA_EVENTS.START_TRIAL_CLICK}
              eventParams={{ source: "problem_solution" }}
            >
              <Button size="lg" className="gap-2">
                {t("startTrial")}
                <ArrowRight className="size-4" />
              </Button>
            </TrackedLink>
            <TrackedLink
              href="/demo"
              event={GA_EVENTS.WATCH_DEMO_CLICK}
              eventParams={{ source: "problem_solution" }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("problemSolutionSecondary")}
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-16 max-w-5xl">
          <div className="text-center mb-10">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              {t("benefitsEyebrow")}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              {t("benefitsTitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("benefitsSubtitle")}
            </p>
          </div>

          {/* Group A — for senior people */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {t("benefitsGroupA")}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {benefitsGroupA.map((b, i) => {
                const Icon = b.Icon;
                const featured = "featured" in b && b.featured;
                return (
                  <div
                    key={i}
                    className={`rounded-lg border bg-background p-5 space-y-2.5 ${
                      featured
                        ? "ring-1 ring-primary/30 shadow-[0_0_0_4px_rgba(42,165,160,0.06)]"
                        : ""
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center size-10 rounded-lg ${b.tint}`}
                    >
                      <Icon className="size-5" />
                    </span>
                    <h3 className="font-semibold text-sm sm:text-base">
                      {b.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {b.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group B — for everyone else */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {t("benefitsGroupB")}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {benefitsGroupB.map((b, i) => {
                const Icon = b.Icon;
                return (
                  <div
                    key={i}
                    className="rounded-lg border bg-background p-5 space-y-2.5"
                  >
                    <span
                      className={`inline-flex items-center justify-center size-10 rounded-lg ${b.tint}`}
                    >
                      <Icon className="size-5" />
                    </span>
                    <h3 className="font-semibold text-sm sm:text-base">
                      {b.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {b.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing hook band — bold, primary, hard to miss */}
          <div className="mt-14 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-[#1D7A76] text-primary-foreground px-6 sm:px-12 py-10 sm:py-14 text-center shadow-[0_25px_70px_-20px_rgba(42,165,160,0.55)]">
            {/* Decorative blob */}
            <div
              aria-hidden="true"
              className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-white/5 blur-3xl"
            />
            <div className="relative">
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 leading-[1.1] tracking-tight">
                {t("pricingHookTitle")}
              </h3>
              <p className="text-primary-foreground/90 mb-7 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
                {t("pricingHookSub")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <TrackedLink href="/auth/signup" event={GA_EVENTS.START_TRIAL_CLICK} eventParams={{ source: "pricing_hook" }}>
                  <Button
                    size="lg"
                    className="gap-2 bg-white text-primary hover:bg-white/95 font-semibold shadow-lg"
                  >
                    {t("startTrial")}
                    <ArrowRight className="size-4" />
                  </Button>
                </TrackedLink>
                <TrackedLink href="/pricing" event={GA_EVENTS.VIEW_PRICING} eventParams={{ source: "pricing_hook" }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-white/10 hover:text-primary-foreground"
                  >
                    {t("viewPlans")}
                  </Button>
                </TrackedLink>
              </div>
              <p className="text-xs text-primary-foreground/80 mt-5">
                {t("pricingBandText")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trial checklist — what's included */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t("ctaTitle")}</h2>
            <p className="text-muted-foreground">{t("ctaSubtitle")}</p>
          </div>

          <ul className="rounded-xl border bg-card p-6 sm:p-8 grid sm:grid-cols-2 gap-x-8 gap-y-4 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <li key={n} className="flex items-start gap-3 text-sm">
                <FancyCheck className="size-5 shrink-0 mt-0.5" />
                <span className="text-foreground/90 leading-relaxed">
                  {t(`trialItem${n}` as "trialItem1")}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex justify-center">
            <TrackedLink href="/auth/signup" event={GA_EVENTS.START_TRIAL_CLICK} eventParams={{ source: "trial_checklist" }}>
              <Button size="lg" className="gap-2">
                {t("getStarted")}
                <ArrowRight className="size-4" />
              </Button>
            </TrackedLink>
          </div>
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
          <p className="text-center text-sm text-muted-foreground mt-8">
            {tf("seeFullDemoPrefix")}{" "}
            <TrackedLink
              href="/demo"
              event={GA_EVENTS.WATCH_DEMO_CLICK}
              eventParams={{ source: "faq_tail" }}
              className="text-primary hover:underline font-medium"
            >
              {tf("seeFullDemoLink")}
            </TrackedLink>
          </p>
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
