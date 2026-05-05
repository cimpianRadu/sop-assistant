import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { MemberList } from "@/components/admin/member-list";
import { InviteForm } from "@/components/admin/invite-form";
import { PendingInvites } from "@/components/admin/pending-invites";
import { ChevronRightIcon } from "lucide-react";
import type { OrgMemberWithProfile, OrgInvite } from "@/lib/types";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Admin");
  const tc = await getTranslations("Common");
  const session = await getSessionContext();

  if (!session) return null;

  const supabase = await createClient();

  const { data: members, error: membersError } = await supabase
    .from("org_members")
    .select("*, profiles!org_members_user_id_fkey(email, full_name)")
    .eq("org_id", session.org_id)
    .order("joined_at", { ascending: true });

  if (membersError) {
    console.error("Members query error:", membersError);
  }

  const { data: invites } = await supabase
    .from("org_invites")
    .select("*")
    .eq("org_id", session.org_id)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl space-y-6">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-muted-foreground overflow-x-auto"
      >
        <Link
          href="/admin/dashboard"
          className="hover:text-foreground shrink-0"
        >
          {tc("dashboard")}
        </Link>
        <ChevronRightIcon className="size-3.5 shrink-0" />
        <span className="text-foreground">{t("members")}</span>
      </nav>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t("manageMembers")}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {(members || []).length}{" "}
          {(members || []).length === 1 ? "member" : "members"} ·{" "}
          {(invites || []).length}{" "}
          {(invites || []).length === 1 ? "pending invite" : "pending invites"}
        </p>
      </div>

      <InviteForm />
      <PendingInvites invites={(invites as OrgInvite[]) || []} />
      <MemberList
        members={(members as OrgMemberWithProfile[]) || []}
        currentUserId={session.user_id}
      />
    </div>
  );
}
