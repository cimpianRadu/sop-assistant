import { streamText, UIMessage, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";
import { chatLimiter, rateLimitResponse } from "@/lib/rate-limit";
import { logAiCall } from "@/lib/ai/log";

export const maxDuration = 30;

const MODEL = "claude-sonnet-4-5-20250929";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Rate limit: 60 requests per minute per user
  const rl = chatLimiter.check(user.id);
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfterMs);
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("role, org_id")
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

  const startedAt = Date.now();

  const result = streamText({
    model: anthropic(MODEL),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 1024,
    onFinish: async ({ usage }) => {
      // Vercel AI SDK v6 reports usage as { inputTokens, outputTokens, ... }
      // when available. Cache tokens are surfaced via providerMetadata.
      const u = usage as unknown as {
        inputTokens?: number;
        outputTokens?: number;
        cachedInputTokens?: number;
      };
      await logAiCall({
        endpoint: "chat",
        model: MODEL,
        user_id: user.id,
        org_id: membership.org_id,
        latency_ms: Date.now() - startedAt,
        status: "ok",
        usage: {
          input_tokens: u.inputTokens ?? 0,
          output_tokens: u.outputTokens ?? 0,
          cache_read_tokens: u.cachedInputTokens ?? 0,
          cache_creation_tokens: 0,
        },
      });
    },
    onError: async ({ error }) => {
      await logAiCall({
        endpoint: "chat",
        model: MODEL,
        user_id: user.id,
        org_id: membership.org_id,
        latency_ms: Date.now() - startedAt,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    },
  });

  return result.toUIMessageStreamResponse();
}
