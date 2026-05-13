import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isFounderEmail } from "@/lib/analytics/founder-gate";

/**
 * Platform-admin gate for the cross-org /platform dashboards.
 * Reuses FOUNDER_EMAILS — same allowlist as /insights. 404s anyone else
 * so the route isn't even discoverable.
 */
export async function requirePlatformAdmin(): Promise<{
  user_id: string;
  email: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isFounderEmail(user.email)) notFound();
  return { user_id: user.id, email: user.email! };
}
