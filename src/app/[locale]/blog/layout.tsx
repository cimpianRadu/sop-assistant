import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { TrackedLink } from "@/components/shared/tracked-link";
import { TrackedExternalLink } from "@/components/shared/tracked-external-link";
import { GA_EVENTS } from "@/lib/analytics/events";
import { CALENDLY_DEMO_URL } from "@/lib/external-links";
import { Calendar } from "lucide-react";

export default async function BlogLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tc = await getTranslations("Common");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav — mirrors the landing header so blog feels native */}
      <header className="border-b sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 font-semibold text-lg"
          >
            <Logo />
            {tc("appName")}
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Link href="/blog" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                {locale === "ro" ? "Blog" : "Blog"}
              </Button>
            </Link>
            <TrackedLink
              href="/pricing"
              event={GA_EVENTS.VIEW_PRICING}
              eventParams={{ source: "blog_header_nav" }}
              className="hidden sm:block"
            >
              <Button variant="ghost" size="sm">
                {tc("pricing")}
              </Button>
            </TrackedLink>
            <TrackedExternalLink
              href={CALENDLY_DEMO_URL}
              event={GA_EVENTS.BOOK_DEMO_CLICK}
              eventParams={{ source: "blog_header_cta" }}
              className="hidden md:block"
            >
              <Button variant="outline" size="sm" className="gap-1.5">
                <Calendar className="size-3.5" />
                {tc("bookDemo")}
              </Button>
            </TrackedExternalLink>
            <TrackedLink
              href="/auth/signup"
              event={GA_EVENTS.START_TRIAL_CLICK}
              eventParams={{ source: "blog_header_cta" }}
            >
              <Button size="sm">{tc("startFreeTrial")}</Button>
            </TrackedLink>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Minimal footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Logo size={20} />
            <span className="font-semibold text-foreground">
              {tc("appName")}
            </span>
            <span className="ml-2">
              {locale === "ro"
                ? "Senior expertise where it matters."
                : "Senior expertise where it matters."}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/blog" className="hover:text-foreground transition">
              Blog
            </Link>
            <Link href="/pricing" className="hover:text-foreground transition">
              {tc("pricing")}
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition">
              {locale === "ro" ? "Confidențialitate" : "Privacy"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
