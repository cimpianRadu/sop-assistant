import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { SignupForm } from "@/components/auth/signup-form";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export default async function SignupPage() {
  const tc = await getTranslations("Common");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 font-semibold text-lg hover:opacity-80 transition-opacity"
          >
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
          <LanguageSwitcher />
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
