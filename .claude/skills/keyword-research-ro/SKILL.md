---
name: keyword-research-ro
description: Romanian SEO keyword research for Sopia blog. Use whenever the user wants to research keywords, find search terms, brainstorm article topics, or plan SEO content in Romanian. Trigger on phrases like "keyword research RO", "ce keywords pentru articol", "research SEO romana", "ce sa scriu despre X", or any request involving Romanian search intent. Outputs a clustered keyword list with intent, difficulty estimate, and title suggestions.
user-invocable: true
---

# Romanian Keyword Research (Sopia)

Goal: turn a topic seed into a vetted keyword list the Sopia team can write articles against. Romanian SEO has thin third-party data (Ahrefs/SEMrush undercount RO), so this skill leans on live Google signals (autocomplete + related searches) plus heuristic clustering.

## When to use

- User gives a topic seed ("HACCP", "amendă ITM", "panouri solare")
- User asks "ce articol să scriu despre X"
- User wants to plan a content cluster for Sopia
- User asks for keyword variations or related search terms in Romanian

If the user gives only a vague brief ("vreau să scriu despre fabrici"), narrow it to 2-3 candidate seed terms before running the research.

## Input

Required:
- **Seed topic** (1-3 words, RO): e.g., "amendă HACCP", "sop fabrică", "instructaj SSM"

Optional:
- **Audience** (operator / manager / patron / consultant) — defaults to manager
- **Intent focus** (informational / transactional / commercial) — defaults to "all"
- **Output path** — defaults to `content/keyword-research/<seed-slug>-<date>.md`

## Process

### Step 1: Expand the seed into 15-25 query variants

Use these RO modifier patterns (mix of head + long-tail):

**Informational:**
- `ce este [seed]`
- `cum se face [seed]`
- `cum functioneaza [seed]`
- `[seed] explicat`
- `[seed] pentru incepatori`
- `diferenta intre [seed] si ...`

**Transactional / commercial:**
- `[seed] pret`
- `[seed] online`
- `[seed] gratuit`
- `model [seed]`
- `template [seed]`
- `[seed] excel / pdf / word`
- `firma [seed]`
- `consultanta [seed]`

**Compliance / fear-driven (high-intent for Sopia ICP):**
- `amenda [seed]`
- `legislatie [seed]`
- `obligatii [seed]`
- `control ITM [seed]`
- `verificare [seed]`

**Format variants:**
- `exemplu [seed]`
- `checklist [seed]`
- `procedura [seed]`

### Step 2: Pull Google autocomplete for each variant

Use WebFetch on this endpoint for each variant:

```
https://suggestqueries.google.com/complete/search?client=firefox&hl=ro&gl=ro&q=<URL_ENCODED_QUERY>
```

The response is a JSON array. Index `[1]` is the suggestion list. Collect all unique suggestions across variants.

If WebFetch is rate-limited or blocked, fall back to brainstorming based on the modifier patterns above and flag in the output that suggestions were synthetic.

### Step 3: Pull "Related searches" (optional, when stuck)

For 2-3 of the most promising variants, WebFetch `https://www.google.com/search?q=<query>&hl=ro&gl=ro` and look for the "Căutări asemănătoare" / "Related searches" block at the bottom. Be aware Google often returns a consent page first — if that happens, skip and rely on autocomplete only.

### Step 4: Cluster by intent

Bucket each keyword into one of:

| Intent | Signals | Sopia value |
|---|---|---|
| **Informational** | "ce este", "cum", "explicat", "pentru ce" | Top-of-funnel, builds authority. Lower conversion. |
| **Commercial** | "model", "template", "exemplu", "checklist", "comparatie" | Mid-funnel. Sopia can offer the template + soft CTA. |
| **Transactional** | "pret", "cumpara", "abonament", "consultanta" | Bottom-funnel. Direct trial CTA. |
| **Compliance/fear** | "amenda", "control", "legislatie", "obligatie" | Sopia's strongest angle. High intent. |
| **Navigational** | brand names, "site oficial" | Skip unless researching competitors. |

### Step 5: Estimate difficulty (heuristic)

Without paid tools, use this rough rubric:

- **Easy (1-3)**: long-tail (4+ words), niche compliance term, 0-2 brand competitors in autocomplete
- **Medium (4-6)**: 2-3 word phrase, some directory/template sites ranking
- **Hard (7-10)**: head term, government sites or major media in top results, strong commercial intent with established players

For a sanity check on the top 3-5 keywords, run `https://www.google.com/search?q=<query>&hl=ro&gl=ro` and eyeball the SERP — note whether you see legifrance/portallegislativ-style government content (harder to displace) vs. directory/template sites (easier).

### Step 6: Generate title suggestions

For each keyword cluster (not each keyword), draft 2-3 title options. Titles should:
- Lead with the keyword or a close variant
- Promise a concrete outcome (a number, a checklist, a model)
- Avoid clickbait — Sopia's voice is direct and specific
- Stay under 60 characters when possible

Examples:
- ✅ "Amenzi ITM 2026: lista completă și cum le eviți"
- ✅ "Checklist HACCP fabrică alimentară (model gratuit PDF)"
- ❌ "Tot ce trebuie să știi despre HACCP" (vague, no specific outcome)
- ❌ "Secretul amenzilor ITM dezvăluit" (clickbait, off-brand)

## Output format

Write a markdown file at the output path with this structure:

```markdown
# Keyword Research: [seed]

**Generated:** [YYYY-MM-DD]
**Seed:** [seed term]
**Audience:** [audience]

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

## Content cluster suggestion

Group keywords into a hub + spokes structure:
- **Hub article:** [broad keyword] → covers the topic end-to-end
- **Spokes:**
  - [long-tail 1] → links back to hub
  - [long-tail 2] → links back to hub

## Notes

- [any observations about competition, gaps, seasonal trends]
- [flag if autocomplete was unavailable and results are synthetic]
```

Also save a parallel JSON file at the same path with `.json` extension for programmatic use:

```json
{
  "seed": "amenda HACCP",
  "generated_at": "2026-05-06",
  "keywords": [
    {
      "term": "amenda HACCP fabrica alimentara",
      "intent": "compliance",
      "difficulty": 4,
      "title_options": ["...", "..."],
      "source": "google_autocomplete"
    }
  ]
}
```

## Style notes (Sopia-specific)

- Sopia ICP = managers/owners of small-to-mid businesses with compliance pressure (ITM, HACCP, ANSVSA, DSP)
- Romanian SEO rewards directory-style and comparison-style content (see [gtm_content.md](../../../memory/gtm_content.md))
- Don't translate from English keyword lists — RO search behavior differs substantially (e.g., Romanians search "model" and "exemplu" much more than "template")
- Compliance/fear keywords convert fastest. Lead the priority list with these when the seed allows it.

## Common pitfalls

- **Treating autocomplete as ranked**: Google autocomplete is sorted by popularity within a region, but it caps at ~10 per query. Always run multiple variants to widen the net.
- **Including brand keywords**: skip terms with competitor brand names unless doing a competitor audit.
- **Over-trusting difficulty estimates**: the heuristic is a starting point. If a keyword matters strategically (e.g., "procedura SOPIA"), pursue it even at difficulty 7+.
