"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function assignOperator(processId: string, operatorEmail: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" };
  }

  // Look up the operator profile by email
  const { data: operatorProfile, error: lookupError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("email", operatorEmail)
    .single();

  if (lookupError || !operatorProfile) {
    return { error: "operatorNotFound" };
  }

  if (operatorProfile.role !== "operator") {
    return { error: "notAnOperator" };
  }

  const { error: assignError } = await supabase
    .from("process_assignments")
    .insert({
      process_id: processId,
      operator_id: operatorProfile.id,
      assigned_by: user.id,
    });

  if (assignError) {
    if (assignError.code === "23505") {
      return { error: "alreadyAssigned" };
    }
    return { error: assignError.message };
  }

  revalidatePath(`/manager/processes/${processId}`);
  return { success: true };
}

export async function removeOperator(processId: string, assignmentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" };
  }

  const { error } = await supabase
    .from("process_assignments")
    .delete()
    .eq("id", assignmentId)
    .eq("process_id", processId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/manager/processes/${processId}`);
  return { success: true };
}
