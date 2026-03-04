import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Privacy");
  const tc = await getTranslations("Common");

  const sections = [
    { title: t("section1Title"), content: t("section1Content") },
    { title: t("section2Title"), content: t("section2Content") },
    { title: t("section3Title"), content: t("section3Content") },
    { title: t("section4Title"), content: t("section4Content") },
    { title: t("section5Title"), content: t("section5Content") },
    { title: t("section6Title"), content: t("section6Content") },
    { title: t("section7Title"), content: t("section7Content") },
    { title: t("section8Title"), content: t("section8Content") },
    { title: t("section9Title"), content: t("section9Content") },
    { title: t("section10Title"), content: t("section10Content") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
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
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Link href="/auth/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                {tc("logIn")}
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">{tc("startFreeTrial")}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mb-10">{t("lastUpdated")}</p>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-lg font-semibold mb-3">
                {i + 1}. {section.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t text-sm text-muted-foreground">
          <p>
            {t("questions")}{" "}
            <a
              href="mailto:hello@sopia.xyz"
              className="underline hover:text-foreground"
            >
              hello@sopia.xyz
            </a>
          </p>
        </div>
      </main>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <Link href="/" className="flex items-center gap-1.5 hover:text-foreground">
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
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-foreground">
              {t("termsLink")}
            </Link>
            <a href="mailto:hello@sopia.xyz" className="hover:text-foreground">
              {tc("contact")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
