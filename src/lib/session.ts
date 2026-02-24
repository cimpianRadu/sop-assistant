"use server";

import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/types";

export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("org_members")
    .select("role, org_id, organizations(name, trial_ends_at, subscription_status)")
    .eq("user_id", user.id)
    .single();

  if (!membership) return null;

  const org = membership.organizations as unknown as {
    name: string;
    trial_ends_at: string | null;
    subscription_status: string;
  };

  return {
    user_id: user.id,
    email: user.email!,
    org_id: membership.org_id,
    org_name: org.name,
    role: membership.role as SessionContext["role"],
    trial_ends_at: org.trial_ends_at,
    subscription_status: org.subscription_status as SessionContext["subscription_status"],
  };
}
