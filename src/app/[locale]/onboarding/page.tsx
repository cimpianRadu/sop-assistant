import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { CreateOrgForm } from "@/components/onboarding/create-org-form";
import { AcceptInviteCard } from "@/components/onboarding/accept-invite";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if there's a pending invite for this user's email
  let pendingInvite: {
    token: string;
    role: string;
    org_name: string;
  } | null = null;

  if (user) {
    const { data: invite } = await supabase.rpc(
      "get_pending_invite_for_user"
    );

    if (invite) {
      pendingInvite = invite as {
        token: string;
        role: string;
        org_name: string;
      };
    }
  }

  if (pendingInvite) {
    return (
      <AcceptInviteCard
        orgName={pendingInvite.org_name}
        role={pendingInvite.role}
        token={pendingInvite.token}
      />
    );
  }

  return <CreateOrgForm />;
}
