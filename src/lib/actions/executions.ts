"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function startExecution(processId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" };
  }

  // Create execution
  const { data: execution, error: execError } = await supabase
    .from("executions")
    .insert({
      process_id: processId,
      operator_id: user.id,
      status: "in_progress",
    })
    .select()
    .single();

  if (execError) {
    return { error: execError.message };
  }

  // Get all checklist steps for this process
  const { data: steps } = await supabase
    .from("checklist_steps")
    .select("id")
    .eq("process_id", processId)
    .order("step_number");

  if (steps && steps.length > 0) {
    const executionSteps = steps.map((step) => ({
      execution_id: execution.id,
      checklist_step_id: step.id,
      completed: false,
    }));

    const { error: stepsError } = await supabase
      .from("execution_steps")
      .insert(executionSteps);

    if (stepsError) {
      return { error: stepsError.message };
    }
  }

  redirect(`/operator/processes/${processId}/execute/${execution.id}`);
}

export async function toggleStep(
  executionStepId: string,
  completed: boolean,
  executionId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" };
  }

  const { error } = await supabase
    .from("execution_steps")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", executionStepId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/operator/processes`);
  return { success: true };
}

export async function completeExecution(executionId: string, processId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" };
  }

  const { error } = await supabase
    .from("executions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", executionId);

  if (error) {
    return { error: error.message };
  }

  redirect(`/operator/processes/${processId}`);
}
