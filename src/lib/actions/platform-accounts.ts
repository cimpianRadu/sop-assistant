"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/platform-gate";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteAccounts(userIds: string[]): Promise<{
  ok: number;
  failed: { user_id: string; error: string }[];
}> {
  await requirePlatformAdmin();

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { ok: 0, failed: [] };
  }

  const admin = createAdminClient();
  let ok = 0;
  const failed: { user_id: string; error: string }[] = [];

  // Find orgs that would become memberless after these deletions and remove
  // them. We do this upfront so the foreign-key cleanup is deterministic.
  const { data: theirMemberships } = await admin
    .from("org_members")
    .select("user_id, org_id")
    .in("user_id", userIds);

  const orgIdsTouched = [
    ...new Set((theirMemberships ?? []).map((m) => m.org_id)),
  ];

  for (const userId of userIds) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      failed.push({ user_id: userId, error: error.message });
    } else {
      ok += 1;
    }
  }

  // Drop now-empty orgs.
  if (orgIdsTouched.length > 0) {
    const { data: remainingMembers } = await admin
      .from("org_members")
      .select("org_id")
      .in("org_id", orgIdsTouched);
    const stillPopulated = new Set(
      (remainingMembers ?? []).map((m) => m.org_id)
    );
    const emptyOrgIds = orgIdsTouched.filter((id) => !stillPopulated.has(id));
    if (emptyOrgIds.length > 0) {
      await admin.from("organizations").delete().in("id", emptyOrgIds);
    }
  }

  revalidatePath("/platform/accounts");
  return { ok, failed };
}
