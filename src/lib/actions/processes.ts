"use server";

import { redirect } from "next/navigation";
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
