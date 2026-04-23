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
    .select("id, org_id, current_version, title, description, sop_text")
    .eq("id", id)
    .single();

  if (fetchError || !existing) return { error: "not_found" };
  if (existing.org_id !== session.org_id) return { error: "forbidden" };

  // Compare against current checklist to detect actual changes
  const cleaned = data.checklist.map((s) => s.trim()).filter(Boolean);
  const { data: existingSteps } = await supabase
    .from("checklist_steps")
    .select("step_number, step_text")
    .eq("process_id", id)
    .order("step_number");
  const existingChecklist = (existingSteps || []).map((s) => s.step_text);

  const checklistChanged =
    existingChecklist.length !== cleaned.length ||
    existingChecklist.some((t, i) => t !== cleaned[i]);
  const fieldsChanged =
    existing.title !== data.title ||
    existing.description !== data.description ||
    existing.sop_text !== data.sopText;
  const anythingChanged = fieldsChanged || checklistChanged;

  // Update process fields; trigger will set updated_at.
  // Skip the write entirely when nothing changed so updated_at + current_version stay put.
  if (anythingChanged) {
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
  }

  // Replace checklist steps only when they actually changed
  if (checklistChanged) {
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
  }

  revalidatePath(`/manager/processes/${id}`);
  redirect(`/manager/processes/${id}`);
}
