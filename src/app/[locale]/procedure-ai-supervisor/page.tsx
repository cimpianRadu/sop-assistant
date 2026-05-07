import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { MarketingMobileMenu } from "@/components/shared/marketing-mobile-menu";
import { TrackedLink } from "@/components/shared/tracked-link";
import { TrackedExternalLink } from "@/components/shared/tracked-external-link";
import { GA_EVENTS } from "@/lib/analytics/events";
import { CALENDLY_DEMO_URL } from "@/lib/external-links";
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Eye,
  AlertTriangle,
  TrendingUp,
  ListChecks,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Procedure AI Supervisor — Structure, Execute & Monitor SOPs | Sopia",
  description:
    "Sopia is an AI procedure supervisor (also known as AI SOP software) that structures your processes, walks operators through every step, and tells you where work actually breaks down.",
  alternates: {
    canonical: "https://sopia.xyz/procedure-ai-supervisor",
  },
  openGraph: {
    title: "Procedure AI Supervisor — Sopia",
    description:
      "Structure your processes with AI. Walk operators through every step. See exactly where work breaks down.",
    type: "website",
    url: "https://sopia.xyz/procedure-ai-supervisor",
  },
};

export default async function ProcedureAiSupervisorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link href="/" className="flex items-center gap-1.5 font-semibold text-lg">
            <Logo />
            Sopia
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <LanguageSwitcher />
            <MarketingMobileMenu source="procedure_ai_supervisor_mobile_menu" />
            <TrackedExternalLink
              href={CALENDLY_DEMO_URL}
              event={GA_EVENTS.BOOK_DEMO_CLICK}
              eventParams={{ source: "procedure_ai_supervisor_header" }}
            >
              <Button size="sm" className="gap-1.5">
                <Calendar className="size-3.5" />
                Book demo
              </Button>
            </TrackedExternalLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-16 pb-10 sm:pt-24 sm:pb-14 max-w-4xl text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground mb-5">
          <Sparkles className="size-3.5 text-primary" />
          AI procedure assistant + execution insights
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-5">
          The AI supervisor for your <span className="text-primary">procedures</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Sopia structures your processes with AI, walks every operator through
          each step, and shows you exactly where work breaks down — so your
          best people stop repeating themselves and your team stops getting
          stuck.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <TrackedLink
            href="/auth/signup"
            event={GA_EVENTS.START_TRIAL_CLICK}
            eventParams={{ source: "procedure_ai_supervisor_hero" }}
          >
            <Button size="lg" className="gap-2">
              Start free trial
              <ArrowRight className="size-4" />
            </Button>
          </TrackedLink>
          <TrackedExternalLink
            href={CALENDLY_DEMO_URL}
            event={GA_EVENTS.BOOK_DEMO_CLICK}
            eventParams={{ source: "procedure_ai_supervisor_hero" }}
          >
            <Button variant="outline" size="lg" className="gap-2">
              <Calendar className="size-4" />
              Book a demo
            </Button>
          </TrackedExternalLink>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Also known as AI SOP software · Used by ops teams in restaurants, manufacturing, and franchises
        </p>
      </section>

      {/* Three pillars */}
      <section className="container mx-auto px-4 py-12 sm:py-16 max-w-5xl">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: ListChecks,
              eyebrow: "01 · Structure",
              title: "Structure your processes, with AI",
              body:
                "Describe how the work gets done in plain language. Sopia turns it into a clean, step-by-step procedure your team can actually follow — no template wrestling, no formatting fights.",
              keyword: "Procedure management software",
            },
            {
              icon: Sparkles,
              eyebrow: "02 · Execute",
              title: "Walk every operator through every step",
              body:
                "Operators don't read PDFs. They follow Sopia. The AI assistant guides them through each step, answers questions in context, and makes sure nothing gets skipped.",
              keyword: "AI-guided procedure execution",
            },
            {
              icon: Eye,
              eyebrow: "03 · See",
              title: "See exactly where work breaks down",
              body:
                "Sopia watches execution and surfaces the friction points: which step takes longest, where people get stuck, which procedures get skipped. Fix the real problems, not the imagined ones.",
              keyword: "Process bottleneck insights",
            },
          ].map((pillar) => (
            <div
              key={pillar.eyebrow}
              className="rounded-xl border bg-card p-6 flex flex-col gap-3"
            >
              <pillar.icon className="size-6 text-primary" />
              <div className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                {pillar.eyebrow}
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                {pillar.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {pillar.body}
              </p>
              <div className="mt-auto pt-2 text-xs font-mono text-primary/80">
                {pillar.keyword}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why an AI supervisor (vs static SOPs) */}
      <section className="border-y bg-muted/20">
        <div className="container mx-auto px-4 py-14 sm:py-20 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-3">
              Writing the SOP isn't enough
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Most procedure software stops at documentation. Sopia is built
              for the part nobody else handles — execution and what happens
              after.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              {
                icon: AlertTriangle,
                title: "PDFs and wikis don't get read",
                body:
                  "An AI supervisor follows the operator step by step, in real time, instead of waiting on a shelf.",
              },
              {
                icon: CheckCircle2,
                title: "Nothing gets skipped",
                body:
                  "Sopia tracks completion at the step level — you know what got done, what got skipped, and by whom.",
              },
              {
                icon: TrendingUp,
                title: "You see what's slow",
                body:
                  "Execution analytics surface the steps that consistently slow your team down — not just the ones managers complain about.",
              },
              {
                icon: Sparkles,
                title: "Senior expertise, where it matters",
                body:
                  "Your seniors stop being a help desk. The AI handles the repetitive how-do-I questions; humans handle the hard calls.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-3 rounded-lg border bg-card p-4"
              >
                <item.icon className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm mb-1">{item.title}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="container mx-auto px-4 py-14 sm:py-20 max-w-4xl">
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-center mb-3">
          Built for teams that run on procedures
        </h2>
        <p className="text-base text-muted-foreground text-center max-w-2xl mx-auto mb-10">
          Wherever the same work needs to happen the same way, every time —
          Sopia is for you.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              title: "Restaurants & franchises",
              body:
                "Onboarding, opening / closing checklists, HACCP procedures, multi-location consistency.",
            },
            {
              title: "Manufacturing & operations",
              body:
                "Digital work instructions, quality procedures, shift handovers, compliance trails.",
            },
            {
              title: "Service & field teams",
              body:
                "Customer onboarding, install procedures, field-tech checklists, escalation flows.",
            },
          ].map((vertical) => (
            <div
              key={vertical.title}
              className="rounded-xl border bg-card p-5"
            >
              <div className="font-semibold mb-2">{vertical.title}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {vertical.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-gradient-to-br from-primary/[0.06] via-background to-background">
        <div className="container mx-auto px-4 py-16 sm:py-20 max-w-3xl text-center">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-3">
            Stop documenting. Start supervising.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-7">
            See Sopia walk a real procedure end to end — and surface where your
            team is actually getting stuck.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <TrackedExternalLink
              href={CALENDLY_DEMO_URL}
              event={GA_EVENTS.BOOK_DEMO_CLICK}
              eventParams={{ source: "procedure_ai_supervisor_footer" }}
            >
              <Button size="lg" className="gap-2">
                <Calendar className="size-4" />
                Book a 30-min demo
              </Button>
            </TrackedExternalLink>
            <TrackedLink
              href="/auth/signup"
              event={GA_EVENTS.START_TRIAL_CLICK}
              eventParams={{ source: "procedure_ai_supervisor_footer" }}
            >
              <Button variant="outline" size="lg">
                Start free trial
              </Button>
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </footer>
    </div>
  );
}
