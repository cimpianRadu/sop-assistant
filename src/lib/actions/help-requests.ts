"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createHelpRequest(data: {
  executionId: string;
  checklistStepId: string;
  processId: string;
  question: string;
  aiResponse: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" };
  }

  const { data: helpRequest, error } = await supabase
    .from("help_requests")
    .insert({
      execution_id: data.executionId,
      checklist_step_id: data.checklistStepId,
      operator_id: user.id,
      process_id: data.processId,
      question: data.question,
      ai_response: data.aiResponse,
      escalated: false,
      resolved: false,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { success: true, helpRequestId: helpRequest.id };
}

export async function escalateHelpRequest(
  helpRequestId: string,
  escalationNote: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" };
  }

  const { error } = await supabase
    .from("help_requests")
    .update({
      escalated: true,
      escalation_note: escalationNote,
    })
    .eq("id", helpRequestId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function resolveHelpRequest(helpRequestId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" };
  }

  const { error } = await supabase
    .from("help_requests")
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", helpRequestId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/manager/dashboard");
  return { success: true };
}
