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

  // Pull all profiles with their org membership.
  const { data: profiles } = await admin
    .from("profiles")
    .select(
      "id, email, full_name, created_at, org_members(org_id, organizations(name))"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  // Pull auth users (paginated — single page of 1000 is enough for our scale).
  const { data: authData } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const signInById = new Map<string, string | null>();
  for (const u of authData?.users ?? []) {
    signInById.set(u.id, u.last_sign_in_at ?? null);
  }

  const rows: Row[] = (profiles ?? []).map((p) => {
    const member = (p.org_members as unknown as Array<{
      org_id: string;
      organizations: { name: string } | null;
    }>)[0];
    return {
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      created_at: p.created_at,
      org_id: member?.org_id ?? null,
      org_name: member?.organizations?.name ?? null,
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
