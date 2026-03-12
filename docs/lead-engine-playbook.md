# Lead Generation Engine — Reusable Playbook

> A repeatable system for building a lead list and testing outreach channels.
> Built around: Perplexity (research) + Firecrawl (scraping) + Resend (email) + manual phone/LinkedIn.

---

## Target Niches (Validated)

### Niche 1: Private Medical & Dental Clinics (Romania)

- **Validation:** Hospital manager was excited about digital procedures, mobile access, dashboard
- **Angle:** Compliance + digital control — "Every procedure on the phone, tracked, with a dashboard"
- **Decision-maker:** Clinic owner, operations manager
- **Why it works:** Strict protocols, high assistant turnover, used to paying for software
- **Market size:** Thousands of clinics in RO — start with Bucharest + Cluj + Timisoara
- **Target:** 100 leads

### Niche 2: Solar / Energy / Home Improvement with Sales Teams

- **Validation:** Senior solar salesperson said it would free them to sell instead of training juniors
- **Angle:** Revenue — "Your best closer is training juniors instead of closing deals"
- **Decision-maker:** Sales Director, Owner
- **Why it works:** Clear ROI pitch — every hour a senior trains = lost revenue
- **Market size:** Smaller (~200-300 companies in RO), but higher deal potential
- **Target:** 100 leads

### Niche 3: Accounting Firms (Romania)

- **Validation:** Not yet validated — hypothesis based on industry fit
- **Angle:** Consistency + onboarding — "Every new hire follows the exact same closing/filing process from day one"
- **Decision-maker:** Managing partner, office manager
- **Why it works:** Highly repetitive monthly/quarterly processes (closing, tax filings, client onboarding), high junior turnover, seniors waste time on training, already pay for software (ERP, invoicing)
- **Market size:** Large — thousands of small firms (2-10 people) across Romania, many still on paper checklists
- **Target:** 50 leads (smaller test batch — validate before scaling)

---

## Data Schema

### What to collect per lead

Only publicly available data from company websites, directories, and social pages.

```json
{
  "company_name": "",
  "website": "",
  "email": "",
  "phone": "",
  "address": "",
  "city": "",
  "niche": "medical | solar",
  "sub_niche": "dental | dermatology | ophthalmology | solar_install | solar_sales",
  "linkedin_url": "",
  "facebook_url": "",
  "instagram_url": "",
  "google_maps_url": "",
  "contact_person_name": "",
  "contact_person_role": "",
  "source_url": "",
  "scraped_at": ""
}
```

### Field rules

| Field                 | Required     | Where to find it                     | Notes                                                  |
| --------------------- | ------------ | ------------------------------------ | ------------------------------------------------------ |
| `company_name`        | Yes          | Directory listing, website           | Legal name or brand name                               |
| `website`             | Yes          | Directory, Google Maps               | Normalize: no trailing slash, lowercase                |
| `email`               | Preferred    | Website /contact, footer, /impressum | Only public business emails (info@, contact@, office@) |
| `phone`               | Preferred    | Website, Google Maps, directories    | Normalize to +40 format                                |
| `address`             | Nice to have | Website, Google Maps                 | Useful for location-based personalization              |
| `city`                | Yes          | Derive from address or directory     | Needed for segmenting outreach                         |
| `niche`               | Yes          | You assign it                        | `medical` or `solar`                                   |
| `sub_niche`           | Nice to have | From directory category or website   | Helps personalize messaging                            |
| `linkedin_url`        | Nice to have | Website footer, or Perplexity search | Company page URL                                       |
| `facebook_url`        | Nice to have | Website footer                       | Many RO businesses are active on FB                    |
| `instagram_url`       | Nice to have | Website footer                       | Less useful for B2B, but grab it if there              |
| `google_maps_url`     | Nice to have | Google Maps search                   | Useful for reviews / reputation check                  |
| `contact_person_name` | Nice to have | Website /about, /echipa, LinkedIn    | Helps personalize email/call                           |
| `contact_person_role` | Nice to have | Same as above                        | Owner, Director, Manager                               |
| `source_url`          | Yes          | Auto-filled during scraping          | Track where the lead came from                         |
| `scraped_at`          | Yes          | Auto-filled                          | ISO date                                               |

**Minimum viable lead:** `company_name` + `website` + at least one of (`email`, `phone`, `facebook_url`)
If a company has no contact method at all, skip it.

---

## Storage

### During scraping: JSON files

```
lead-engine/
  data/
    raw/
      medical_bucharest_2026-03.json
      medical_cluj_2026-03.json
      solar_romania_2026-03.json
    enriched/
      medical_bucharest_enriched.json
      solar_romania_enriched.json
    cleaned/
      medical_final.json
      solar_final.json
```

Each JSON file is an array of lead objects:

```json
[
  {
    "company_name": "DentPro Clinic",
    "website": "https://dentpro.ro",
    "email": "contact@dentpro.ro",
    "phone": "+40 721 123 456",
    "city": "Bucharest",
    "niche": "medical",
    "sub_niche": "dental",
    "facebook_url": "https://facebook.com/dentpro",
    "linkedin_url": "",
    "instagram_url": "https://instagram.com/dentpro.ro",
    "contact_person_name": "Dr. Maria Ionescu",
    "contact_person_role": "Owner",
    "source_url": "https://listafirme.ro/dentpro-srl",
    "scraped_at": "2026-03-09"
  }
]
```

### For outreach: Google Sheet

After cleaning, export to a Google Sheet with these columns:

```
company_name | website | email | phone | linkedin_url | facebook_url | instagram_url | city | niche | sub_niche | contact_person | contact_role | personalization_hook | status | channel_used | last_contact | next_action | notes
```

**Status flow:**

```
new → contacted → replied → call_booked → demo_done → won / lost / not_interested
```

**Why Google Sheet and not a database:**

- Free
- Easy to share if you bring someone to help with outreach
- Sort, filter, color-code by status
- Works on mobile (check between calls)
- Export to CSV anytime for Instantly later
- No setup required

**When to upgrade:** Move to a CRM (Attio or HubSpot free) when you have 10+ active conversations across channels and the sheet gets messy.

---

## Architecture Overview

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│  RESEARCH   │───>│   SCRAPE &   │───>│  CLEAN &     │───>│  TEST CHANNELS   │
│  Perplexity │    │   ENRICH     │    │  DEDUPE      │    │  Email (Resend)  │
│             │    │  Firecrawl   │    │              │    │  Phone calls     │
│             │    │              │    │              │    │  LinkedIn DMs    │
└─────────────┘    └──────────────┘    └──────────────┘    └──────────────────┘
     Phase 1            Phase 2            Phase 3              Phase 4
```

### Cost: $0 to start

| What           | Cost                                                    |
| -------------- | ------------------------------------------------------- |
| Perplexity     | Free tier or existing subscription                      |
| Firecrawl      | Free tier (500 credits/mo)                              |
| Resend         | Free tier — 100 emails/day, 3,000/month                 |
| Phone calls    | Your phone                                              |
| LinkedIn DMs   | Your personal account                                   |
| Storage        | JSON files + Google Sheet                               |

---

## Phase 1 — Research & Discovery

**Goal:** Identify 200 target companies with basic info (name, website, niche, city).
**Tool:** Perplexity (via MCP or web)
**Time:** 1-2 days

### Checkpoint 1.1: ICP is defined (see Target Niches above)

```
- [ ] Niche 1 ICP confirmed: private medical/dental clinics, RO, 5-50 employees
- [ ] Niche 2 ICP confirmed: solar/energy companies with sales teams, RO, 10-100 employees
```

### Checkpoint 1.2: Find source directories

**For medical/dental clinics:**

- listafirme.ro (filter by CAEN code: 8623 — dental, 8622 — specialist medical)
- Google Maps: "clinica dentara Bucuresti", "clinica medicala Cluj"
- reframed.ro, docbook.ro, doclandia.ro (Romanian doctor/clinic directories)
- Facebook groups for dental clinics in Romania
- Perplexity: "lista clinici dentare private Bucuresti"

**For solar/energy companies:**

- listafirme.ro (CAEN: 4321 — electrical installations, 4322)
- Google Maps: "panouri solare Romania", "firme energie solara"
- PATRES member list (Romanian renewable energy association)
- Perplexity: "firme panouri solare Romania cu echipa de vanzari"
- prosumatori.ro, energynomics.ro directories

**For accounting firms:**

- listafirme.ro (CAEN: 6920 — accounting, bookkeeping, auditing, tax consultancy)
- Google Maps: "firma contabilitate Bucuresti", "birou contabil Cluj"
- ceccar.ro — CECCAR member directory (Romanian Body of Expert and Licensed Accountants)
- Perplexity: "firme contabilitate Romania", "birouri contabile Bucuresti"
- termene.ro, risco.ro — business directories with financial data

```
- [ ] 3-5 source directories identified for medical niche
- [ ] 3-5 source directories identified for solar niche
- [ ] 3-5 source directories identified for accounting niche
- [ ] Source URLs saved in config/niches.json
```

### Checkpoint 1.3: Estimate lead counts

```
| Source | Niche | Expected leads |
|--------|-------|---------------|
| ... | medical | ~X |
| ... | solar | ~X |
| ... | accounting | ~X |
| Total target: 250+ raw leads |
```

---

## Phase 2 — Scrape & Enrich

**Goal:** Extract all public contact data for 250 companies.
**Tool:** Firecrawl (via MCP in Claude Code)
**Time:** 2-3 days

### Checkpoint 2.1: Set up Firecrawl

```
- [ ] Firecrawl API key obtained (firecrawl.dev)
- [ ] Firecrawl MCP server configured in Claude Code
- [ ] Test scrape on one clinic website — confirm it returns data
```

### Checkpoint 2.2: Scrape directories

Use Firecrawl to extract company listings from directories found in Phase 1.

**Strategy per source:**

| Source                     | Approach                                                      |
| -------------------------- | ------------------------------------------------------------- |
| listafirme.ro results page | Scrape each results page, extract company name + website      |
| Google Maps results        | Use SerpAPI or scrape results page for name + website + phone |
| Clinic/energy directories  | Crawl listing pages, extract all fields                       |

### Checkpoint 2.3: Enrich from company websites

For each company website, scrape these pages (if they exist):

```
/contact
/despre-noi (about us)
/echipa (team)
/impressum
Homepage footer
```

Extract:

- **Email:** look for mailto: links, or text matching _@_.\* pattern
- **Phone:** Romanian patterns — +40, 07xx, 02xx, 03xx
- **Social links:** href containing linkedin.com, facebook.com, instagram.com
- **Contact person:** names on /echipa or /despre-noi with roles

### Checkpoint 2.4: Enrich social profiles (where missing)

For companies missing LinkedIn/Facebook:

- Perplexity: `"[Company Name] LinkedIn"` or `"[Company Name] Facebook"`
- These are usually findable — most RO businesses have Facebook pages

### Checkpoint 2.5: Save raw + enriched data

```
- [ ] Raw directory data saved to data/raw/
- [ ] Enriched data saved to data/enriched/
- [ ] 200+ companies scraped
- [ ] At least 70% have email or phone
- [ ] At least 50% have Facebook or LinkedIn
```

---

## Phase 3 — Clean, Dedupe & Validate

**Goal:** A clean list of 150+ companies ready for outreach.
**Tool:** Claude Code script
**Time:** 1 day

### Checkpoint 3.1: Deduplicate

```
1. Normalize website domains (remove www, trailing /, force lowercase)
2. Dedupe by domain
3. Dedupe by phone number (normalize +40 vs 0 prefix)
4. Dedupe by email
5. Fuzzy match company names (but careful with branches)
```

### Checkpoint 3.2: Validate contact data

```
- [ ] Remove invalid emails (noreply@, no @, obviously fake)
- [ ] Normalize phone numbers to +40 7xx xxx xxx (mobile) or +40 2xx xxx xxx (landline)
- [ ] Flag mobile vs landline (07x = mobile, 02x/03x = landline)
- [ ] Verify social URLs actually load (quick check)
- [ ] Remove leads with zero contact methods
```

### Checkpoint 3.3: Tag for outreach

For each lead, determine available channels and best approach:

```json
{
  "available_channels": ["email", "phone", "facebook"],
  "best_channel": "email",
  "personalization_hook": "Clinica cu 3 locatii in Bucuresti, angajeaza asistente"
}
```

**Personalization hooks — what to look for:**

- Medical: number of locations, specializations, "angajam" on their site, Google review count
- Solar: portfolio size, regions they cover, team size, recent projects mentioned

### Checkpoint 3.4: Export to Google Sheet

```
- [ ] Google Sheet created with all columns
- [ ] Medical leads on one tab, solar leads on another
- [ ] Dashboard tab with counts by status/channel/city
- [ ] 150+ leads with at least one contact method
- [ ] Top 30 leads have personalization hooks filled in
```

---

## Phase 4 — Multi-Channel Outreach

**Goal:** Test all channels, find what works, scale the winner.
**Time:** 2-4 weeks

### The Testing Plan

```
Week 1:  25 emails/day + 5 phone calls + 5 LinkedIn DMs  (each niche)
Week 2:  50 emails/day + 5 phone calls + 5 LinkedIn DMs  (adjust messaging)
Week 3:  Double down on the channel + niche that got replies
Week 4:  Scale or pivot
```

### Checkpoint 4.1: Email via Resend

**Setup:**

```
- [ ] Resend account created (resend.com)
- [ ] Sending domain configured: outreach.sopia.xyz (subdomain to protect main domain)
- [ ] DNS records added in Cloudflare: SPF, DKIM, DMARC (Resend provides these)
- [ ] Test email sent and received successfully
- [ ] Send script created (scripts/send-batch.ts)
```

**Why a subdomain:** If cold emails get spam complaints, it won't affect `sopia.xyz` deliverability.
Setting up `outreach.sopia.xyz` in Cloudflare is free — just add the DNS records Resend gives you.

**Resend free tier:** 100 emails/day, 3,000/month — more than enough for testing.

**Warm-up schedule:**

```
Days 1-3:   10 emails/day (build sender reputation)
Days 4-7:   25 emails/day
Week 2+:    50 emails/day
```

**Tracking (built into Resend):**

- Open rate (tracking pixel)
- Click rate (link rewriting)
- Delivery status: delivered, bounced, complained
- Webhooks available for real-time notifications → can auto-update Google Sheet

**Send script flow:**

```
scripts/send-batch.ts

1. Read cleaned leads from data/cleaned/*.json (or Google Sheet via API)
2. Filter: status === "new", has email, not already sent today
3. Pick next batch (25 or 50 based on warm-up stage)
4. For each lead, render template with variables (company_name, contact_person, etc.)
5. Call resend.batch.send() — sends up to 100 in one API call
6. Mark leads as "contacted" with sent date
7. Log results to data/outreach-log.json
```

```typescript
// Example: scripts/send-batch.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const batch = leads.slice(0, DAILY_LIMIT).map((lead) => ({
  from: "Radu <radu@outreach.sopia.xyz>",
  to: lead.email,
  subject: template.subject.replace("{{company_name}}", lead.company_name),
  html: renderTemplate(template.body, lead),
  tags: [{ name: "niche", value: lead.niche }, { name: "campaign", value: "v1" }],
}));

const result = await resend.batch.send(batch);
```

**Medical clinic template (RO):**

```
Subject: {{company_name}} — proceduri digitale

Buna {{contact_person}},

{{personalization_hook}}

Am construit Sopia pentru clinici ca a dvoastra — transforma
procedurile medicale in checklist-uri digitale pe care echipa
le urmeaza pas cu pas, direct de pe telefon.

Totul e tracked: cine a facut, cand, ce pas. Cu dashboard
pentru management.

Aveti 5 minute pentru un demo rapid?

Radu
Sopia.xyz
```

**Solar template (RO):**

```
Subject: {{company_name}} — o idee pentru echipa de vanzari

Buna {{contact_person}},

{{personalization_hook}}

Am construit Sopia pentru echipe de vanzari ca a voastra —
transforma procesul de training in checklist-uri interactive
cu ghidare AI.

Rezultatul: juniorii invata singuri, seniorii vand.
Fiecare ora in care un senior nu face training = revenue.

5 minute pentru un demo?

Radu
Sopia.xyz
```

**Accounting template (RO):**

```
Subject: {{company_name}} — proceduri standardizate pentru echipa

Buna {{contact_person}},

{{personalization_hook}}

Am construit Sopia pentru birouri de contabilitate — transforma
procedurile lunare (inchideri, declaratii, onboarding clienti noi)
in checklist-uri digitale pe care echipa le urmeaza pas cu pas.

Fiecare angajat nou invata exact acelasi proces. Fara sa va
ia din timp sa explicati de fiecare data.

Aveti 5 minute pentru un demo rapid?

Radu
Sopia.xyz
```

```
- [ ] Templates written (medical RO + solar RO + accounting RO)
- [ ] First batch of 10 emails sent (warm-up day 1)
- [ ] Resend dashboard: check delivery rate > 95%
- [ ] Track in Google Sheet: sent date, opened, replied, outcome
```

### Checkpoint 4.2: Phone Calls

**Medical script:**

```
"Buna ziua, ma numesc Radu. Va sun de la Sopia.
Am vazut ca aveti [X locatii / angajati asistente noi].

Noi ajutam clinicile sa digitalizeze procedurile — echipa
urmeaza totul de pe telefon, pas cu pas, si dvs vedeti
dashboard-ul cu statusul.

Ati avea 5 minute sa va arat cum functioneaza?"
```

**Solar script:**

```
"Buna ziua, ma numesc Radu de la Sopia.
Am vazut ca aveti echipa de vanzari pentru [panouri solare / energie].

Noi rezolvam o problema specifica: seniorii care pierd timp
cu training-ul in loc sa vanda. Totul devine un checklist
interactiv — juniorii invata singuri.

Aveti 5 minute pentru un demo rapid?"
```

**Accounting script:**

```
"Buna ziua, ma numesc Radu de la Sopia.
Am vazut ca aveti birou de contabilitate in [oras].

Noi ajutam birourile de contabilitate sa standardizeze
procedurile — inchideri lunare, declaratii, onboarding clienti.
Totul devine un checklist digital pe care echipa il urmeaza
pas cu pas. Angajatii noi invata singuri, fara sa va ia din timp.

Aveti 5 minute sa va arat cum functioneaza?"
```

```
- [ ] Scripts written
- [ ] First 5 calls per niche
- [ ] Track: answered, interested, booked, rejected
```

### Checkpoint 4.3: LinkedIn DMs

**Connection request (don't pitch here):**

```
"Buna [Name], am vazut ca conduceti [clinica / echipa de vanzari / biroul de contabilitate]
la [Company]. Lucrez in acelasi domeniu — mi-ar placea sa ne conectam."
```

**DM after they accept (wait 1-2 days):**

```
"Multumesc de conectare!

O intrebare rapida — cum gestionati training-ul cand aduceti
oameni noi in echipa? Intreb pentru ca am construit un tool
care transforma procedurile in checklist-uri interactive.

Daca e relevant, va pot arata un demo de 5 min."
```

```
- [ ] Connection requests sent to 5 leads per niche
- [ ] DM sent to those who accepted
- [ ] Track: requested, accepted, replied, outcome
```

### Checkpoint 4.4: Evaluate After 2 Weeks

```
| Channel  | Niche      | Sent | Replies | Positive | Demos |
|----------|------------|------|---------|----------|-------|
| Email    | Medical    | 30   | ?       | ?        | ?     |
| Email    | Solar      | 30   | ?       | ?        | ?     |
| Email    | Accounting | 15   | ?       | ?        | ?     |
| Phone    | Medical    | 10   | ?       | ?        | ?     |
| Phone    | Solar      | 10   | ?       | ?        | ?     |
| Phone    | Accounting | 5    | ?       | ?        | ?     |
| LinkedIn | Medical    | 10   | ?       | ?        | ?     |
| LinkedIn | Solar      | 10   | ?       | ?        | ?     |
| LinkedIn | Accounting | 5    | ?       | ?        | ?     |
```

**Decisions:**

- Best niche → go deeper (scrape 200 more)
- Best channel → scale it (invest in tools if needed)
- Nothing works → revisit messaging, or talk to 5 more people in the niche

### When to invest in paid tools

| Tool                               | Trigger                          | Cost                |
| ---------------------------------- | -------------------------------- | ------------------- |
| Resend Pro                         | Need >100 emails/day             | $20/mo              |
| Extra sending domain               | Want A/B test from different domains | $10/year/domain  |
| LinkedIn Sales Navigator           | LinkedIn DM reply >5%            | $80/mo              |
| Email validation (MillionVerifier) | Bounce rate >5%                  | $37 one-time        |
| CRM (Attio/HubSpot)               | 10+ active conversations         | Free tier           |

---

## Reusable Project Structure

```
lead-engine/
├── CLAUDE.md                # Instructions for Claude Code
├── .env.example             # RESEND_API_KEY, FIRECRAWL_API_KEY
├── config/
│   ├── icp.json             # ICP definitions per niche
│   ├── sources.json         # Directory URLs to scrape per niche
│   └── campaigns.json       # Email campaign config (daily limit, warm-up stage)
├── scripts/
│   ├── research.ts          # Perplexity-based discovery
│   ├── scrape.ts            # Firecrawl scraping
│   ├── enrich.ts            # Website enrichment for missing data
│   ├── dedupe.ts            # Deduplication + normalization
│   ├── validate.ts          # Email/phone validation
│   ├── send-batch.ts        # Resend batch email sender
│   ├── check-stats.ts       # Pull open/click/bounce stats from Resend
│   └── export-csv.ts        # Export for Google Sheet
├── data/
│   ├── raw/                 # Raw scraped data (JSON per source)
│   ├── enriched/            # After website enrichment
│   ├── cleaned/             # Final deduplicated data
│   └── outreach-log.json    # Sent emails log with Resend IDs
├── templates/
│   ├── email-ro/            # Email templates in Romanian (HTML)
│   ├── email-en/            # Email templates in English (HTML)
│   ├── linkedin/            # LinkedIn messages
│   └── phone-scripts/       # Call scripts
└── docs/
    └── lead-engine-playbook.md
```

### CLAUDE.md for the lead-engine project

```markdown
# Lead Engine

## What this does

Research → scrape → clean → export lead lists for multi-channel outreach.

## Tools

- Perplexity MCP — company research and discovery
- Firecrawl MCP — web scraping and contact data extraction
- Resend — batch email sending with open/click tracking (free: 100/day)
- Email validation API (when scaling) — ZeroBounce or MillionVerifier

## Data schema per lead

company_name, website, email, phone, address, city, niche, sub_niche,
linkedin_url, facebook_url, instagram_url, google_maps_url,
contact_person_name, contact_person_role, source_url, scraped_at

## Rules

- Only collect publicly available business data from company websites and directories
- Never scrape LinkedIn directly — use Perplexity to find LinkedIn URLs
- Never collect personal emails — only business emails (info@, contact@, office@)
- Always save raw data to data/raw/ before any transformations
- Tag every record with source_url and scraped_at
- Normalize phones to +40 format, emails to lowercase
- A lead without any contact method (no email, no phone, no social) should be dropped

## Output

JSON files in data/ directories. Final export as CSV for Google Sheet import.

## Current niches

1. Private medical/dental clinics in Romania (Bucharest, Cluj, Timisoara)
2. Solar/energy companies with sales teams in Romania
3. Accounting firms in Romania (smaller test batch — 50 leads)
```

---

## Idea Parking Lot

Angles, niches, and reframes to explore later. Not validated yet — just captured.

| Idea | Notes | Verdict |
|------|-------|---------|
| **"Training curriculum" framing** | Reframe SOPs as "onboarding curriculum for new hires" — warmer than "procedures" | Use as messaging in existing niches, not a separate niche |
| **Coaches / online course creators** | They deliver curricula to customers, not internal teams. Already have Teachable/Kajabi. Mostly solopreneurs — no team gap | Weak fit — different use case |
| **Lawyers / law firms** | Processes vary per case, resist tooling, seniors ARE the firm. Bigger firms have practice management | Weak fit — skip for now |
| **Franchise operations** | Standardized processes across locations, need consistency | Worth exploring later — need to find RO franchise networks |
| **Logistics / warehouse** | Checklists for receiving, shipping, quality control | Worth exploring — but need validation |
| **HR / onboarding departments** | Every company onboards new hires — Sopia as the onboarding checklist | Horizontal play — harder to target, but interesting angle |

_Add new ideas here as they come up._

---

## Priority Actions

```
1. [ ] Talk to the solar person and hospital manager again
       Ask: "Would you pay? Who else has this problem?"

2. [ ] Set up the lead-engine Claude Code project
       Create folder structure, CLAUDE.md, configure Firecrawl + Perplexity MCP
       Set up Resend account + outreach.sopia.xyz subdomain in Cloudflare

3. [ ] Phase 1: Research sources (1-2 days)
       Find directories for medical clinics and solar companies in RO

4. [ ] Phase 2: Scrape 250 leads (2-3 days)
       100 medical + 100 solar + 50 accounting, all public data

5. [ ] Phase 3: Clean and export to Google Sheet (1 day)

6. [ ] Phase 4: Start outreach (Week 1)
       15 emails + 5 calls + 5 LinkedIn per niche

7. [ ] Phase 4: Evaluate (end of Week 2)
       Which niche responds? Which channel works?
```

---

## Metrics

| Metric                    | Target           | Action if below            |
| ------------------------- | ---------------- | -------------------------- |
| Scrape → usable lead rate | >60%             | Find better sources        |
| Email reply rate          | >3%              | Fix subject line or copy   |
| Phone answer rate         | >30%             | Try different times        |
| Phone interest rate       | >10% of answered | Fix script or targeting    |
| LinkedIn accept rate      | >30%             | Improve connection message |
| LinkedIn DM reply rate    | >10%             | Fix DM or targeting        |
| Demo booked (any channel) | >1% of total     | Revisit ICP entirely       |

---

_Last updated: March 2026_
_Reuse for any project: update niches, ICP, templates, and source config._
