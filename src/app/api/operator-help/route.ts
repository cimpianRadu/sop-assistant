import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

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

  // Verify user is a member of an org
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
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

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
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
      return NextResponse.json(
        { error: "Unexpected response format" },
        { status: 500 }
      );
    }

    return NextResponse.json({ response: content.text });
  } catch (error) {
    console.error("Operator help error:", error);
    return NextResponse.json(
      { error: "Failed to get help. Please try again." },
      { status: 500 }
    );
  }
}
