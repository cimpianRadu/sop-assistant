"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { sendUpgradeRequestEmail } from "@/lib/email";

type Plan = "growth" | "team" | "business";
type Cycle = "monthly" | "annual";

export async function createUpgradeRequest({
  plan,
  cycle,
}: {
  plan: Plan;
  cycle: Cycle;
}): Promise<{ success: true } | { error: string }> {
  const session = await getSessionContext();
  if (!session) return { error: "unauthorized" };

  if (session.role !== "admin" && session.role !== "manager") {
    return { error: "forbidden" };
  }

  const supabase = await createClient();

  const { error: insertError } = await supabase
    .from("upgrade_requests")
    .insert({
      org_id: session.org_id,
      requested_by: session.user_id,
      plan,
      cycle,
    });

  if (insertError) {
    console.error("Failed to insert upgrade_request:", insertError);
    return { error: "insert_failed" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", session.user_id)
    .single();

  // Email is best-effort — the row is the source of truth.
  void sendUpgradeRequestEmail({
    orgName: session.org_name,
    orgId: session.org_id,
    plan,
    cycle,
    requestedByEmail: session.email,
    requestedByName: profile?.full_name ?? null,
  });

  return { success: true };
}
