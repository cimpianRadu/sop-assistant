import { setRequestLocale } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatCard } from "@/components/shared/stat-card";
import { parseRange, rangeLabel, rangeSinceIso } from "@/lib/platform/range";

export const dynamic = "force-dynamic";

type CallRow = {
  id: string;
  endpoint: string;
  model: string;
  org_id: string | null;
  user_id: string | null;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_creation_tokens: number;
  latency_ms: number | null;
  cost_usd: number | string;
  status: string;
  error: string | null;
  created_at: string;
};

function fmtUsd(n: number): string {
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

function fmtInt(n: number): string {
  return n.toLocaleString("en-US");
}

function pctile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

export default async function AiUsagePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { locale } = await params;
  const { range: rawRange } = await searchParams;
  setRequestLocale(locale);
  const range = parseRange(rawRange);

  const admin = createAdminClient();

  // eslint-disable-next-line react-hooks/purity -- server component, runs per-request
  const nowMs = Date.now();
  const sinceIso = rangeSinceIso(range, nowMs);

  const inRangeQuery = admin
    .from("ai_calls")
    .select(
      "id, endpoint, org_id, status, cost_usd, latency_ms, input_tokens, output_tokens, cache_read_tokens"
    );
  if (sinceIso) inRangeQuery.gte("created_at", sinceIso);

  const recentQuery = admin
    .from("ai_calls")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (sinceIso) recentQuery.gte("created_at", sinceIso);

  const [{ data: rangeCalls }, { data: recent }] = await Promise.all([
    inRangeQuery,
    recentQuery,
  ]);

  const all = (rangeCalls ?? []) as Partial<CallRow>[];
  const recentRows = (recent ?? []) as CallRow[];

  const callsInRange = all.length;
  const totalCost = all.reduce((s, r) => s + Number(r.cost_usd ?? 0), 0);
  const allLatencies = all
    .map((r) => r.latency_ms)
    .filter((x): x is number => typeof x === "number");
  const p95 = pctile(allLatencies, 95);
  const errorRate =
    all.length > 0
      ? (all.filter((r) => r.status === "error").length / all.length) * 100
      : 0;
  const label = rangeLabel(range);

  // Per-endpoint stats (all time)
  const endpointMap = new Map<
    string,
    { calls: number; cost: number; in: number; out: number; cache_read: number }
  >();
  for (const r of all) {
    const k = r.endpoint ?? "unknown";
    const cur = endpointMap.get(k) ?? {
      calls: 0,
      cost: 0,
      in: 0,
      out: 0,
      cache_read: 0,
    };
    cur.calls += 1;
    cur.cost += Number(r.cost_usd ?? 0);
    cur.in += r.input_tokens ?? 0;
    cur.out += r.output_tokens ?? 0;
    cur.cache_read += r.cache_read_tokens ?? 0;
    endpointMap.set(k, cur);
  }
  const endpointStats = [...endpointMap.entries()]
    .map(([endpoint, v]) => ({ endpoint, ...v }))
    .sort((a, b) => b.cost - a.cost);

  // Per-org spend (all time)
  const orgIds = [
    ...new Set(all.map((r) => r.org_id).filter((x): x is string => !!x)),
  ];
  const orgNameById = new Map<string, string>();
  if (orgIds.length > 0) {
    const { data: orgs } = await admin
      .from("organizations")
      .select("id, name")
      .in("id", orgIds);
    for (const o of orgs ?? []) orgNameById.set(o.id, o.name);
  }
  const orgMap = new Map<string, { calls: number; cost: number }>();
  for (const r of all) {
    const k = r.org_id ?? "_none_";
    const cur = orgMap.get(k) ?? { calls: 0, cost: 0 };
    cur.calls += 1;
    cur.cost += Number(r.cost_usd ?? 0);
    orgMap.set(k, cur);
  }
  const orgStats = [...orgMap.entries()]
    .map(([org_id, v]) => ({
      org_id,
      name: org_id === "_none_" ? "(no org)" : orgNameById.get(org_id) ?? org_id,
      ...v,
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 20);

  // Lookup user emails for recent rows
  const userIds = [
    ...new Set(recentRows.map((r) => r.user_id).filter((x): x is string => !!x)),
  ];
  const userEmailById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", userIds);
    for (const p of profiles ?? []) userEmailById.set(p.id, p.email);
  }

  const maxEndpointCost = Math.max(0.0001, ...endpointStats.map((e) => e.cost));

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Calls"
          value={fmtInt(callsInRange)}
          delta={label}
          deltaTone="neutral"
        />
        <StatCard
          label="Total cost"
          value={fmtUsd(totalCost)}
          tone="primary"
          delta={label}
          deltaTone="neutral"
        />
        <StatCard
          label="p95 latency"
          value={p95 > 0 ? `${(p95 / 1000).toFixed(1)}s` : "—"}
          delta={label}
          deltaTone="neutral"
        />
        <StatCard
          label="Error rate"
          value={`${errorRate.toFixed(1)}%`}
          tone={errorRate > 5 ? "danger" : "default"}
          delta={label}
          deltaTone={errorRate > 5 ? "danger" : "neutral"}
        />
      </div>

      {/* Per-endpoint */}
      <section>
        <h2 className="text-lg font-semibold mb-3">By endpoint ({label})</h2>
        {endpointStats.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No calls logged yet. Trigger a chat, SOP generation, or operator
            help and refresh.
          </p>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Endpoint</th>
                  <th className="text-right px-4 py-2 font-medium">Calls</th>
                  <th className="text-right px-4 py-2 font-medium">In tok</th>
                  <th className="text-right px-4 py-2 font-medium">Out tok</th>
                  <th className="text-right px-4 py-2 font-medium">Cache read</th>
                  <th className="text-right px-4 py-2 font-medium">Cost</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {endpointStats.map((e) => (
                  <tr key={e.endpoint} className="border-t">
                    <td className="px-4 py-2 font-mono text-xs">{e.endpoint}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {fmtInt(e.calls)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                      {fmtInt(e.in)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                      {fmtInt(e.out)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                      {fmtInt(e.cache_read)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">
                      {fmtUsd(e.cost)}
                    </td>
                    <td className="px-4 py-2 w-32">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(e.cost / maxEndpointCost) * 100}%`,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Per-org */}
      <section>
        <h2 className="text-lg font-semibold mb-3">By org ({label}, top 20)</h2>
        {orgStats.length === 0 ? (
          <p className="text-sm text-muted-foreground">No org data yet.</p>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Org</th>
                  <th className="text-right px-4 py-2 font-medium">Calls</th>
                  <th className="text-right px-4 py-2 font-medium">Cost</th>
                  <th className="text-right px-4 py-2 font-medium">Avg / call</th>
                </tr>
              </thead>
              <tbody>
                {orgStats.map((o) => (
                  <tr key={o.org_id} className="border-t">
                    <td className="px-4 py-2 truncate max-w-xs">{o.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {fmtInt(o.calls)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">
                      {fmtUsd(o.cost)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                      {fmtUsd(o.cost / o.calls)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          Recent calls ({label}, last 50)
        </h2>
        {recentRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet.</p>
        ) : (
          <div className="rounded-lg border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">When</th>
                  <th className="text-left px-4 py-2 font-medium">Endpoint</th>
                  <th className="text-left px-4 py-2 font-medium">User</th>
                  <th className="text-right px-4 py-2 font-medium">Latency</th>
                  <th className="text-right px-4 py-2 font-medium">Tok in/out</th>
                  <th className="text-right px-4 py-2 font-medium">Cost</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRows.map((r) => {
                  const when = new Date(r.created_at);
                  const cost = Number(r.cost_usd ?? 0);
                  return (
                    <tr key={r.id} className="border-t">
                      <td className="px-4 py-2 text-muted-foreground text-xs whitespace-nowrap">
                        {when.toLocaleString(locale, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {r.endpoint}
                      </td>
                      <td
                        className="px-4 py-2 text-xs text-muted-foreground truncate max-w-[200px]"
                        title={r.user_id ?? ""}
                      >
                        {(r.user_id && userEmailById.get(r.user_id)) || "—"}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                        {r.latency_ms != null
                          ? `${(r.latency_ms / 1000).toFixed(1)}s`
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground text-xs">
                        {fmtInt(r.input_tokens)}/{fmtInt(r.output_tokens)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {fmtUsd(cost)}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            r.status === "ok"
                              ? "text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "text-xs px-1.5 py-0.5 rounded bg-destructive/10 text-destructive"
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
