import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { generateSopLimiter, rateLimitResponse } from "@/lib/rate-limit";
import { logAiCall } from "@/lib/ai/log";

export const maxDuration = 60;

const MODEL = "claude-sonnet-4-5-20250929";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  // Verify authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 10 requests per minute per user
  const rl = generateSopLimiter.check(user.id);
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfterMs);
  }

  // Verify user is admin or manager in their org
  const { data: membership } = await supabase
    .from("org_members")
    .select("role, org_id")
    .eq("user_id", user.id)
    .single();

  if (!membership || !["admin", "manager"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, description, locale } = await request.json();

  if (!title || !description) {
    return NextResponse.json(
      { error: "Title and description are required" },
      { status: 400 }
    );
  }

  const languageInstruction =
    locale === "en"
      ? "Write ALL content (SOP text and checklist steps) in English."
      : "Write ALL content (SOP text and checklist steps) in Romanian. Use clear, professional Romanian language.";

  const startedAt = Date.now();
  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Process Title: ${title}\n\nProcess Description: ${description}`,
        },
      ],
      system: `You are an expert at creating Standard Operating Procedures.
${languageInstruction}
Given a process description, return ONLY valid JSON with no markdown formatting:
{
  "sop": "Detailed procedure text (markdown formatted, 200-500 words)",
  "checklist": ["Step 1: ...", "Step 2: ...", ...]
}
The checklist should have 5-15 actionable, verifiable steps.
Each step should start with a verb and be specific enough to verify completion.
Do not wrap the JSON in code blocks or any other formatting.`,
    });

    const usage = {
      input_tokens: message.usage?.input_tokens ?? 0,
      output_tokens: message.usage?.output_tokens ?? 0,
      cache_read_tokens: message.usage?.cache_read_input_tokens ?? 0,
      cache_creation_tokens: message.usage?.cache_creation_input_tokens ?? 0,
    };
    const latency_ms = Date.now() - startedAt;

    const content = message.content[0];
    if (content.type !== "text") {
      await logAiCall({
        endpoint: "generate-sop",
        model: MODEL,
        user_id: user.id,
        org_id: membership.org_id,
        latency_ms,
        status: "error",
        error: "unexpected_response_format",
        usage,
      });
      return NextResponse.json(
        { error: "Unexpected response format" },
        { status: 500 }
      );
    }

    // Strip markdown code blocks if present
    let jsonText = content.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    // Parse and validate the JSON response
    const parsed = JSON.parse(jsonText);

    if (!parsed.sop || !Array.isArray(parsed.checklist)) {
      await logAiCall({
        endpoint: "generate-sop",
        model: MODEL,
        user_id: user.id,
        org_id: membership.org_id,
        latency_ms,
        status: "error",
        error: "invalid_response_structure",
        usage,
      });
      return NextResponse.json(
        { error: "Invalid response structure from AI" },
        { status: 500 }
      );
    }

    await logAiCall({
      endpoint: "generate-sop",
      model: MODEL,
      user_id: user.id,
      org_id: membership.org_id,
      latency_ms,
      status: "ok",
      usage,
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("SOP generation error:", error);
    await logAiCall({
      endpoint: "generate-sop",
      model: MODEL,
      user_id: user.id,
      org_id: membership.org_id,
      latency_ms: Date.now() - startedAt,
      status: "error",
      error: error instanceof Error ? error.message : "unknown",
    });

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate SOP. Please try again." },
      { status: 500 }
    );
  }
}
