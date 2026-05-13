import { setRequestLocale } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { flagsFor } from "@/lib/platform/suspicious";
import { AccountsCleanup } from "./accounts-cleanup";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  org_id: string | null;
  org_name: string | null;
  flags: string[];
  last_sign_in_at: string | null;
};

export default async function AccountsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const admin = createAdminClient();

  // Three independent queries — joining profiles ↔ org_members confuses
  // PostgREST because org_members has two FKs back to profiles (user_id
  // and invited_by), so we merge in JS.
  const [
    { data: profiles, error: profilesError },
    { data: memberships, error: membersError },
    { data: orgs, error: orgsError },
    { data: authData, error: authError },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    admin.from("org_members").select("user_id, org_id"),
    admin.from("organizations").select("id, name"),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (profilesError) console.error("[accounts] profiles:", profilesError);
  if (membersError) console.error("[accounts] members:", membersError);
  if (orgsError) console.error("[accounts] orgs:", orgsError);
  if (authError) console.error("[accounts] auth:", authError);

  const orgNameById = new Map<string, string>();
  for (const o of orgs ?? []) orgNameById.set(o.id, o.name);

  const orgIdByUser = new Map<string, string>();
  for (const m of memberships ?? []) orgIdByUser.set(m.user_id, m.org_id);

  const signInById = new Map<string, string | null>();
  for (const u of authData?.users ?? []) {
    signInById.set(u.id, u.last_sign_in_at ?? null);
  }

  const rows: Row[] = (profiles ?? []).map((p) => {
    const orgId = orgIdByUser.get(p.id) ?? null;
    return {
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      created_at: p.created_at,
      org_id: orgId,
      org_name: orgId ? (orgNameById.get(orgId) ?? null) : null,
      flags: flagsFor(p.email, p.full_name),
      last_sign_in_at: signInById.get(p.id) ?? null,
    };
  });

  const flagged = rows
    .filter((r) => r.flags.length > 0)
    .sort((a, b) => b.flags.length - a.flags.length);

  const clean = rows.filter((r) => r.flags.length === 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Total accounts" value={rows.length} />
        <Kpi label="Flagged" value={flagged.length} tone="danger" />
        <Kpi
          label="Never signed in"
          value={rows.filter((r) => !r.last_sign_in_at).length}
        />
        <Kpi label="Clean" value={clean.length} tone="positive" />
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-1">
          Flagged accounts ({flagged.length})
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          Heuristic matches on email + name. Always review before deleting.
        </p>
        <AccountsCleanup rows={flagged} locale={locale} />
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "positive" | "danger";
}) {
  return (
    <div
      className={
        "rounded-lg border px-4 py-3 " +
        (tone === "danger"
          ? "border-destructive/25 bg-destructive/5"
          : tone === "positive"
            ? "border-emerald-500/25 bg-emerald-500/5"
            : "bg-card")
      }
    >
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold tabular-nums mt-1">
        {value.toLocaleString("en-US")}
      </p>
    </div>
  );
}
