---
name: article-writer-ro
description: Writes Romanian SEO blog articles for Sopia in MDX format with anti-AI style guide baked in. Use whenever the user asks to write a Romanian article, generate blog content in Romanian, draft an SEO post in RO, or create content for Sopia's Romanian blog. Trigger on phrases like "scrie un articol despre X", "draft articol RO", "blog post romanesc", "fa un articol pentru Sopia", or any request to produce Romanian long-form content. Output is a complete MDX file with frontmatter, ready to drop into the blog.
user-invocable: true
---

# Romanian Article Writer (Sopia)

Goal: produce SEO-optimized Romanian articles that don't sound like AI slop. Sopia's voice is direct, specific, and built on real Romanian compliance reality — ITM, ANSVSA, HACCP, fabrici, ateliere. Generic LLM tells (em-dashes, "în concluzie", abstract metaphors) get cut.

## When to use

- User wants a full Romanian article (not just keyword research or outline)
- User has a target keyword + audience in mind
- User says "scrie", "draft", "redactează", "fă un articol"
- Output target is the Sopia blog (MDX format)

## Positioning guardrails (citește înainte să scrii)

Sopia **nu** e expert în reglementări (HACCP, ANSVSA, ITM, SSM, ISO etc.). Sopia digitalizează procese existente. În articole:

- Asumă că reader-ul **are deja** standardul/planul (sau lucrează cu un consultant care îl are)
- Sopia rezolvă **execuția zilnică**, nu **definirea standardului**
- Niciodată: "iată ce conține HACCP", "iată legislația", "iată ce trebuie să faci pentru conformitate"
- Întotdeauna: "iată cum operatorul tău îl execută corect", "iată cum AI-ul ghidează echipa pas cu pas", "iată cum transformi planul de pe hârtie într-un proces zilnic"

Această poziționare e onestă și strategic mai puternică decât a pretinde expertiză pe care nu o avem. Te plasează **adiacent** firmelor de consultanță și template providers — partener, nu concurent.

**Dacă reader-ul caută "ce este HACCP" sau "ce conține planul":** linkuri exterioare către surse oficiale (ANSVSA, food.gov.uk etc.) sau către consultanți — nu pretindem că dăm răspunsul.

**Dacă reader-ul caută "cum aplic asta în fabrică/cafenea":** acolo intră Sopia — execuție, AI guidance, audit trail, semnături digitale.

## Input

Required:
- **Target keyword** (RO): the primary keyword the article targets
- **Title** (RO): headline of the article (use [keyword-research-ro](../keyword-research-ro/SKILL.md) output if available)

Optional:
- **Audience** (operator / manager / patron de fabrică / consultant) — defaults to manager
- **Outline** — if not provided, the skill drafts one before writing
- **Word count** — defaults to 1200-1800 words for medium pillar, 2000-3000 for hub
- **Output path** — defaults to `content/blog/ro/<slug>.mdx`
- **Industry anchor** — specific industry to use for examples (e.g., fabrică alimentară, atelier mecanic, instalator panouri solare). If not provided, ask the user OR pick the most common ICP industry for the keyword.

## Process

### Step 1: Confirm angle and outline (if not provided)

Before writing, sketch:
- The reader's situation in one sentence (who they are, what problem they have right now)
- The one thing they should walk away knowing or doing
- 4-7 H2 sections that move them from problem → solution → action

If the user hasn't specified the angle, propose 2-3 angles and let them pick. Don't write 1500 words on a wrong premise.

### Step 2: Write the article

Follow the structure below and the style rules in the next section.

**Article structure:**

```mdx
---
title: "[Title]"
description: "[150-160 char meta description with the keyword]"
date: "YYYY-MM-DD"
locale: "ro"
keywords: ["keyword", "secondary 1", "secondary 2"]
author: "Sopia"
cover: "/blog/ro/[slug]-cover.png"
---

[Hook paragraph: 2-4 sentences. Open with the reader's situation, not a generic intro. No "în era digitală" or "în zilele noastre". Lead with a concrete moment, a number, or a tension.]

[Optional: a one-sentence promise of what they'll get from the article.]

## [H2 — phrased as something the reader actively wants to know]

[Content: 150-300 words. Mix short and medium sentences. Use real examples — names of laws, fines, agencies. Show, don't tell.]

## [H2 #2]

...

## Cum te ajută Sopia [or some natural variant]

[Soft product mention — 1-2 paragraphs max. Tie back to the article's problem. No hard CTA in the body.]

## Pe scurt

[Don't write "În concluzie". Write 3-4 bullet points or a short paragraph that recaps action items. Specific, not vague.]

[Final CTA: 1-2 sentences. Direct. Example: "Vrei să vezi cum arată un SOP digital pentru fabrica ta? Încearcă Sopia gratuit 14 zile."]
```

### Step 3: Save and verify

Write the file to the output path. Then run a self-check (next section) before reporting done.

## Style rules — anti-AI Romanian voice

These rules are why the article won't sound like ChatGPT. Apply them ruthlessly.

### Banned words and phrases (cut on sight)

- "în era digitală", "în zilele noastre", "într-o lume aflată în continuă schimbare"
- "în concluzie", "în final", "pentru a rezuma", "după cum am menționat"
- "este important să", "este esențial să", "merită menționat"
- "fără îndoială", "cu siguranță", "fără doar și poate"
- "deopotrivă", "totodată" (use "și" or "iar")
- "navigând prin complexitățile", "valorificând potențialul", "îmbrățișând tehnologia"
- "soluții inovatoare", "abordare holistică", "experiență fluidă"
- Abstract metaphors with no anchor: "o călătorie", "un puzzle", "o simfonie"

### Punctuation and formatting

- **No em-dashes (—)**. Use commas, periods, sau paranteze. EM-DASH e principalul tell de AI în RO.
- **No "deci" sau "așadar" la început de paragraf**. Replace with the actual logical link.
- **No "în plus" / "mai mult decât atât"**. Just write the next sentence.
- Use diacritics correctly: ș, ț, ă, â, î. Always.
- One idea per paragraph. Don't pack 5 sentences explaining the same thing.

### Sentence rhythm

- Mix sentence lengths. AI tends toward 15-25 words. Drop in sentences of 4-8 words to break the rhythm.
- Example of good rhythm:
  > "Inspectorul ITM intră luni dimineața la 9. Are formularul în mână. Întreabă unde e dosarul de instructaj. Dacă nu îl găsești în 5 minute, ai deja o amendă în spate de 5.000 lei pentru lipsa documentelor de SSM (HG 1146/2006). Și asta înainte să verifice dacă oamenii știu efectiv ce e scris acolo."

### Concrete anchors (always use real entities)

- **Agenții**: ITM (Inspecția Muncii), ANSVSA, ANAF, DSP, Garda de Mediu, ANRE
- **Legi reale**: HG 1146/2006 (SSM), Reg. CE 852/2004 (HACCP), Legea 319/2006 (SSM), HG 355/2007 (medicina muncii)
- **Amenzi tipice (verifică dacă sunt actuale)**: ITM 5.000-10.000 lei lipsă instructaj, ANSVSA 3.000-30.000 lei pentru neconformități HACCP, DSP 1.000-5.000 lei
- **Industrii frecvente la ICP Sopia**: fabrică alimentară, restaurant/cafenea, atelier mecanic, instalații electrice, instalator panouri solare, fabrică textilă, depozit logistic

Use these anchors instead of saying "autoritățile" sau "amenzi mari". Specificul construiește încredere.

### Pronouns and address

- Direct address: "tu" sau "dumneavoastră"? Default = **"tu"** pentru patroni de PFA/SRL mic, **"dumneavoastră"** pentru articole adresate consultanților sau corporate. Confirmă cu user dacă nu e clar.
- First-person plural pentru perspectiva Sopia: "la Sopia am văzut că...", "noi credem că..."
- Nu folosi "se face", "se verifică" (passive). Folosește "tu faci", "tu verifici", "managerul verifică".

### Numbers and specificity

- Folosește numere reale: "5 minute", "47 de pași", "3 din 10 fabrici"
- Dacă citezi o statistică, fie o ai dintr-o sursă concretă (link), fie n-o folosi
- Nu spune "mulți", "majoritatea", "des" — fie ai un număr, fie reformulezi

### Examples — good vs. bad opening

❌ **Bad (AI slop):**
> "În era digitală, fabricile alimentare se confruntă cu o serie de provocări fără precedent în ceea ce privește conformitatea HACCP. Implementarea unui sistem eficient de proceduri operaționale standard este esențială pentru a naviga cu succes prin complexitățile reglementărilor moderne."

✅ **Good (Sopia voice):**
> "Marți la 7:30 dimineața, Andrei e la ușa fabricii lui de panificație din Cluj. Inspectorul ANSVSA a venit fără preaviz. Vrea să vadă jurnalul de temperaturi al frigiderelor pe ultimele 30 de zile. Andrei știe că e completat parțial — operatoarele uită seara după ture lungi. Asta e momentul în care HACCP-ul pe hârtie devine o problemă scumpă."

### Soft product mentions

- Sopia se menționează **la maxim 2 ori în corpul articolului**, fără linkuri agresive
- Mention-ul trebuie să rezolve problema concretă din articol, nu să fie un slogan
- Exemplu bun: "La Sopia, am construit aplicația ca să rezolve exact asta — operatorul deschide telefonul, vede checklist-ul de pe tură, bifează, semnează. Restul (data, ora, cine a făcut) se completează automat."

## Self-check before saving

Before declaring done, run through this list:

1. **Em-dash count**: 0. Search the file for `—` and replace with comma/period/paren.
2. **Banned phrase scan**: grep for "în era digitală", "în concluzie", "este important să", "fără îndoială", "soluții inovatoare". Should find 0.
3. **Diacritics**: spot-check 3-5 paragraphs. All ș/ț/ă/â/î present.
4. **Concrete anchors**: at least 3 specific entities mentioned (agency name, law number, industry, real fine amount).
5. **Sentence variety**: open the file. Are there sentences of 4-8 words? If every sentence is 15-25 words, rewrite some.
6. **Frontmatter**: title under 60 chars, description 150-160 chars, keywords array populated, cover path matches slug.
7. **CTA**: present, specific, not aggressive.

If any check fails, fix before reporting.

## Common pitfalls

- **Over-mentioning Sopia**: more than 2 product mentions makes it sales-y. The article earns trust by being useful first.
- **Writing in EU-Romanian / corporate-speak**: this kills authenticity. Sopia readers run small fabrici. Write like you'd explain to a friend who runs a bakery, not a pitch deck.
- **Citing fake statistics**: never invent a "studiu arată că". If you don't have a real source, drop the stat.
- **Translating from English drafts**: the rhythm doesn't carry over. Write in Romanian from scratch using the keyword and outline.
