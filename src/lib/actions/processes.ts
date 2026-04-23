"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";

export async function saveProcess(data: {
  title: string;
  description: string;
  sopText: string;
  checklist: string[];
}) {
  const session = await getSessionContext();
  if (!session) {
    return { error: "unauthorized" };
  }

  if (session.role !== "admin" && session.role !== "manager") {
    return { error: "forbidden" };
  }

  const supabase = await createClient();

  // Insert process
  const { data: process, error: processError } = await supabase
    .from("processes")
    .insert({
      org_id: session.org_id,
      created_by: session.user_id,
      title: data.title,
      description: data.description,
      sop_text: data.sopText,
    })
    .select()
    .single();

  if (processError) {
    return { error: processError.message };
  }

  // Insert checklist steps
  const steps = data.checklist.map((text, index) => ({
    process_id: process.id,
    step_number: index + 1,
    step_text: text,
  }));

  const { error: stepsError } = await supabase
    .from("checklist_steps")
    .insert(steps);

  if (stepsError) {
    return { error: stepsError.message };
  }

  redirect(`/manager/processes/${process.id}`);
}

export async function updateProcess(
  id: string,
  data: {
    title: string;
    description: string;
    sopText: string;
    checklist: string[];
  }
) {
  const session = await getSessionContext();
  if (!session) return { error: "unauthorized" };
  if (session.role !== "admin" && session.role !== "manager") {
    return { error: "forbidden" };
  }

  if (!data.title.trim() || !data.description.trim() || !data.sopText.trim()) {
    return { error: "missing_fields" };
  }

  const supabase = await createClient();

  // Verify the process exists and belongs to this org
  const { data: existing, error: fetchError } = await supabase
    .from("processes")
    .select("id, org_id, current_version")
    .eq("id", id)
    .single();

  if (fetchError || !existing) return { error: "not_found" };
  if (existing.org_id !== session.org_id) return { error: "forbidden" };

  // Update process fields; trigger will set updated_at
  const { error: updateError } = await supabase
    .from("processes")
    .update({
      title: data.title,
      description: data.description,
      sop_text: data.sopText,
      current_version: existing.current_version + 1,
    })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  // Replace checklist steps (simple strategy: delete + insert)
  const cleaned = data.checklist.map((s) => s.trim()).filter(Boolean);

  const { error: deleteError } = await supabase
    .from("checklist_steps")
    .delete()
    .eq("process_id", id);

  if (deleteError) return { error: deleteError.message };

  if (cleaned.length > 0) {
    const rows = cleaned.map((text, index) => ({
      process_id: id,
      step_number: index + 1,
      step_text: text,
    }));
    const { error: insertError } = await supabase
      .from("checklist_steps")
      .insert(rows);
    if (insertError) return { error: insertError.message };
  }

  revalidatePath(`/manager/processes/${id}`);
  redirect(`/manager/processes/${id}`);
}
