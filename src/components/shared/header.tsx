import { getTranslations } from "next-intl/server";
import { getSessionContext } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/shared/logout-button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { SparklesIcon, AlertTriangleIcon, InfoIcon } from "lucide-react";
import { MobileNav } from "@/components/shared/mobile-nav";

function getDaysUntil(date: string | null): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
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

export async function Header({
  openEscalations = 0,
}: { openEscalations?: number } = {}) {
  const tc = await getTranslations("Common");
  const th = await getTranslations("Header");

  const session = await getSessionContext();
  if (!session) return null;

  const status = session.subscription_status;
  const isTrialing = status === "trialing";
  const isActive = status === "active";
  const isPastDue = status === "past_due";
  const isCancelled = status === "cancelled";

  const trialDaysLeft = getDaysUntil(session.trial_ends_at);
  const periodDaysLeft = getDaysUntil(session.current_period_end);

  const showRenewalReminder =
    isActive && periodDaysLeft !== null && periodDaysLeft <= 7;
  const showCancelledBanner =
    isCancelled && periodDaysLeft !== null && periodDaysLeft > 0;

  const renewalDate = session.current_period_end
    ? new Date(session.current_period_end).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  // Default plan display values — not yet modelled per-org in DB
  const planName = th("premium");
  const planPrice = "€99";

  // Operators should not see billing details/CTAs — only status
  const canSeeBilling = session.role === "admin" || session.role === "manager";

  const initials = session.email.slice(0, 2).toUpperCase();

  return (
    <div className="sticky top-0 z-40">
      {/* Trial banner */}
      {isTrialing && trialDaysLeft !== null && (
        <div className="bg-amber-100 border-b border-amber-300 dark:bg-amber-900/40 dark:border-amber-800">
          <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
            <span>{th("trialDays", { days: trialDaysLeft })}</span>
            {canSeeBilling && (
              <>
                <span className="text-amber-400 dark:text-amber-600">&middot;</span>
                <Link
                  href="/pricing"
                  className="font-semibold underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-200"
                >
                  {th("upgradeNow")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Renewal reminder banner */}
      {showRenewalReminder && (
        <div className="bg-amber-50 border-b border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50">
          <div className="container mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap text-sm">
            <AlertTriangleIcon className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="min-w-0 text-amber-900 dark:text-amber-100">
              <span className="font-semibold">
                {periodDaysLeft === 0
                  ? th("renewalTodayTitle", {
                      plan: planName,
                      date: renewalDate,
                    })
                  : th("renewalSoonTitle", {
                      plan: planName,
                      date: renewalDate,
                      days: periodDaysLeft,
                    })}
              </span>
              {canSeeBilling && (
                <>
                  {" "}
                  <span className="text-amber-700/90 dark:text-amber-200/70">
                    {periodDaysLeft === 0
                      ? th("renewalTodaySub", { price: planPrice })
                      : th("renewalSoonSub", { price: planPrice })}
                  </span>
                </>
              )}
            </p>
            {canSeeBilling && (
              <Link href="/pricing">
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                >
                  {th("manageBilling")}
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Past due warning banner */}
      {isPastDue && (
        <div className="bg-red-100 border-b border-red-300 dark:bg-red-900/40 dark:border-red-800">
          <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium text-red-800 dark:text-red-300">
            <AlertTriangleIcon className="size-4 shrink-0" />
            <span>{th("pastDueWarning")}</span>
            {canSeeBilling && (
              <>
                <span className="text-red-400 dark:text-red-600">&middot;</span>
                <a
                  href="mailto:hello@sopia.xyz?subject=Update payment method"
                  className="font-semibold underline underline-offset-2 hover:text-red-950 dark:hover:text-red-200"
                >
                  {th("updatePayment")}
                </a>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cancelled countdown banner */}
      {showCancelledBanner && (
        <div className="bg-amber-100 border-b border-amber-300 dark:bg-amber-900/40 dark:border-amber-800">
          <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
            <InfoIcon className="size-4 shrink-0" />
            <span>{th("cancelledCountdown", { days: periodDaysLeft })}</span>
            {canSeeBilling && (
              <>
                <span className="text-amber-400 dark:text-amber-600">&middot;</span>
                <a
                  href="mailto:hello@sopia.xyz?subject=Reactivate subscription"
                  className="font-semibold underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-200"
                >
                  {th("reactivate")}
                </a>
              </>
            )}
          </div>
        </div>
      )}

      <header className="border-b bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 gap-3">
            {/* Mobile: hamburger + logo */}
            <div className="flex items-center gap-2 min-w-0 lg:hidden">
              <MobileNav
                role={session.role}
                orgName={session.org_name}
                openEscalations={openEscalations}
              />
              <Link
                href={`/${session.role}/dashboard`}
                className="flex items-center gap-1.5 font-semibold text-lg hover:opacity-80 transition-opacity shrink-0 min-w-0"
              >
                <Logo />
                <span className="shrink-0">{tc("appName")}</span>
              </Link>
            </div>

            {/* Desktop: Logo + org + role + premium badge */}
            <div className="hidden lg:flex items-center gap-3 min-w-0">
              <Link
                href={`/${session.role}/dashboard`}
                className="flex items-center gap-1.5 font-semibold text-lg hover:opacity-80 transition-opacity shrink-0"
              >
                <Logo />
                {tc("appName")}
              </Link>
              <span className="text-sm text-muted-foreground">
                {session.org_name}
              </span>
              <Badge variant="secondary" className="capitalize">
                {session.role}
              </Badge>
              {isActive && (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 gap-1 border-amber-200 dark:border-amber-900/50">
                  <SparklesIcon className="size-3" />
                  {th("premium")}
                </Badge>
              )}
            </div>

            {/* Right side: language + user chip + logout */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <LanguageSwitcher />
              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-md border bg-card hover:bg-muted/50 transition-colors min-w-0"
                title={session.email}
              >
                <span className="flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
                  {initials}
                </span>
                <span className="text-sm text-muted-foreground truncate max-w-[180px]">
                  {session.email}
                </span>
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
