"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";

export async function createOrganization(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" };
  }

  // Check user is not already in an org
  const { data: existingMembership } = await supabase
    .from("org_members")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingMembership) {
    return { error: "already_in_org" };
  }

  const name = formData.get("name") as string;
  if (!name?.trim()) {
    return { error: "name_required" };
  }

  // Generate slug from name
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Math.random().toString(36).substring(2, 8);

  // Create organization + admin membership via SECURITY DEFINER function
  const { error: orgError } = await supabase.rpc("create_organization", {
    org_name: name.trim(),
    org_slug: slug,
  });

  if (orgError) {
    return { error: orgError.message };
  }

  redirect("/admin/dashboard");
}

export async function inviteMember(formData: FormData) {
  const session = await getSessionContext();
  if (!session || session.role !== "admin") {
    return { error: "unauthorized" };
  }

  const supabase = await createClient();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = formData.get("role") as "manager" | "operator";

  if (!email) {
    return { error: "email_required" };
  }

  if (!role || !["manager", "operator"].includes(role)) {
    return { error: "invalid_role" };
  }

  // Check if user is already in the org
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (existingProfile) {
    const { data: existingMember } = await supabase
      .from("org_members")
      .select("id")
      .eq("user_id", existingProfile.id)
      .eq("org_id", session.org_id)
      .single();

    if (existingMember) {
      return { error: "already_member" };
    }
  }

  const { data: invite, error: inviteError } = await supabase
    .from("org_invites")
    .insert({
      org_id: session.org_id,
      email,
      role,
      invited_by: session.user_id,
    })
    .select()
    .single();

  if (inviteError) {
    if (inviteError.code === "23505") {
      return { error: "already_invited" };
    }
    return { error: inviteError.message };
  }

  revalidatePath("/admin/members");
  return { success: true, token: invite.token };
}

export async function acceptInvite(token: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" };
  }

  const { data: result, error } = await supabase.rpc("accept_invite", {
    invite_token: token,
  });

  if (error) {
    return { error: error.message };
  }

  const parsed = result as { error?: string; success?: boolean; role?: string };
  if (parsed.error) {
    return { error: parsed.error };
  }

  redirect(`/${parsed.role}/dashboard`);
}

export async function removeMember(memberId: string) {
  const session = await getSessionContext();
  if (!session || session.role !== "admin") {
    return { error: "unauthorized" };
  }

  const supabase = await createClient();

  // Prevent removing self
  const { data: member } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("id", memberId)
    .eq("org_id", session.org_id)
    .single();

  if (!member) {
    return { error: "member_not_found" };
  }

  if (member.user_id === session.user_id) {
    return { error: "cannot_remove_self" };
  }

  const { error } = await supabase
    .from("org_members")
    .delete()
    .eq("id", memberId)
    .eq("org_id", session.org_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/members");
  return { success: true };
}

export async function cancelInvite(inviteId: string) {
  const session = await getSessionContext();
  if (!session || session.role !== "admin") {
    return { error: "unauthorized" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("org_invites")
    .delete()
    .eq("id", inviteId)
    .eq("org_id", session.org_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/members");
  return { success: true };
}
