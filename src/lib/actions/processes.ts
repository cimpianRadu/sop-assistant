"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveProcess(data: {
  title: string;
  description: string;
  sopText: string;
  checklist: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" };
  }

  // Insert process
  const { data: process, error: processError } = await supabase
    .from("processes")
    .insert({
      manager_id: user.id,
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
