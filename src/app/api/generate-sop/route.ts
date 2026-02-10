import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

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

  const { title, description } = await request.json();

  if (!title || !description) {
    return NextResponse.json(
      { error: "Title and description are required" },
      { status: 400 }
    );
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Process Title: ${title}\n\nProcess Description: ${description}`,
        },
      ],
      system: `You are an expert at creating Standard Operating Procedures.
Given a process description, return ONLY valid JSON with no markdown formatting:
{
  "sop": "Detailed procedure text (markdown formatted, 200-500 words)",
  "checklist": ["Step 1: ...", "Step 2: ...", ...]
}
The checklist should have 5-15 actionable, verifiable steps.
Each step should start with a verb and be specific enough to verify completion.
Do not wrap the JSON in code blocks or any other formatting.`,
    });

    const content = message.content[0];
    if (content.type !== "text") {
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
      return NextResponse.json(
        { error: "Invalid response structure from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("SOP generation error:", error);

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
