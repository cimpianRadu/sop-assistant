"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { allRulesPass } from "@/lib/password-validation";

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "invalid_email_format" };
  }

  if (!password || !allRulesPass(password)) {
    return { error: "password_too_weak" };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || "" },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Check org membership
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", data.user.id)
    .single();

  if (!membership) {
    // Check if there's an invite token
    const inviteToken = formData.get("inviteToken") as string | null;
    if (inviteToken) {
      redirect(`/invite/${inviteToken}`);
    }
    redirect("/onboarding");
  }

  redirect(`/${membership.role}/dashboard`);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
