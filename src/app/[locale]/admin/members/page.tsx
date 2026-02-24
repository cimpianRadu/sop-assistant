import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { MemberList } from "@/components/admin/member-list";
import { InviteForm } from "@/components/admin/invite-form";
import { PendingInvites } from "@/components/admin/pending-invites";
import type { OrgMemberWithProfile, OrgInvite } from "@/lib/types";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Admin");
  const session = await getSessionContext();

  if (!session) return null;

  const supabase = await createClient();

  // Get org members (specify FK because org_members has two refs to profiles)
  const { data: members, error: membersError } = await supabase
    .from("org_members")
    .select("*, profiles!org_members_user_id_fkey(email, full_name)")
    .eq("org_id", session.org_id)
    .order("joined_at", { ascending: true });

  if (membersError) {
    console.error("Members query error:", membersError);
  }

  // Get pending invites
  const { data: invites } = await supabase
    .from("org_invites")
    .select("*")
    .eq("org_id", session.org_id)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/admin/dashboard">
        <Button variant="ghost" size="sm">
          {t("backToDashboard")}
        </Button>
      </Link>

      <h2 className="text-2xl font-bold">{t("manageMembers")}</h2>

      <InviteForm />
      <PendingInvites invites={(invites as OrgInvite[]) || []} />
      <MemberList
        members={(members as OrgMemberWithProfile[]) || []}
        currentUserId={session.user_id}
      />
    </div>
  );
}
