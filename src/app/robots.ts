import type { MetadataRoute } from "next";

/**
 * Robots policy for sopia.xyz.
 *
 * - Default: allow everything except authenticated/internal routes.
 * - AI training & citation crawlers (OpenAI, Anthropic, Perplexity, Google-Extended,
 *   etc.) are explicitly allowed. Many of these honor robots.txt; naming them
 *   explicitly signals consent to ingest and cite our public content. If we ever
 *   want to opt out, change `allow: "/"` → `disallow: "/"` per agent.
 */
export default function robots(): MetadataRoute.Robots {
  const privatePaths = [
    "/admin",
    "/manager",
    "/operator",
    "/onboarding",
    "/api",
    "/auth",
    "/profile",
    "/trial-expired",
    "/subscription-ended",
    "/invite",
    // EN locale variants of the same private routes
    "/en/admin",
    "/en/manager",
    "/en/operator",
    "/en/onboarding",
    "/en/auth",
    "/en/profile",
    "/en/trial-expired",
    "/en/subscription-ended",
    "/en/invite",
  ];

  // AI training + citation user agents we explicitly welcome.
  // Sources: each company's docs (OpenAI, Anthropic, Perplexity, Google,
  // Common Crawl, Cohere, Bytedance). Keep alphabetized for sanity.
  const aiAgents = [
    "anthropic-ai", // Anthropic — legacy, still seen in logs
    "Applebot-Extended", // Apple Intelligence
    "Bytespider", // ByteDance / TikTok
    "CCBot", // Common Crawl (used by many LLMs)
    "ChatGPT-User", // OpenAI on-demand fetcher (live ChatGPT browsing)
    "Claude-Web", // Anthropic on-demand fetcher
    "ClaudeBot", // Anthropic training crawler
    "cohere-ai", // Cohere
    "Diffbot", // Diffbot
    "DuckAssistBot", // DuckDuckGo AI
    "FacebookBot", // Meta
    "Google-Extended", // Google Gemini training opt-in
    "GoogleOther", // Google research/training
    "GPTBot", // OpenAI training crawler
    "ImagesiftBot", // ImageSift / The Hive
    "Meta-ExternalAgent", // Meta on-demand fetcher
    "Meta-ExternalFetcher", // Meta
    "OAI-SearchBot", // OpenAI SearchGPT
    "PerplexityBot", // Perplexity training
    "Perplexity-User", // Perplexity on-demand
    "YouBot", // You.com
  ];

  return {
    rules: [
      // Default rule for everything else
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
      // Explicit rules per AI agent — same allow/disallow but named so we're
      // unambiguous about welcoming them.
      ...aiAgents.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: privatePaths,
      })),
    ],
    sitemap: "https://sopia.xyz/sitemap.xml",
    host: "https://sopia.xyz",
  };
}
