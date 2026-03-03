import { getTranslations } from "next-intl/server";
import { getSessionContext } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/shared/logout-button";

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
    <header className="border-b bg-background">
      <div className="container mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
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
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {session.org_name}
          </span>
          <Badge variant="secondary" className="capitalize">
            {session.role}
          </Badge>
          {isTrialing && daysLeft !== null && (
            <Link href="/pricing">
              <Badge
                variant="outline"
                className="border-amber-500 text-amber-600 hover:bg-amber-50 cursor-pointer"
              >
                {th("trialDays", { days: daysLeft })}
              </Badge>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link
            href="/profile"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate max-w-[120px] sm:max-w-none"
          >
            {session.email}
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
