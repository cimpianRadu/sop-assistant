import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import type { ChecklistStep } from "@/lib/types";

const TTL_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_HELP_REQUESTS = 30;
const MIN_SIGNAL = 3; // skip the AI call if there are fewer help requests than this

export type SuggestionPayload = {
  has_insights: boolean;
  headline: string;
  edits: string[];
  reason?: string; // populated when has_insights is false
};

export type Suggestion = {
  payload: SuggestionPayload;
  based_on_count: number;
  generated_at: string;
  cached: boolean;
};

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Returns a cached or freshly generated AI suggestion for improving the SOP,
 * derived from the recent help requests + escalations on this process.
 *
 * - 24h cache per process (re-run after that)
 * - If <3 help requests exist, returns has_insights=false without calling the model
 * - Returns null when caller is not authorized (operators, missing session, etc.)
 *   so the UI can simply hide the panel.
 */
export async function getProcessSuggestion(
  processId: string,
  locale: string = "en"
): Promise<Suggestion | null> {
  const session = await getSessionContext();
  if (!session) return null;
  if (session.role !== "admin" && session.role !== "manager") return null;

  const supabase = await createClient();

  // Verify ownership + load process
  const { data: process } = await supabase
    .from("processes")
    .select("id, org_id, title, sop_text, updated_at")
    .eq("id", processId)
    .single();
  if (!process || process.org_id !== session.org_id) return null;

  // 1. Check cache
  const { data: cached } = await supabase
    .from("process_ai_suggestions")
    .select("suggestion, based_on_count, generated_at")
    .eq("process_id", processId)
    .maybeSingle();

  if (cached) {
    const age = Date.now() - new Date(cached.generated_at).getTime();
    const stillFresh = age < TTL_MS;
    // Also invalidate if SOP itself was edited after the cached suggestion
    const sopChangedSince =
      new Date(process.updated_at).getTime() >
      new Date(cached.generated_at).getTime();
    if (stillFresh && !sopChangedSince) {
      return {
        payload: cached.suggestion as SuggestionPayload,
        based_on_count: cached.based_on_count,
        generated_at: cached.generated_at,
        cached: true,
      };
    }
  }

  // 2. Pull recent help_requests + checklist for context
  const [{ data: helpRequests }, { data: steps }] = await Promise.all([
    supabase
      .from("help_requests")
      .select("question, ai_response, escalation_note, escalated, created_at")
      .eq("process_id", processId)
      .order("created_at", { ascending: false })
      .limit(MAX_HELP_REQUESTS),
    supabase
      .from("checklist_steps")
      .select("step_number, step_text")
      .eq("process_id", processId)
      .order("step_number"),
  ]);

  const requests = helpRequests || [];
  const checklist = (steps as Pick<ChecklistStep, "step_number" | "step_text">[]) || [];

  // 3. Not enough signal → store a "neutral" suggestion so we don't recompute on every load
  if (requests.length < MIN_SIGNAL) {
    const payload: SuggestionPayload = {
      has_insights: false,
      headline: "",
      edits: [],
      reason: "not_enough_signal",
    };
    await upsertSuggestion(processId, session.org_id, payload, requests.length);
    return {
      payload,
      based_on_count: requests.length,
      generated_at: new Date().toISOString(),
      cached: false,
    };
  }

  // 4. Build prompt
  const checklistText = checklist
    .map((s) => `${s.step_number}. ${s.step_text}`)
    .join("\n");

  const requestsText = requests
    .map((r, i) => {
      const tags = [
        r.escalated ? "ESCALATED" : null,
        r.escalation_note ? `note: ${r.escalation_note}` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      const ai = r.ai_response ? `\n   AI: ${truncate(r.ai_response, 240)}` : "";
      return `${i + 1}. ${tags ? `[${tags}] ` : ""}Q: ${truncate(r.question, 240)}${ai}`;
    })
    .join("\n\n");

  const language =
    locale === "ro"
      ? "Reply in Romanian. Use clear, professional Romanian."
      : "Reply in English.";

  const system = `You are a senior operations consultant reviewing a Standard Operating Procedure (SOP). The manager will give you the SOP, its checklist, and recent help requests their operators raised while executing it. Your job: spot patterns of repeated confusion or escalation, then suggest 1-3 concrete edits the manager could make to the SOP that would prevent those questions next time.

Be specific. Cite step numbers or quote phrases from the SOP when possible. If a single root cause explains multiple questions, prefer one strong edit over many weak ones. Do not recommend things the SOP already covers.

${language}

Return ONLY valid JSON, no markdown, no commentary:
{
  "has_insights": boolean,
  "headline": "<one short sentence summarizing the dominant pattern>",
  "edits": ["<concrete edit 1>", "<concrete edit 2>"],
  "reason": "<if has_insights is false, why — e.g. 'questions are too varied' or 'sop is unambiguous'>"
}

If the help requests are too varied to identify a pattern, return has_insights=false with a reason. Cap edits at 3. Each edit ≤ 25 words.`;

  const user = `# SOP: ${process.title}

${truncate(process.sop_text, 4000)}

# Checklist
${checklistText || "(none)"}

# Recent help requests (${requests.length})
${requestsText}`;

  // 5. Call Claude
  let payload: SuggestionPayload;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 600,
      system,
      messages: [{ role: "user", content: user }],
    });

    const block = message.content[0];
    if (block.type !== "text") throw new Error("unexpected_block_type");

    let jsonText = block.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(/^```(?:json)?\s*\n?/, "")
        .replace(/\n?```\s*$/, "");
    }
    const parsed = JSON.parse(jsonText) as Partial<SuggestionPayload>;
    payload = {
      has_insights: Boolean(parsed.has_insights),
      headline: typeof parsed.headline === "string" ? parsed.headline : "",
      edits: Array.isArray(parsed.edits)
        ? parsed.edits.filter((e): e is string => typeof e === "string").slice(0, 3)
        : [],
      reason: typeof parsed.reason === "string" ? parsed.reason : undefined,
    };
  } catch (err) {
    console.error("[suggest-edits] AI call failed:", err);
    // Don't cache failures — let the next page load retry.
    return {
      payload: {
        has_insights: false,
        headline: "",
        edits: [],
        reason: "ai_error",
      },
      based_on_count: requests.length,
      generated_at: new Date().toISOString(),
      cached: false,
    };
  }

  // 6. Cache
  await upsertSuggestion(processId, session.org_id, payload, requests.length);

  return {
    payload,
    based_on_count: requests.length,
    generated_at: new Date().toISOString(),
    cached: false,
  };
}

async function upsertSuggestion(
  processId: string,
  orgId: string,
  payload: SuggestionPayload,
  basedOnCount: number
) {
  const supabase = await createClient();
  const { error } = await supabase.from("process_ai_suggestions").upsert(
    {
      process_id: processId,
      org_id: orgId,
      suggestion: payload,
      based_on_count: basedOnCount,
      generated_at: new Date().toISOString(),
    },
    { onConflict: "process_id" }
  );
  if (error) console.error("[suggest-edits] cache upsert failed:", error);
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
