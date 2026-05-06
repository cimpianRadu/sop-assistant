---
name: cover-image
description: Generates Sopia-branded cover image prompts for blog articles using Nano Banana (Gemini 2.5 Flash Image). Use whenever the user needs a blog cover, OG image, social card, or visual asset for an article. Trigger on phrases like "make a cover for X", "generate a cover image", "fa o poza de cover", "blog cover for [article]", "OG image for X", or any request for branded visuals tied to written content. Outputs a Nano Banana-ready prompt + recommended filename + suggested negative prompt, plus optional Gemini API call snippet.
user-invocable: true
---

# Sopia Cover Image Generator

Goal: produce Nano Banana (Gemini 2.5 Flash Image) prompts that yield on-brand Sopia covers for blog articles. The brand is teal-forward, minimal, Linear/Notion-clean. The image should feel like it belongs next to a Geist Sans headline, not a stock-photo blog from 2014.

## When to use

- User has an article (or article topic) and needs a cover image
- User asks for OG image, social card, blog hero
- User says "fa o poza", "generate cover", "make a cover for [topic]"
- User wants a visual asset for sopia.xyz blog or social

## Input

Required:
- **Article title** OR **topic phrase** (e.g., "Amenzi ITM 2026", "Digital SOPs for food processors")

Optional:
- **Locale** (ro / en) — affects suggested mood (RO leans toward compliance/fabric reality, EN toward operations/clean tech)
- **Aspect ratio** — defaults `16:9` (blog cover, OG). Other valid: `1:1` (Instagram, LinkedIn square), `4:5` (LinkedIn vertical), `3:2` (legacy)
- **Mood** — defaults "calm professional". Alternatives: "urgent" (compliance/fines articles), "warm" (case studies, customer stories), "technical" (deep technical posts)
- **Output filename** — defaults to `<slug>-cover.png` in `public/blog/<locale>/`

## Brand DNA (always apply)

- **Primary color**: teal `#2AA5A0`
- **Dark teal accent**: `#1D7A76`
- **Background**: soft cream/warm white `#FAFAF7` or pure white `#FFFFFF`
- **Accent**: subtle warm gray `#A8A29E` or text dark `#1A1A1A`
- **Style references**: Linear app marketing, Notion documentation covers, Stripe blog covers, Vercel blog covers
- **Typography in image**: avoid text overlays. The blog headline already provides the typography — the cover should be purely visual
- **Logo motif (optional)**: compass diamond — two-tone teal needle inside a circle with 4 tick marks. Use sparingly; don't put the logo on every cover.
- **Avoid**: gradient overload, neon colors, 3D renders that feel "AI-generated", stock-photo people-in-suits, generic abstract waves, isometric clipart

## Process

### Step 1: Pick a visual concept

Match the article to one of these concept families:

| Concept family | When to use | Example visuals |
|---|---|---|
| **Object stillness** | Compliance/SOP articles. Calm, considered. | A clipboard on a wooden table, a clean factory floor at dawn, a single coffee cup next to a binder |
| **Geometric abstract** | Process/workflow articles. Editorial feel. | Soft 3D shapes (sphere, cylinder, ring) in teal + cream, casting long shadows |
| **Workspace scene** | Manager/operator articles. Human but no faces. | A laptop on a stainless workbench, a tablet propped on a clipboard, hands holding a phone with a checklist (no faces) |
| **Architectural / industrial** | Heavy industry, manufacturing. Dignified. | A spotless production line at golden hour, modern factory exterior, control room from a distance |
| **Document layered** | Templates, checklists, paperwork articles. | Floating sheets of paper, a checklist with checkmarks rendered in teal, a binder with labeled tabs |
| **Symbolic minimalist** | Concept-heavy articles. Editorial. | A single compass on a soft surface, a clock on a clean wall, a key on cream paper |

### Step 2: Build the prompt

Use this template and substitute the variables:

```
Editorial blog cover image, [aspect ratio]. [Concept description from family above].
Color palette: teal #2AA5A0 as primary accent, soft cream #FAFAF7 background, warm white space, deep teal #1D7A76 for shadows or secondary objects.
Lighting: soft natural daylight from upper left, gentle long shadows.
Style: minimalist editorial photography, Linear app aesthetic, Notion documentation cover, generous negative space, refined and quiet.
Composition: subject placed off-center using rule of thirds, breathing room around the subject.
Mood: [mood — calm professional / urgent / warm / technical].
Texture: subtle paper grain or matte surface, no glossy plastic feel.
No text, no logos, no watermarks, no people's faces, no stock-photo aesthetic.
```

**Negative prompt** (Nano Banana / Gemini supports natural-language negatives in-prompt):

```
Avoid: text overlays, logos, watermarks, faces, hands close-up, stock-photo cliches, neon colors, gradient overload, 3D plastic feel, generic abstract waves, isometric flat illustration, AI-generated tells (extra fingers, melted shapes, perfect symmetry).
```

### Step 3: Suggest filename and dimensions

Filename: `<slug>-cover.png` placed at `public/blog/<locale>/<slug>-cover.png`

Dimensions:
- 16:9 blog cover → `1920×1080` (or `1600×900` for lighter weight)
- OG image → `1200×630`
- 1:1 social → `1080×1080`
- 4:5 LinkedIn vertical → `1080×1350`

If both blog cover and OG image are needed, generate two separate prompts (the OG version typically benefits from slightly more centered composition since social platforms crop).

### Step 4: Output

Return a markdown block to the user with:

1. **Final prompt** (ready to paste into Nano Banana / Gemini Studio)
2. **Negative prompt** (combined with main prompt or used separately)
3. **Suggested filename** + path
4. **Dimensions**
5. **Optional**: a Gemini API curl/Python snippet if the user is automating

### Optional: Gemini API call snippet

If the user is invoking Nano Banana programmatically (Gemini 2.5 Flash Image via Google AI Studio API), include this snippet:

```python
import google.generativeai as genai
import os

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

model = genai.GenerativeModel("gemini-2.5-flash-image-preview")

response = model.generate_content(
    "<PASTE_PROMPT_HERE>",
    generation_config={"response_modalities": ["IMAGE"]},
)

# Save the first image part
for part in response.parts:
    if part.inline_data:
        with open("<filename>.png", "wb") as f:
            f.write(part.inline_data.data)
```

Note: the exact API surface for Gemini 2.5 Flash Image (Nano Banana) may evolve. Check `https://ai.google.dev/gemini-api/docs/image-generation` for the current SDK call shape if the snippet errors.

## Examples

### Example 1: RO compliance article

**Article**: "Amenzi ITM 2026: lista completă și cum le eviți"

**Concept family**: object stillness + symbolic minimalist

**Prompt**:
```
Editorial blog cover image, 16:9 aspect ratio. A clean wooden desk with a single open binder showing tabbed dividers, a fountain pen lying beside it, a small brass compass on the corner. Top-down view, soft natural daylight from the upper left.
Color palette: teal #2AA5A0 as primary accent on the binder spine and compass needle, soft cream #FAFAF7 background, warm white wood tones, deep teal #1D7A76 for the pen.
Lighting: soft natural daylight from upper left, gentle long shadows.
Style: minimalist editorial photography, Linear app aesthetic, Notion documentation cover, generous negative space, refined and quiet.
Composition: binder placed in lower-right third, compass in upper-right, lots of empty desk in the upper-left for breathing room.
Mood: calm professional, considered, slightly serious.
Texture: subtle wood grain, matte paper, no glossy plastic feel.
No text, no logos, no watermarks, no people's faces, no stock-photo aesthetic.
```

**Filename**: `public/blog/ro/amenzi-itm-2026-cover.png` (1920×1080)

### Example 2: EN technical article

**Article**: "Digital SOP Software: Complete Buyer's Guide"

**Concept family**: geometric abstract

**Prompt**:
```
Editorial blog cover image, 16:9 aspect ratio. Three soft 3D geometric shapes — a teal sphere, a cream cylinder, and a small dark teal ring — arranged on a clean cream surface, casting long soft shadows toward the right.
Color palette: teal #2AA5A0 (sphere), soft cream #FAFAF7 (background and cylinder), deep teal #1D7A76 (ring, shadow), warm white space.
Lighting: soft directional light from the upper left, long gentle shadows.
Style: minimalist editorial 3D render, Linear app aesthetic, Vercel blog cover, generous negative space, refined and quiet.
Composition: shapes clustered in the lower-left third, large empty space upper-right.
Mood: calm professional, technical but warm.
Texture: matte surfaces, subtle ambient occlusion, no glossy plastic feel, no chrome.
No text, no logos, no watermarks, no people, no stock-photo aesthetic, no neon.
```

**Filename**: `public/blog/en/digital-sop-software-buyers-guide-cover.png` (1920×1080)

### Example 3: Customer story / warm mood

**Article**: "Cum a redus o brutărie din Cluj timpul de instructaj cu 70%"

**Concept family**: workspace scene (no faces)

**Prompt**:
```
Editorial blog cover image, 16:9 aspect ratio. A small bakery interior at golden hour, a tablet propped on a flour-dusted stainless prep table, a clean apron folded next to it, soft window light from the right.
Color palette: warm cream and bread tones, teal #2AA5A0 visible on the tablet screen edge or apron tie, soft natural neutrals.
Lighting: golden-hour daylight from the right window, soft long shadows.
Style: minimalist editorial photography, warm and human but no people visible, refined and quiet.
Composition: tablet centered with breathing room above, prep table fills lower third.
Mood: warm, considered, hopeful.
Texture: real flour dust, brushed stainless, soft cotton apron, matte surfaces.
No text, no logos, no watermarks, no people's faces, no stock-photo aesthetic.
```

**Filename**: `public/blog/ro/brutarie-cluj-instructaj-cover.png` (1920×1080)

## Common pitfalls

- **Putting text in the image**: don't. The headline appears next to the cover in the blog layout already.
- **Generic abstract waves / neon gradients**: kills the editorial feel. If unsure, default to "object stillness" or "geometric abstract" with cream + teal only.
- **Faces in workspace scenes**: avoid — generic stock-photo people undermine the brand. Use hands or no people at all.
- **Over-stuffing the prompt**: the more constraints, the more the model ignores them. Keep prompts under ~150 words.
- **Forgetting aspect ratio**: Nano Banana respects aspect ratio when stated explicitly. Always include it.
- **One prompt for all sizes**: 16:9 and 1:1 need different compositions. Generate separate prompts when both are needed.
