import { setRequestLocale } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { flagsFor } from "@/lib/platform/suspicious";
import { AccountsCleanup } from "./accounts-cleanup";
import { Link } from "@/i18n/navigation";
import { parseRange, rangeLabel, rangeSinceIso } from "@/lib/platform/range";

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

type FilterKey = "all" | "flagged" | "never" | "clean";

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "All accounts",
  flagged: "Flagged",
  never: "Never signed in",
  clean: "Clean",
};

function parseFilter(raw: string | string[] | undefined): FilterKey {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "all" || v === "flagged" || v === "never" || v === "clean") {
    return v;
  }
  return "flagged"; // default: most useful view
}

export default async function AccountsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string; range?: string }>;
}) {
  const { locale } = await params;
  const { filter: rawFilter, range: rawRange } = await searchParams;
  setRequestLocale(locale);
  const activeFilter = parseFilter(rawFilter);
  const range = parseRange(rawRange);
  // eslint-disable-next-line react-hooks/purity -- server component, runs per-request
  const nowMs = Date.now();
  const sinceIso = rangeSinceIso(range, nowMs);
  const sinceMs = sinceIso ? new Date(sinceIso).getTime() : null;

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

  const allRows: Row[] = (profiles ?? []).map((p) => {
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

  // Time-range filter applies to last_sign_in_at for accounts that HAVE
  // signed in. The "Never signed in" view ignores the range — by definition
  // those accounts have no sign-in to filter on.
  const isInRange = (r: Row): boolean => {
    if (sinceMs === null) return true;
    if (!r.last_sign_in_at) return false;
    return new Date(r.last_sign_in_at).getTime() >= sinceMs;
  };

  const neverSignedIn = allRows.filter((r) => !r.last_sign_in_at);
  const rowsInRange = allRows.filter(isInRange);

  // KPIs reflect the time-filtered subset (except "Never signed in", which
  // is independent of date — it's about the absence of a sign-in).
  const flagged = rowsInRange
    .filter((r) => r.flags.length > 0)
    .sort((a, b) => b.flags.length - a.flags.length);
  const clean = rowsInRange.filter((r) => r.flags.length === 0);

  const visible: Row[] =
    activeFilter === "all"
      ? rowsInRange
      : activeFilter === "flagged"
        ? flagged
        : activeFilter === "never"
          ? neverSignedIn
          : clean;

  const label = rangeLabel(range);
  const rangeQs = range === "all" ? "" : `&range=${range}`;
  const kpiSubtitle =
    range === "all" ? "by last sign-in" : `signed in ${label}`;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiLink
          href={`/platform/accounts?filter=all${rangeQs}`}
          label="Total accounts"
          value={rowsInRange.length}
          active={activeFilter === "all"}
        />
        <KpiLink
          href={`/platform/accounts?filter=flagged${rangeQs}`}
          label="Flagged"
          value={flagged.length}
          tone="danger"
          active={activeFilter === "flagged"}
        />
        <KpiLink
          href={`/platform/accounts?filter=never${rangeQs}`}
          label="Never signed in"
          value={neverSignedIn.length}
          active={activeFilter === "never"}
        />
        <KpiLink
          href={`/platform/accounts?filter=clean${rangeQs}`}
          label="Clean"
          value={clean.length}
          tone="positive"
          active={activeFilter === "clean"}
        />
      </div>

      {activeFilter !== "never" && (
        <p className="text-xs text-muted-foreground -mt-4">
          KPIs above scoped to accounts {kpiSubtitle}. &ldquo;Never signed
          in&rdquo; is independent of the date range.
        </p>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-1">
          {FILTER_LABELS[activeFilter]} ({visible.length})
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          {activeFilter === "flagged"
            ? "Heuristic matches on email + name. Always review before deleting."
            : activeFilter === "never"
              ? "Accounts that signed up but never logged in. Strong signal of spam or abandoned signups."
              : activeFilter === "clean"
                ? "No heuristic flags. Likely real users."
                : "Every account in the database."}
        </p>
        <AccountsCleanup rows={visible} locale={locale} />
      </section>
    </div>
  );
}

function KpiLink({
  href,
  label,
  value,
  tone = "default",
  active = false,
}: {
  href: string;
  label: string;
  value: number;
  tone?: "default" | "positive" | "danger";
  active?: boolean;
}) {
  const base = "rounded-lg border px-4 py-3 transition-all block";
  const toneClasses =
    tone === "danger"
      ? "border-destructive/25 bg-destructive/5"
      : tone === "positive"
        ? "border-emerald-500/25 bg-emerald-500/5"
        : "bg-card";
  const ring = active
    ? tone === "danger"
      ? "ring-2 ring-destructive/40"
      : tone === "positive"
        ? "ring-2 ring-emerald-500/40"
        : "ring-2 ring-primary/40"
    : "hover:shadow-sm";
  return (
    <Link href={href} className={`${base} ${toneClasses} ${ring}`}>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold tabular-nums mt-1">
        {value.toLocaleString("en-US")}
      </p>
    </Link>
  );
}
