import "server-only";
import { createClient } from "@/lib/supabase/server";
import { costUsd, type TokenUsage } from "./pricing";

export type AiEndpoint =
  | "chat"
  | "operator-help"
  | "generate-sop"
  | "suggest-edits";

type LogInput = {
  endpoint: AiEndpoint;
  model: string;
  user_id: string;
  org_id: string | null;
  usage?: Partial<TokenUsage>;
  latency_ms?: number;
  status: "ok" | "error";
  error?: string | null;
};

/**
 * Records one LLM call to ai_calls. Best-effort: any failure here is logged
 * and swallowed so we never break the user-facing AI response because of
 * observability code.
 */
export async function logAiCall(input: LogInput): Promise<void> {
  const usage: TokenUsage = {
    input_tokens: input.usage?.input_tokens ?? 0,
    output_tokens: input.usage?.output_tokens ?? 0,
    cache_read_tokens: input.usage?.cache_read_tokens ?? 0,
    cache_creation_tokens: input.usage?.cache_creation_tokens ?? 0,
  };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("ai_calls").insert({
      endpoint: input.endpoint,
      model: input.model,
      user_id: input.user_id,
      org_id: input.org_id,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cache_read_tokens: usage.cache_read_tokens,
      cache_creation_tokens: usage.cache_creation_tokens,
      latency_ms: input.latency_ms ?? null,
      cost_usd: costUsd(input.model, usage),
      status: input.status,
      error: input.error ?? null,
    });
    if (error) console.error("[logAiCall] insert failed:", error);
  } catch (err) {
    console.error("[logAiCall] unexpected:", err);
  }
}
