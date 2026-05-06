---
name: keyword-research-en
description: English SEO keyword research for Sopia blog targeting EU + US operations/compliance audience. Use whenever the user wants English keyword research, search term ideas, SEO topic planning, or content strategy for the procedure-AI-supervisor positioning. Trigger on phrases like "keyword research EN", "english keywords for X", "SEO research english", "what should I write about X for US/EU audience". Outputs a clustered keyword list with intent, difficulty estimate, and title suggestions.
user-invocable: true
---

# English Keyword Research (Sopia)

Goal: turn a topic seed into a vetted keyword list for Sopia's English content strategy. Sopia's EN positioning is "procedure AI supervisor" — content targets operations leads, compliance officers, plant managers, and ops-savvy founders in EU + US markets.

## When to use

- User gives an English topic seed ("SOP software", "HACCP digital", "shop floor procedures")
- User asks "what should we write about X" for English audience
- User wants to plan a content cluster targeting US/EU operations buyers
- User asks for keyword variations or search intent analysis in English

## Input

Required:
- **Seed topic** (1-3 words, EN): e.g., "digital SOP", "HACCP software", "procedure compliance"

Optional:
- **Audience** (operations manager / compliance officer / plant manager / founder) — defaults to operations manager
- **Region** (US / UK / EU-broad) — defaults to "global English" (US-leaning)
- **Intent focus** (informational / commercial / transactional) — defaults to "all"
- **Output path** — defaults to `content/keyword-research/<seed-slug>-en-<date>.md`

## Process

### Step 1: Expand the seed into 20-30 query variants

EN modifier patterns (head + long-tail):

**Informational:**
- `what is [seed]`
- `how to [seed]`
- `[seed] meaning`
- `[seed] explained`
- `[seed] for beginners`
- `[seed] vs ...`
- `why [seed]`
- `[seed] benefits`

**Commercial / comparison:**
- `best [seed]`
- `[seed] software`
- `[seed] tools`
- `[seed] platforms`
- `[seed] vs [competitor category]`
- `[seed] alternatives`
- `top [seed]`
- `[seed] reviews`

**Transactional:**
- `[seed] pricing`
- `[seed] free`
- `[seed] trial`
- `[seed] demo`

**Format / template:**
- `[seed] template`
- `[seed] checklist`
- `[seed] example`
- `[seed] PDF`
- `[seed] excel`

**Compliance / role-driven:**
- `[seed] for manufacturing`
- `[seed] for food industry`
- `[seed] for pharma`
- `[seed] OSHA / FDA / ISO 9001 / GMP`
- `[seed] audit`
- `[seed] compliance`

**Role-specific (Sopia ICP):**
- `[seed] for operations manager`
- `[seed] for shop floor`
- `[seed] for new hires`
- `[seed] training`

### Step 2: Pull Google autocomplete for each variant

Use WebFetch on:

```
https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=<URL_ENCODED_QUERY>
```

For UK/EU bias, swap `gl=us` → `gl=gb` or `gl=de` (results from Germany still surface English queries common in EU).

Response is a JSON array; index `[1]` is the suggestion list. Collect uniques across all variants.

### Step 3: Pull "People also ask" questions

For 3-5 high-priority variants, WebFetch:

```
https://www.google.com/search?q=<query>&hl=en&gl=us
```

Look for the PAA block (`role="heading"` near "People also ask"). These questions are gold for H2/H3 structure in articles. If Google returns a consent/captcha page, skip and rely on autocomplete.

### Step 4: Cluster by intent

| Intent | Signals | Sopia value |
|---|---|---|
| **Informational** | "what is", "how to", "why", "explained" | Top-of-funnel, authority. Slower conversion. |
| **Commercial investigation** | "best", "vs", "alternatives", "reviews", "comparison" | Sopia's strongest opportunity in EN — high purchase intent, mid-funnel. |
| **Transactional** | "pricing", "trial", "demo", "buy" | Bottom-funnel. Direct CTA to free trial. |
| **Template/checklist** | "template", "checklist", "example", "PDF" | Lead magnet territory. Pair with email capture. |
| **Role-specific** | "for [role]", "for [industry]" | Strong for landing pages and case-study-style content. |

### Step 5: Estimate difficulty (heuristic)

| Difficulty | Signals |
|---|---|
| **Easy (1-3)** | Long-tail (5+ words), niche industry+role combo, no major SaaS player ranking |
| **Medium (4-6)** | 3-4 word phrase, some directory/listicle sites ranking, possibly one big SaaS |
| **Hard (7-10)** | Head term, dominated by established SaaS (Notion, Process Street, Tallyfy, SafetyCulture, etc.), high commercial intent |

Sanity-check by running `https://www.google.com/search?q=<query>&hl=en&gl=us` and noting:
- Number of ads (more ads = more commercial intent and harder to rank organically)
- Domain authority of top 3 results
- Whether SERP is dominated by review sites (G2, Capterra) — these are hard to displace but signal commercial intent

### Step 6: Generate title suggestions

For each cluster, draft 2-3 titles. EN title rules:
- Lead with the keyword or close variant
- Include a number when promising a list ("7 SOP Templates...")
- Use power words sparingly: "complete", "definitive", "field-tested" — avoid "ultimate" (overused)
- Promise a concrete outcome
- Stay under 60 characters when feasible

Examples:
- ✅ "7 SOP Templates Every Plant Manager Needs in 2026"
- ✅ "Digital SOP Software: Complete Buyer's Guide"
- ✅ "HACCP Compliance Without the Paperwork (How We Do It at Sopia)"
- ❌ "Everything You Need to Know About SOPs" (vague, overused)
- ❌ "The Ultimate Guide to Procedures" (clickbait, no specificity)

## Output format

Write a markdown file at the output path:

```markdown
# Keyword Research: [seed]

**Generated:** [YYYY-MM-DD]
**Seed:** [seed term]
**Audience:** [audience]
**Region:** [region]

## Top 5 priorities

1. **[keyword]** — intent: [type] · difficulty: [N/10] · why: [one sentence]
   - Title options:
     - [option 1]
     - [option 2]
2. ...

## Full keyword list

| Keyword | Intent | Difficulty | Notes |
|---|---|---|---|
| ... | ... | ... | ... |

## People Also Ask (for H2/H3 structure)

- [PAA question 1]
- [PAA question 2]
...

## Content cluster suggestion

- **Hub article:** [broad keyword] → covers topic end-to-end, internal-links to spokes
- **Spokes:**
  - [long-tail 1]
  - [long-tail 2]

## Competitor SERP notes

For each top-3 keyword, brief note on who's ranking and what gap Sopia could exploit:
- [keyword]: G2 + Process Street rank top — gap: no content for [specific industry/role]

## Notes

- [observations on competition, seasonal patterns, SERP features]
```

Plus a parallel JSON file at the same path with `.json` extension for programmatic use.

## Style notes (Sopia EN positioning)

- Sopia's EN angle is **"procedure AI supervisor"** — emphasize the "AI walks your team through SOPs step by step" framing in titles when natural (see [seo_strategy.md](../../../memory/seo_strategy.md))
- ICP for EN: ops managers and compliance officers at 50-500 employee manufacturers, food processors, light pharma, logistics
- US is more SaaS-saturated than EU; long-tail + role/industry combos are easier to rank
- Avoid generic "productivity" or "workflow" keywords — too broad, dominated by Notion/ClickUp
- Lead with **commercial-investigation** keywords ("best SOP software for food manufacturing") — high intent, manageable difficulty

## Common pitfalls

- **Translating from RO**: skip this. EN search behavior is structurally different — more "best X for Y" comparison queries, fewer raw compliance terms.
- **Chasing head terms**: "SOP" alone is dominated. Always pair with industry or role.
- **Missing PAA**: PAA questions = ready-made H2s. Always pull these for the top 3 keywords.
- **Underestimating G2/Capterra**: if G2 ranks for a commercial term, your article needs a strong differentiator (specific industry, contrarian POV, or first-party data) to displace.
