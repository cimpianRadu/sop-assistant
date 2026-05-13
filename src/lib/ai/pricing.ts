/**
 * Anthropic model pricing in USD per million tokens.
 * Source: https://www.anthropic.com/pricing (update when prices change).
 */
type ModelPrice = {
  input: number;
  output: number;
  cache_read: number;
  cache_write: number;
};

const PRICES: Record<string, ModelPrice> = {
  "claude-sonnet-4-5-20250929": {
    input: 3,
    output: 15,
    cache_read: 0.3,
    cache_write: 3.75,
  },
  "claude-opus-4-5": {
    input: 15,
    output: 75,
    cache_read: 1.5,
    cache_write: 18.75,
  },
  "claude-haiku-4-5-20251001": {
    input: 1,
    output: 5,
    cache_read: 0.1,
    cache_write: 1.25,
  },
};

const FALLBACK: ModelPrice = PRICES["claude-sonnet-4-5-20250929"];

export type TokenUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_creation_tokens: number;
};

export function costUsd(model: string, usage: TokenUsage): number {
  const p = PRICES[model] ?? FALLBACK;
  const M = 1_000_000;
  return (
    (usage.input_tokens * p.input) / M +
    (usage.output_tokens * p.output) / M +
    (usage.cache_read_tokens * p.cache_read) / M +
    (usage.cache_creation_tokens * p.cache_write) / M
  );
}
