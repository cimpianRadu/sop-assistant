import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getTrialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export async function Header() {
  const tc = await getTranslations("Common");
  const th = await getTranslations("Header");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role, subscription_status, trial_ends_at")
    .eq("id", user.id)
    .single();

  const daysLeft = getTrialDaysLeft(profile?.trial_ends_at ?? null);
  const isTrialing = profile?.subscription_status === "trialing";

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-lg">{tc("appName")}</h1>
          {profile && (
            <Badge variant="secondary" className="capitalize">
              {profile.role}
            </Badge>
          )}
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
            {profile?.email}
          </span>
          <form action={logout}>
            <Button variant="outline" size="sm" type="submit">
              {tc("logOut")}
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
