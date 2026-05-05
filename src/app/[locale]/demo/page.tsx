import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { TrackedLink } from "@/components/shared/tracked-link";
import { TrackedExternalLink } from "@/components/shared/tracked-external-link";
import { DemoVideo } from "@/components/shared/demo-video";
import { GA_EVENTS } from "@/lib/analytics/events";
import { CALENDLY_DEMO_URL } from "@/lib/external-links";
import { Calendar, ArrowLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Demo" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

const SECTIONS = [
  { key: "create", videoIndex: 1, video: "/demo/create.mp4", poster: "/demo/create-poster.jpg" },
  { key: "execute", videoIndex: 2, video: "/demo/execute.mp4", poster: "/demo/execute-poster.jpg" },
  { key: "oversee", videoIndex: 3, video: "/demo/oversee.mp4", poster: "/demo/oversee-poster.jpg" },
  { key: "escalations", videoIndex: 4, video: "/demo/escalations.mp4", poster: "/demo/escalations-poster.jpg" },
] as const;

export default async function DemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Demo");
  const tc = await getTranslations("Common");

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link href="/" className="flex items-center gap-1.5 font-semibold text-lg">
            <Logo />
            {tc("appName")}
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Link href="/" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="size-3.5" />
                {t("backToHome")}
              </Button>
            </Link>
            <TrackedExternalLink
              href={CALENDLY_DEMO_URL}
              event={GA_EVENTS.BOOK_DEMO_CLICK}
              eventParams={{ source: "demo_header" }}
            >
              <Button size="sm" className="gap-1.5">
                <Calendar className="size-3.5" />
                {tc("bookDemo")}
              </Button>
            </TrackedExternalLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-12 pb-8 sm:pt-16 sm:pb-10 max-w-4xl text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          {t("pageTitle")}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("pageSubtitle")}
        </p>
      </section>

      {/* Sections */}
      <div className="container mx-auto px-4 pb-12 max-w-4xl space-y-12">
        {SECTIONS.map((section) => (
          <section key={section.key} className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-sm font-mono text-muted-foreground tabular-nums">
                {String(section.videoIndex).padStart(2, "0")}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {t(`section_${section.key}_title`)}
              </h2>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              {t(`section_${section.key}_description`)}
            </p>
            {section.video ? (
              <DemoVideo
                src={section.video}
                poster={section.poster ?? undefined}
                ariaLabel={t(`section_${section.key}_title`)}
              />
            ) : (
              <div className="rounded-xl border bg-muted/30 aspect-video flex items-center justify-center text-sm text-muted-foreground">
                {t("videoComingSoon")}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* CTA */}
      <section className="border-t bg-gradient-to-br from-primary/[0.04] via-background to-background">
        <div className="container mx-auto px-4 py-14 max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            {t("ctaTitle")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-6">
            {t("ctaSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <TrackedExternalLink
              href={CALENDLY_DEMO_URL}
              event={GA_EVENTS.BOOK_DEMO_CLICK}
              eventParams={{ source: "demo_page_footer" }}
            >
              <Button size="lg" className="gap-2">
                <Calendar className="size-4" />
                {t("ctaPrimary")}
              </Button>
            </TrackedExternalLink>
            <TrackedLink
              href="/auth/signup"
              event={GA_EVENTS.START_TRIAL_CLICK}
              eventParams={{ source: "demo_page_footer" }}
            >
              <Button variant="outline" size="lg">
                {tc("startFreeTrial")}
              </Button>
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← {t("backToHome")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
