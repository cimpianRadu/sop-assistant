import { streamText, UIMessage, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return new Response("Forbidden", { status: 403 });
  }

  const {
    messages,
    sopText,
    processTitle,
    activeStepNumber,
    activeStepText,
    locale,
  }: {
    messages: UIMessage[];
    sopText: string;
    processTitle: string;
    activeStepNumber?: number;
    activeStepText?: string;
    locale?: string;
  } = await request.json();

  if (!messages || !sopText) {
    return new Response("Missing required fields", { status: 400 });
  }

  const languageInstruction =
    locale === "en"
      ? "Respond in English."
      : "Respond in Romanian. Use clear, professional Romanian language.";

  let stepContext = "";
  if (activeStepNumber && activeStepText) {
    stepContext = `\n\nThe operator is currently asking about Step #${activeStepNumber}: "${activeStepText}"`;
  }

  const systemPrompt = `You are a helpful assistant for operators executing Standard Operating Procedures (SOPs).
${languageInstruction}

You have access to the full SOP for the process "${processTitle}". Use it to provide accurate, specific guidance.

Here is the full SOP for reference:
---
${sopText}
---
${stepContext}

Guidelines:
- Be specific and actionable
- Reference the SOP when relevant
- If the question is about something outside the SOP scope, say so clearly
- Keep responses concise but thorough
- If the operator seems to need manager approval or intervention, suggest they use the escalation feature
- You can reference any step in the SOP, not just the current one`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-5-20250929"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 1024,
  });

  return result.toUIMessageStreamResponse();
}
