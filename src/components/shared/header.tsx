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
        <div className="flex items-center gap-3">
          <Link
            href={`/${session.role}/dashboard`}
            className="font-semibold text-lg hover:opacity-80 transition-opacity"
          >
            {tc("appName")}
          </Link>
          <span className="text-sm text-muted-foreground">
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
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {session.email}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
