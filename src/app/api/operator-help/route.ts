import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { operatorHelpLimiter, rateLimitResponse } from "@/lib/rate-limit";
import { logAiCall } from "@/lib/ai/log";

export const maxDuration = 60;

const MODEL = "claude-sonnet-4-5-20250929";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 30 requests per minute per user
  const rl = operatorHelpLimiter.check(user.id);
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfterMs);
  }

  // Verify user is a member of an org
  const { data: membership } = await supabase
    .from("org_members")
    .select("role, org_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { processTitle, sopText, stepText, stepNumber, question, locale } =
    await request.json();

  if (!question || !sopText || !stepText) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const languageInstruction =
    locale === "en"
      ? "Respond in English."
      : "Respond in Romanian. Use clear, professional Romanian language.";

  const startedAt = Date.now();
  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `I'm an operator working on a process and I need help with a specific step.

Process: ${processTitle}
Current Step (#${stepNumber}): ${stepText}

My question: ${question}`,
        },
      ],
      system: `You are a helpful assistant for operators executing Standard Operating Procedures (SOPs).
${languageInstruction}
You have access to the full SOP for context. Provide clear, practical guidance to help the operator complete their current step.

Here is the full SOP for reference:
---
${sopText}
---

Guidelines:
- Be specific and actionable
- Reference the SOP when relevant
- If the question is about something outside the SOP scope, say so clearly
- Keep responses concise (2-4 paragraphs max)
- If the operator seems to need manager approval or intervention, suggest they escalate`,
    });

    const content = message.content[0];
    if (content.type !== "text") {
      await logAiCall({
        endpoint: "operator-help",
        model: MODEL,
        user_id: user.id,
        org_id: membership.org_id,
        latency_ms: Date.now() - startedAt,
        status: "error",
        error: "unexpected_response_format",
        usage: {
          input_tokens: message.usage?.input_tokens ?? 0,
          output_tokens: message.usage?.output_tokens ?? 0,
          cache_read_tokens: message.usage?.cache_read_input_tokens ?? 0,
          cache_creation_tokens: message.usage?.cache_creation_input_tokens ?? 0,
        },
      });
      return NextResponse.json(
        { error: "Unexpected response format" },
        { status: 500 }
      );
    }

    await logAiCall({
      endpoint: "operator-help",
      model: MODEL,
      user_id: user.id,
      org_id: membership.org_id,
      latency_ms: Date.now() - startedAt,
      status: "ok",
      usage: {
        input_tokens: message.usage?.input_tokens ?? 0,
        output_tokens: message.usage?.output_tokens ?? 0,
        cache_read_tokens: message.usage?.cache_read_input_tokens ?? 0,
        cache_creation_tokens: message.usage?.cache_creation_input_tokens ?? 0,
      },
    });

    return NextResponse.json({ response: content.text });
  } catch (error) {
    console.error("Operator help error:", error);
    await logAiCall({
      endpoint: "operator-help",
      model: MODEL,
      user_id: user.id,
      org_id: membership.org_id,
      latency_ms: Date.now() - startedAt,
      status: "error",
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Failed to get help. Please try again." },
      { status: 500 }
    );
  }
}
