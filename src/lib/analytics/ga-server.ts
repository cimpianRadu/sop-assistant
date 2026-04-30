import "server-only";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

/**
 * Server-only GA4 Data API client. Lazily instantiated so importing this
 * module doesn't crash when env vars are missing — pages should call
 * `isGaConfigured()` before invoking the fetchers.
 */

let _client: BetaAnalyticsDataClient | null = null;

function getClient(): BetaAnalyticsDataClient {
  if (_client) return _client;

  const email = process.env.GA_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GA_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      "GA service account env vars missing — GA_SERVICE_ACCOUNT_EMAIL and GA_SERVICE_ACCOUNT_PRIVATE_KEY must be set."
    );
  }

  // Vercel/dotenv stores PEM newlines as literal "\n" in the env string.
  const privateKey = rawKey.replace(/\\n/g, "\n");

  _client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
  });
  return _client;
}

export function isGaConfigured(): boolean {
  return !!(
    process.env.GA_PROPERTY_ID &&
    process.env.GA_SERVICE_ACCOUNT_EMAIL &&
    process.env.GA_SERVICE_ACCOUNT_PRIVATE_KEY
  );
}

function propertyPath(): string {
  const id = process.env.GA_PROPERTY_ID;
  if (!id) throw new Error("GA_PROPERTY_ID env var missing.");
  return `properties/${id}`;
}

export type VisitorRange = "today" | "7d" | "30d" | "90d";

const RANGE_TO_DATES: Record<VisitorRange, { start: string; end: string }> = {
  today: { start: "today", end: "today" },
  "7d": { start: "7daysAgo", end: "today" },
  "30d": { start: "30daysAgo", end: "today" },
  "90d": { start: "90daysAgo", end: "today" },
};

/**
 * Pull active-user counts for the four ranges shown on the dashboard in a
 * single Data API roundtrip per range. GA's totalUsers metric counts unique
 * users (deduped by client_id) over the date range.
 */
export async function fetchVisitors(): Promise<Record<VisitorRange, number>> {
  const client = getClient();
  const property = propertyPath();

  const ranges = ["today", "7d", "30d", "90d"] as const;
  const results = await Promise.all(
    ranges.map(async (range) => {
      const { start, end } = RANGE_TO_DATES[range];
      const [response] = await client.runReport({
        property,
        dateRanges: [{ startDate: start, endDate: end }],
        metrics: [{ name: "totalUsers" }],
      });
      const value = Number(response.rows?.[0]?.metricValues?.[0]?.value ?? 0);
      return [range, value] as const;
    })
  );

  return Object.fromEntries(results) as Record<VisitorRange, number>;
}

/**
 * Counts of custom events fired during the last 30 days. Maps directly to the
 * event names declared in `lib/analytics/events.ts`.
 */
export async function fetchEventCounts(
  eventNames: string[]
): Promise<Record<string, { d7: number; d30: number }>> {
  const client = getClient();
  const property = propertyPath();

  const [response30, response7] = await Promise.all([
    client.runReport({
      property,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: { values: eventNames },
        },
      },
    }),
    client.runReport({
      property,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: { values: eventNames },
        },
      },
    }),
  ]);

  const out: Record<string, { d7: number; d30: number }> = {};
  for (const name of eventNames) {
    out[name] = { d7: 0, d30: 0 };
  }
  for (const row of response30[0].rows ?? []) {
    const name = row.dimensionValues?.[0]?.value ?? "";
    const count = Number(row.metricValues?.[0]?.value ?? 0);
    if (out[name]) out[name].d30 = count;
  }
  for (const row of response7[0].rows ?? []) {
    const name = row.dimensionValues?.[0]?.value ?? "";
    const count = Number(row.metricValues?.[0]?.value ?? 0);
    if (out[name]) out[name].d7 = count;
  }
  return out;
}

/**
 * Top traffic sources for the last 30 days, ordered by user count.
 */
export async function fetchTopSources(limit = 5): Promise<
  Array<{ source: string; medium: string; users: number }>
> {
  const client = getClient();
  const [response] = await client.runReport({
    property: propertyPath(),
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
    metrics: [{ name: "totalUsers" }],
    orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
    limit: limit,
  });

  return (response.rows ?? []).map((row) => ({
    source: row.dimensionValues?.[0]?.value ?? "(unknown)",
    medium: row.dimensionValues?.[1]?.value ?? "(unknown)",
    users: Number(row.metricValues?.[0]?.value ?? 0),
  }));
}
