import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchEventCounts,
  fetchTopSources,
  fetchVisitors,
  isGaConfigured,
} from "@/lib/analytics/ga-server";
import { isFounderEmail } from "@/lib/analytics/founder-gate";
import { GA_EVENTS } from "@/lib/analytics/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Founder insights",
  robots: { index: false, follow: false },
};

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        {label}
      </div>
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function NotConfigured({ reason }: { reason: string }) {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Founder insights — setup needed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{reason}</p>
          <p>
            Add the missing values to the production Vercel env. See{" "}
            <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
              .env.example
            </code>{" "}
            for the full list.
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              Set <code>NEXT_PUBLIC_GA_ID</code> (G-XXXX measurement ID, for the
              tracking script).
            </li>
            <li>
              Set <code>GA_PROPERTY_ID</code> (numeric, from GA Admin → Property
              settings).
            </li>
            <li>
              Create a GCP service account with Viewer role on the GA property,
              paste <code>GA_SERVICE_ACCOUNT_EMAIL</code> and{" "}
              <code>GA_SERVICE_ACCOUNT_PRIVATE_KEY</code>.
            </li>
            <li>
              Add your email to <code>FOUNDER_EMAILS</code>.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Auth + founder gate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();
  if (!isFounderEmail(user.email)) notFound();

  if (!isGaConfigured()) {
    return (
      <NotConfigured reason="GA Data API credentials are not configured. The dashboard needs a service account to read your analytics property." />
    );
  }

  // Pull metrics in parallel — GA Data API is rate-limited but these 3 calls
  // are well within the free quota.
  let visitors: Awaited<ReturnType<typeof fetchVisitors>>;
  let events: Awaited<ReturnType<typeof fetchEventCounts>>;
  let sources: Awaited<ReturnType<typeof fetchTopSources>>;
  try {
    [visitors, events, sources] = await Promise.all([
      fetchVisitors(),
      fetchEventCounts([
        GA_EVENTS.START_TRIAL_CLICK,
        GA_EVENTS.VIEW_PRICING,
        GA_EVENTS.WATCH_DEMO_CLICK,
        GA_EVENTS.DEMO_VIDEO_PLAY,
      ]),
      fetchTopSources(8),
    ]);
  } catch (err) {
    return (
      <NotConfigured
        reason={`GA Data API call failed: ${
          err instanceof Error ? err.message : "unknown error"
        }. Check that the service account has Viewer access on the GA property.`}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Founder insights</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live data from Google Analytics 4. Updated on every page load.
          </p>
        </div>
        <a
          href={`https://analytics.google.com/analytics/web/#/p${process.env.GA_PROPERTY_ID}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Open GA console <ExternalLink className="size-3.5" />
        </a>
      </header>

      {/* Visitors */}
      <section className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Visitors
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Today" value={fmt(visitors.today)} />
          <StatCard label="Last 7 days" value={fmt(visitors["7d"])} />
          <StatCard label="Last 30 days" value={fmt(visitors["30d"])} />
          <StatCard label="Last 90 days" value={fmt(visitors["90d"])} />
        </div>
      </section>

      {/* Funnel — events that matter */}
      <section className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Funnel events
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Pricing page visits"
            value={fmt(events[GA_EVENTS.VIEW_PRICING].d30)}
            hint={`${fmt(events[GA_EVENTS.VIEW_PRICING].d7)} this week`}
          />
          <StatCard
            label="Start trial clicks"
            value={fmt(events[GA_EVENTS.START_TRIAL_CLICK].d30)}
            hint={`${fmt(events[GA_EVENTS.START_TRIAL_CLICK].d7)} this week`}
          />
          <StatCard
            label="Watch demo clicks"
            value={fmt(events[GA_EVENTS.WATCH_DEMO_CLICK].d30)}
            hint={`${fmt(events[GA_EVENTS.WATCH_DEMO_CLICK].d7)} this week`}
          />
          <StatCard
            label="Demo video plays"
            value={fmt(events[GA_EVENTS.DEMO_VIDEO_PLAY].d30)}
            hint={`${fmt(events[GA_EVENTS.DEMO_VIDEO_PLAY].d7)} this week`}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Conversion (last 30d):{" "}
          {visitors["30d"] > 0
            ? (
                (events[GA_EVENTS.START_TRIAL_CLICK].d30 / visitors["30d"]) *
                100
              ).toFixed(2)
            : "0.00"}
          % visitors → start trial clicks
        </p>
      </section>

      {/* Top sources */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Top sources (last 30 days)
        </h2>
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left py-2.5 px-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Source
                </th>
                <th className="text-left py-2.5 px-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Medium
                </th>
                <th className="text-right py-2.5 px-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Users
                </th>
              </tr>
            </thead>
            <tbody className="[&>tr:not(:last-child)]:border-b">
              {sources.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="py-6 px-4 text-center text-muted-foreground text-sm"
                  >
                    No data yet.
                  </td>
                </tr>
              )}
              {sources.map((s, i) => (
                <tr key={i}>
                  <td className="py-3 px-4 font-medium">{s.source}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {s.medium}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">
                    {fmt(s.users)}{" "}
                    <ArrowUpRight className="size-3.5 inline text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
