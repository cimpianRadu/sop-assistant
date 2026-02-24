import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AcceptInviteCard } from "@/components/onboarding/accept-invite";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Invite");
  const tc = await getTranslations("Common");

  const supabase = await createClient();

  // Look up invite details using the SECURITY DEFINER function
  const { data: inviteDetails } = await supabase.rpc("get_invite_details", {
    invite_token: token,
  });

  const invite = inviteDetails as {
    id: string;
    email: string;
    role: string;
    org_name: string;
    expired: boolean;
    accepted: boolean;
  } | null;

  // Invalid or missing invite
  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>{t("invalidInvite")}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/auth/login">
              <Button>{tc("logIn")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already accepted or expired
  if (invite.accepted || invite.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>{t("invalidInvite")}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/auth/login">
              <Button>{tc("logIn")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in — show signup/login prompt
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("title")}</CardTitle>
            <CardDescription>
              {t("invitedTo", { orgName: invite.org_name, role: invite.role })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/auth/signup?invite=${token}`} className="block">
              <Button className="w-full">{t("signupFirst")}</Button>
            </Link>
            <Link href={`/auth/login?invite=${token}`} className="block">
              <Button variant="outline" className="w-full">
                {t("loginFirst")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged in — check email match
  if (user.email !== invite.email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>{t("emailMismatch")}</CardTitle>
            <CardDescription>
              {t("emailMismatchDesc", { email: invite.email })}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Logged in, email matches — show accept button
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AcceptInviteCard
        orgName={invite.org_name}
        role={invite.role}
        token={token}
      />
    </div>
  );
}
