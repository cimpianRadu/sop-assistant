"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";

export async function assignOperator(
  processId: string,
  operatorId: string
) {
  const session = await getSessionContext();
  if (!session) {
    return { error: "unauthorized" };
  }

  if (session.role !== "admin" && session.role !== "manager") {
    return { error: "forbidden" };
  }

  const supabase = await createClient();

  // Verify operator is in the same org
  const { data: member } = await supabase
    .from("org_members")
    .select("id, role")
    .eq("user_id", operatorId)
    .eq("org_id", session.org_id)
    .single();

  if (!member || member.role !== "operator") {
    return { error: "operatorNotFound" };
  }

  const { error: assignError } = await supabase
    .from("process_assignments")
    .insert({
      process_id: processId,
      operator_id: operatorId,
      assigned_by: session.user_id,
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

export async function removeOperator(
  processId: string,
  assignmentId: string
) {
  const session = await getSessionContext();
  if (!session) {
    return { error: "unauthorized" };
  }

  if (session.role !== "admin" && session.role !== "manager") {
    return { error: "forbidden" };
  }

  const supabase = await createClient();

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
