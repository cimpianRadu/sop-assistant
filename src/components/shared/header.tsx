import { getTranslations } from "next-intl/server";
import { getSessionContext } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/shared/logout-button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

function getTrialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export async function Header() {
  const tc = await getTranslations("Common");
  const th = await getTranslations("Header");

  const session = await getSessionContext();
  if (!session) return null;

  const daysLeft = getTrialDaysLeft(session.trial_ends_at);
  const isTrialing = session.subscription_status === "trialing";

  return (
    <>
      {isTrialing && daysLeft !== null && (
        <div className="bg-amber-100 border-b border-amber-300 dark:bg-amber-900/40 dark:border-amber-800">
          <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
            <span>{th("trialDays", { days: daysLeft })}</span>
            <span className="text-amber-400 dark:text-amber-600">&middot;</span>
            <Link href="/pricing" className="font-semibold underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-200">
              {th("upgradeNow")}
            </Link>
          </div>
        </div>
      )}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4">
          {/* Desktop: single row */}
          <div className="hidden sm:flex items-center justify-between h-14">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href={`/${session.role}/dashboard`}
                className="flex items-center gap-1.5 font-semibold text-lg hover:opacity-80 transition-opacity shrink-0"
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
              <span className="text-sm text-muted-foreground">
                {session.org_name}
              </span>
              <Badge variant="secondary" className="capitalize">
                {session.role}
              </Badge>
            </div>
            <div className="flex items-center gap-4 min-w-0">
              <LanguageSwitcher />
              <Link
                href="/profile"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate"
              >
                {session.email}
              </Link>
              <LogoutButton />
            </div>
          </div>

          {/* Mobile: two rows */}
          <div className="flex sm:hidden flex-col py-2 gap-2">
            <div className="flex items-center justify-between">
              <Link
                href={`/${session.role}/dashboard`}
                className="flex items-center gap-1.5 font-semibold text-lg hover:opacity-80 transition-opacity shrink-0"
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
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {session.role}
                </Badge>
                <LanguageSwitcher />
                <LogoutButton />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="truncate">{session.org_name}</span>
              <Link
                href="/profile"
                className="hover:text-foreground transition-colors truncate ml-2 shrink-0"
              >
                {session.email}
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
