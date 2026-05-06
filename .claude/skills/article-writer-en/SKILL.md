---
name: article-writer-en
description: Writes English SEO blog articles for Sopia in MDX format with anti-AI style guide baked in. Use whenever the user asks to write an English article, generate blog content in English, draft an SEO post in EN, or create content for Sopia's English blog. Trigger on phrases like "write an article about X", "draft an EN blog post", "write SEO content for Sopia", "create a blog post on X for ops managers". Output is a complete MDX file with frontmatter, ready to drop into the blog. Positions Sopia as the procedure AI supervisor for operations and compliance teams.
user-invocable: true
---

# English Article Writer (Sopia)

Goal: produce SEO-optimized English articles that don't read like ChatGPT. Sopia's EN voice is direct, operationally specific, and grounded in real manufacturing/compliance reality — OSHA, FDA, ISO, GMP, plant floors, audit trails. Strip the AI tells (em-dashes, "in today's fast-paced world", "leverage", "delve into") and write like an operations leader who's been on a real shop floor.

## When to use

- User wants a full English article (not just keyword research or outline)
- User has a target keyword + audience in mind
- User says "write", "draft", "create an article", "blog post"
- Output target is the Sopia blog (MDX format)
- Audience: operations managers, compliance officers, plant managers, ops-savvy founders in EU + US

## Positioning guardrails (read before writing)

Sopia is **not** an expert on regulations (HACCP, FSA, FDA, OSHA, ISO, GMP, etc.). Sopia digitizes existing processes. In articles:

- Assume the reader **already has** the standard, manual, or SOP (or works with a consultant who does)
- Sopia solves **daily execution**, not **standard definition**
- Never: "here's what HACCP requires", "here's the regulation breakdown", "here's what compliance means"
- Always: "here's how your team actually executes it on shift", "here's how AI guides operators step by step", "here's how you turn paper procedures into daily action"

This positioning is honest and strategically stronger than pretending expertise we don't have. It puts Sopia **adjacent** to consultants, training providers, and template sellers — partner, not competitor.

**If reader needs "what is HACCP" or "what's in the manual":** link out to official sources (FSA, FDA, ISO docs) or recommend a consultant — we don't pretend to teach the standard.

**If reader needs "how do I make this happen on my floor":** that's Sopia — execution, AI guidance, audit trail, digital signatures, real-time supervision.

## Input

Required:
- **Target keyword** (EN): the primary keyword the article targets
- **Title** (EN): use [keyword-research-en](../keyword-research-en/SKILL.md) output if available

Optional:
- **Audience** (operations manager / compliance officer / plant manager / founder) — defaults to operations manager
- **Outline** — if not provided, draft one before writing
- **Word count** — defaults to 1200-1800 (medium pillar), 2000-3000 (hub)
- **Output path** — defaults to `content/blog/en/<slug>.mdx`
- **Industry anchor** — specific industry for examples (food processing, pharma, light manufacturing, logistics, hospitality). Pick one if the keyword allows; don't write industry-agnostic.

## Process

### Step 1: Confirm angle and outline (if not provided)

Sketch first:
- Reader's situation in one sentence (role, current pain)
- The one thing they should walk away knowing or doing
- 4-7 H2 sections moving them from problem → solution → action

If the angle is unclear, propose 2-3 options before writing.

### Step 2: Write the article

**Article structure:**

```mdx
---
title: "[Title]"
description: "[150-160 char meta description with the keyword]"
date: "YYYY-MM-DD"
locale: "en"
keywords: ["keyword", "secondary 1", "secondary 2"]
author: "Sopia"
cover: "/blog/en/[slug]-cover.png"
---

[Hook: 2-4 sentences. Open with a concrete moment, a number, a tension. Not "in today's fast-paced manufacturing landscape". Drop the reader into a real situation.]

[Optional: one-sentence promise.]

## [H2 — phrased as the question or task the reader actually has]

[Content: 150-300 words. Mix sentence lengths. Use real examples — agencies, regulations, fines, shop floor scenarios.]

## [H2 #2]

...

## How Sopia helps [or natural variant]

[Soft product mention — 1-2 paragraphs, max once. Tie to the article's specific problem. No hard CTA in body.]

## What to do this week

[Don't write "In conclusion". Write a short, action-oriented recap: 3-4 bullets or a tight paragraph with concrete next steps.]

[Final CTA: 1-2 sentences. Direct. Example: "Want to see what a digital SOP looks like for your line? Try Sopia free for 14 days."]
```

### Step 3: Save and verify

Write to output path. Run self-check before reporting done.

## Style rules — anti-AI English voice

These cuts make the article sound human. Apply ruthlessly.

### Banned words and phrases

- "in today's fast-paced world", "in the digital age", "in an ever-changing landscape"
- "leverage", "leveraging" (use "use")
- "delve into", "dive deep" (just say "look at" or "cover")
- "navigate the complexities", "unlock the potential", "harness the power"
- "in conclusion", "to summarize", "as we've discussed"
- "it's important to note", "it's worth mentioning", "rest assured"
- "moreover", "furthermore", "additionally" (just write the next sentence)
- "seamless", "robust", "cutting-edge", "innovative solution", "game-changer"
- "holistic approach", "synergy", "paradigm shift"
- "elevate your", "transform your", "revolutionize"
- "tapestry", "symphony", "journey" (as metaphors with no anchor)

### Punctuation and formatting

- **No em-dashes (—)**. Use commas, periods, parentheses, or colons. The em-dash is the loudest AI tell in English.
- **No semicolons** unless absolutely necessary. Most can be split into two sentences.
- **No "thus", "hence", "therefore" at sentence start**. Use plain logic: "That means...", "So...".
- **Oxford comma**: use it. Ops audiences are used to technical precision.
- One idea per paragraph.

### Sentence rhythm

- AI defaults to 18-25 words per sentence. Cut some to 4-10 words. Mix it up.
- Example of good rhythm:
  > "The auditor walks in at 8 a.m. on a Tuesday. She wants the temperature log for the cold storage, last 60 days. Your night-shift lead has been initialing it without actually checking — you don't know that yet. Three pages in, she finds two consecutive entries with identical readings to one decimal place, including the time of day the freezer was on a defrost cycle. That's a finding. The next twenty minutes get expensive."

### Concrete anchors (use real entities)

- **US agencies**: OSHA, FDA, USDA, EPA, NIOSH
- **EU/UK**: HSE (UK), EFSA, BfR (Germany), HACCP (EU Reg 852/2004)
- **Standards**: ISO 9001, ISO 22000, ISO 45001, GMP, GDP, SQF, BRCGS
- **Real numbers**: typical OSHA citations ($16,131 per serious violation in 2024 — verify current), FDA Form 483 observations, recall costs ($10M average for food recalls per FMI 2018 — verify)
- **Industries**: food processing, pharmaceutical manufacturing, contract manufacturing (CMO), light industrial assembly, logistics/3PL, restaurant chains, lab services

Use these instead of "regulators" or "heavy fines". Specifics build trust.

### Pronouns and address

- Direct address: **"you"** is default. Operations readers respond to it.
- First-person plural for Sopia voice: "We built Sopia because...", "What we see at Sopia...", "In our experience..."
- Avoid passive voice when active works: "The procedure must be followed" → "Operators follow the procedure" or "Your team needs to follow the procedure".

### Numbers and specificity

- Real numbers: "5 minutes", "47 steps", "3 of 10 plants we surveyed"
- Cite a real source if you use a stat — link or footnote it. Never invent a "studies show".
- Replace "many", "most", "often" with a number or rewrite the sentence.

### Examples — good vs. bad opening

❌ **Bad (AI slop):**
> "In today's fast-paced manufacturing landscape, food processors face unprecedented challenges in navigating the complexities of HACCP compliance. Implementing a robust system of standard operating procedures has become essential to seamlessly transform your compliance posture and unlock operational excellence."

✅ **Good (Sopia voice):**
> "It's 8 a.m. on a Tuesday. The auditor wants your cold-storage temperature log, last 60 days. Your night-shift lead has been initialing without checking — you don't know that yet. Three pages in, she spots two identical readings during a defrost cycle. That's a Form 483 observation. The next thirty minutes get expensive, and the corrective action plan you owe in 15 days will get harder."

### Soft product mentions

- Sopia mentioned **at most 2 times** in body. Once is often enough.
- The mention solves the article's specific problem, not a generic pitch.
- Good example: "We built Sopia for exactly this gap. Operators open the SOP on their phone at the start of shift, work through each step, sign off as they go. Timestamp, operator name, and step completion log themselves — so when the auditor asks for the trail, you have it."

## Self-check before saving

1. **Em-dash count**: 0. Search for `—` and replace.
2. **Banned phrase scan**: grep for "leverage", "delve", "in today's", "seamless", "robust", "in conclusion", "moreover". Should find 0.
3. **Concrete anchors**: at least 3 specific entities (agency, standard, real fine, named industry).
4. **Sentence variety**: scan paragraphs. Are there sentences under 10 words? If every sentence is 18-25, rewrite.
5. **Frontmatter**: title under 60 chars (or 65 if absolutely needed), description 150-160 chars, keywords populated, cover path matches slug.
6. **CTA**: present, specific, not aggressive.
7. **No AI metaphors**: no "tapestry", "symphony", "journey", "puzzle" without a concrete anchor.

If any check fails, fix before reporting.

## Common pitfalls

- **Industry-agnostic writing**: "for businesses" or "for organizations" → kills SEO and trust. Always pick a specific industry per article.
- **Over-mentioning Sopia**: more than 2 mentions reads like a pitch.
- **Inventing statistics**: never. If a real source isn't available, drop the claim.
- **British vs American spelling**: pick one per article, stay consistent. Default to US English unless the user specifies UK/EU audience.
- **Translating from RO**: don't. EN reader expects different rhythm and different anchors. Write fresh from keyword + outline.
