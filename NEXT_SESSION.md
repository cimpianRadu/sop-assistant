# Next session — TODO

Carried over from the UI redesign session. Top-priority items are blockers for features the UI already hints at but has no backend for.

## Top priority (backend + UI)

### 1. SOP editing — DONE

- [x] Schema: added `processes.updated_at` (trigger auto-sets on UPDATE) + `processes.current_version` (default 1). Migration applied to **dev** + **prod**.
- [x] Server action: `updateProcess(id, { title, description, sopText, checklist })` in `src/lib/actions/processes.ts`. Increments `current_version`, replaces `checklist_steps` (delete + insert).
- [x] UI: `/manager/processes/[id]/edit` page + new `EditProcessForm` component (title, description, sop_text textarea with mono font, dynamic step list with add/remove).
- [x] `EditSopButton` is now a server component `<Link>` to the edit page (no more "coming soon" toast).
- [x] Follow-up: the `current_version` increments on every save — that's the hook for #3 version badge. But: it increments even if nothing changed. Consider skipping increment when nothing actually changed (low priority). DONE — see follow-up above.

### 2. Version history

- [ ] New table `process_versions` (id, process_id, version_number, sop_text, steps_snapshot jsonb, updated_by, updated_at)
- [ ] On SOP update, insert a snapshot row + increment `processes.current_version`
- [ ] UI: Version history tab on process details — list versions + diff viewer (e.g. `diff` output rendered inline)
- [ ] Replace "coming soon" toast on the Version history tab

### 3. Real version badge — DONE

- [x] Shows `v{current_version} · updated {formatRelativeTime(updated_at)}` as a neutral badge next to status on process detail header
- [x] Pulls real values from `processes.current_version` + `processes.updated_at` (populated by #1's migration + `updateProcess` action)
- [x] i18n keys added: `Manager.versionBadge` in EN + RO
- [x] Follow-up: `updateProcess` now skips the `current_version` increment (and the checklist delete/insert) when nothing actually changed — compares title/description/sop_text + checklist step-by-step against existing rows.

### 4. Smart suggestion — AI analysis — DONE

- [x] New table `process_ai_suggestions` (process_id PK, org_id, suggestion jsonb, based_on_count, generated_at) with RLS scoped to org admins/managers. Migration applied to **dev + prod**.
- [x] `src/lib/ai/suggest-edits.ts` — `getProcessSuggestion(processId, locale)`:
  - Pulls last 30 help_requests + checklist for the process, builds a prompt around the SOP text + Q/A history.
  - Calls `claude-sonnet-4-5-20250929` (non-streaming, JSON output).
  - 24h TTL **per process**, also invalidated when `processes.updated_at > generated_at` (so a fresh SOP edit re-runs the analysis).
  - Skips the AI call entirely when fewer than 3 help requests exist (`reason: "not_enough_signal"`); still caches the no-insight payload.
  - On AI error → returns a no-insight payload (uncached) so retries happen on next page load and the escalations CTA still renders.
- [x] `src/components/manager/smart-suggestion-card.tsx` — async server component. Shows headline + bulleted edits + "based on N help requests" footnote when `has_insights`. Falls back to the simple "open escalations" CTA when no insights.
- [x] `process-detail-view` refactored to accept a `suggestion` ReactNode slot (removed `openEscalationsCount` prop and inline render). Page wraps the card in `<Suspense>` with a skeleton so the rest of the detail page streams independently of the AI call.
- [x] i18n keys added: `Manager.suggestionBasedOn` (EN + RO).
- [x] Cache invalidation on help_request change: Postgres trigger `help_requests_invalidate_suggestion` (AFTER INSERT/UPDATE/DELETE) deletes the cached row so the next visit recomputes. Migration applied to **dev + prod**. No app-code coupling — works for any future code path that touches help_requests.

### 5. Billing visibility — hide from operators

- [x] Admin + manager can see/manage billing. **Operators cannot.**
- [x] Operators: hide €-amount sub, "Manage billing" button, "Upgrade now" link, "Update payment" link, "Reactivate" link in header banners. (header.tsx — `canSeeBilling = role === "admin" || "manager"`)
- [x] Audit completed: all billing UI lives in `header.tsx` + 2 expired pages. Mobile nav / sidebar clean.
- [x] Operators on `/subscription-ended` + `/trial-expired`: now see "Access paused" + "Contact your admin" card instead of reactivate/upgrade CTAs. New i18n keys: `operatorTitle`, `operatorDescription`, `operatorContactAdmin` in both sections (EN + RO).
- [ ] Premium badge kept visible for all roles (pure status indicator, no CTA).

### 6. Sticky subscription banner

- [x] Banner + header now wrapped in `sticky top-0 z-40` — always visible on scroll.
- [x] Fixed weird gap on the right: removed `flex-1` from `<p>` so text + button hug naturally instead of spreading across full container width.
- [x] Admin-only rule applied (see #5): operators see status text only, no price, no "Manage billing".
- [ ] Decide on dismissibility (currently non-dismissible — probably fine, matches the "always visible" intent).

### 7. Execution overview — DONE

- [x] Refactored `execution-detail.tsx` to a 2-column layout: timeline (left) + right rail (`lg:grid-cols-[1fr_320px]`, sticky rail at `lg:top-20`).
- [x] Page now header has numbered title (`Execution #N — {process}`) + subtitle (operator + step progress).
- [x] Right rail: Run summary card with StatCards (exec #, steps N/M, avg time per step, AI help rate, longest gap) + total duration footnote.
- [x] Long-gap amber alert card shown only when longest gap ≥ 24h, citing the two step numbers.
- [x] Other runs card lists up to 5 sibling executions (newest first), each linking to its own detail page; shows operator + relative time, ongoing pill for in-progress runs.
- [x] Metrics computed in the component: avg = total duration / completed steps; AI help rate = total questions / completed steps; longest gap = max delta between consecutive `completed_at` timestamps.
- [x] Page query now also fetches all executions for the process (id, status, started_at, completed_at, operator) — used to compute `executionNumber` (1-indexed by `started_at` ascending) + sibling list.
- [x] Breadcrumb now reads `Execution #N`. Container widened from `max-w-4xl` → `max-w-6xl` to fit the right rail.
- [x] RO translations filled in for all new ExecutionDetail keys (`titleNumbered`, `subtitleCompleted`, `subtitleInProgress`, `aiInteractionsBreakdown`, `runSummary`, `executionNumber`, `stepsCompleted`, `avgTimePerStep`, `aiHelpRate`, `longestGap`, `longGapDetected`, `longGapDescription`, `otherRunsTitle`, `otherRunsNone`, `ongoing`).

### 8. Profile "Your Statistics" — real graphs + trend lines

The stats block on `/profile` (rendered by `src/app/[locale]/profile/page.tsx`)
currently shows 4 stat cards (Organization Members, Organization Processes,
Total Executions, Completion Rate) plus an `ExecutionTrendChart`
(`src/components/shared/execution-trend-chart.tsx`) labelled
"Executions — last 6 months". Two concrete problems:

1. The chart's bars don't render — in the screenshot Mar shows "4 · 2✓" but
   the bar area is empty. The bar inner `<div>` uses `height: X%` with
   `position: absolute`, but the parent wrapper `div.relative.flex-1.max-w-[18px]`
   has no explicit height, so the percentage can't resolve. Needs `h-full` on
   the wrapper (or restructure so the bar itself is flex-grown from the bottom).
2. The surface reads "statistics" but there are no trend lines, deltas, or
   breakdowns — just 4 static counts and an (invisible) bar chart.

#### Scope

- [ ] **Fix the empty bar chart** — add `h-full` to the bar wrapper `div`s in
      `execution-trend-chart.tsx` so the `%`-based inner bars resolve. Verify
      visually on a month with data (e.g. Mar in the screenshot, `4 · 2✓`).
- [ ] **Add deltas on the stat cards** — "+1 vs last month" style, matching
      the admin/manager dashboards that got deltas this session. Applies to
      Total Executions + Completion Rate at minimum. Members/Processes deltas
      optional (low signal).
- [ ] **Upgrade chart from bars to a real line/area chart** — use `recharts`
      (already likely a transitive dep via shadcn; verify) or keep it bespoke
      but render a proper SVG line for `started` + `completed`. Hover =
      tooltip with exact counts. Keep the month labels + the `N · M✓` summary
      row underneath.
- [ ] **Add a second chart: "Completion rate over time"** — single line, same
      6-month window, y-axis 0–100%. Renders below or next to the executions
      chart.
- [ ] **Breakdown by process (top 5)** — small horizontal bar list:
      "{process title} — {N} executions". Linked to each process detail page.
      Pulls from `executions` grouped by `process_id`, joined to `processes`.
- [ ] Optional: **Breakdown by operator** — only for admin/manager viewing
      their org stats (not for operators viewing their own). Respects
      org-scoped RLS via `getSessionContext()`.

#### Data

The profile page already aggregates `started` / `completed` per month. For the
new breakdowns:

- Top processes: `SELECT process_id, count(*) FROM executions WHERE org_id = $1
AND started_at > now() - interval '6 months' GROUP BY process_id ORDER BY
count DESC LIMIT 5` + join to `processes` for title.
- Completion rate trend: reuse the existing 6-month aggregate — compute
  `completed / started` per month, null when `started = 0`.

#### i18n

Add keys under `Profile.*` in both `messages/en.json` + `messages/ro.json`:

- `completionRateTrend` — "Completion rate over time"
- `topProcesses` — "Top processes" / "Procese de top"
- `noData` — "No data yet" / "Fără date încă"
- delta strings: `vsLastMonth` — "{delta} vs last month" / "{delta} față de
  luna trecută"

#### Acceptance

- [ ] Chart bars render correctly for months with data
- [ ] New line chart renders completion rate trend
- [ ] Top 5 processes list renders with counts + links
- [ ] Deltas visible on executions + completion rate cards
- [ ] `npx tsc --noEmit` passes
- [ ] RO translations filled in for all new keys
- [ ] Mobile: charts stack vertically below 768px

## Pre-existing tech debt — DONE

- [x] `src/components/operator/chat-panel.tsx` — moved `activeStepRef.current = activeStep` into a `useEffect`; added scoped `eslint-disable-next-line react-hooks/refs` over the transport `body` callback (called at send time, not render) and over the messages map (`stepContextMap` is a write-once cache, value stable per message id).
- [x] `src/app/[locale]/pricing/page.tsx` — added scoped `eslint-disable-next-line react-hooks/purity` for `Date.now()`; legitimate use in a per-request server component computing trial days left.
- [x] `src/lib/actions/executions.ts` — removed unused `executionId` param from `toggleStep`; updated the single call site in `checklist-executor.tsx`.
- [x] Unused imports cleaned: `Card{Content,Header,Title}` in `org-stats.tsx`; `tc` in `reset-password-form.tsx`; `error` arg in `global-error.tsx` (kept type signature, dropped unused destructure).

# Task: Improve the Sopia Pricing page — DONE

- [x] Removed the "How upgrading works" 24-hour manual-payment card (was conversion-killer copy).
- [x] Added Monthly / Annual billing toggle — `PricingTiers` client component owns state; page server component passes session.
- [x] Annual prices: Growth €79/mo (€948/yr), Business €400/mo (€4,800/yr), 20% off badge.
- [x] Hoisted `Date.now()` above JSX as `const nowMs = Date.now()` with a scoped eslint-disable (server component runs per-request).
- [x] Replaced `requestUpgrade` copy with `contactToUpgrade` (Growth) and `contactSales` (Business) — mailto subject now includes billing cycle.
- [x] i18n: removed `howUpgradeWorks*`, `requestUpgrade`, `growthPrice`, `businessPrice`; added `billingCycle`, `billingMonthly`, `billingAnnual`, `saveAnnual`, `billedMonthly`, `billedAnnuallyTotal`, `contactToUpgrade`, `contactSales` in EN + RO.
- [x] Middle "Team" tier added — €249/mo, €199/mo annual (€2,388/yr). 10 Managers + unlimited Operators, 100 AI SOPs/mo, priority email support, everything in Growth. "Best value" badge moved from Business → Team (middle-tier anchor).

The current pricing page at src/app/[locale]/pricing/page.tsx has three problems
the landing-page audit flagged:

1. Only two tiers (Growth €99 / Business €500) with a 5x jump and no middle option.
2. A "How upgrading works" card that reads: "Click the upgrade button to send
   us your request. We'll review it and send you a payment link within 24 hours."
   This signals an unfinished product at the exact moment someone wants to pay.
3. No annual billing option or discount.

There's also a pre-existing lint error at line 85 — `Date.now()` called during
render in a server component.

## Changes

### 1. Remove or hide the "manual payment flow" card

Decide with the product owner first, but default action: hide the `howUpgradeWorks`
card entirely. Replace with a "Contact sales" card for Business tier + a direct
checkout flow for Growth (placeholder button that triggers toast "Checkout
coming soon" if real billing isn't wired up yet — document that in a TODO).

### 2. Add annual billing toggle

- Add a Monthly / Annual toggle at the top of the pricing section
- Annual = 20% discount (standard SaaS)
  - Growth: €99/mo → €79/mo billed annually (€948/yr)
  - Business: €500/mo → €400/mo billed annually (€4800/yr)
- Show the "save X%" badge next to the annual prices

### 3. Consider a middle "Team" tier

Proposed: €249/month (or €199 annual)

- Unlimited Operators, up to 10 Managers
- 100 AI-generated SOPs per month
- Priority email support
- Everything in Growth

Leave this as optional — ask the product owner before adding.

### 4. Fix the Date.now() lint error on line 85

Server component computing trial days remaining. Replace:

```ts
Math.ceil((new Date(session.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
```

with a hoisted `const nowMs = Date.now()` call above the JSX and a
`// eslint-disable-next-line react-hooks/purity -- server component, runs per-request`
comment, matching the pattern used in the dashboard pages.

### 5. Copy pass

- Replace "Business" with "Enterprise" if adding the Team tier (more standard
  naming)
- Make feature lists more concrete (e.g. "Up to 10 Managers" → "10 Managers
  - unlimited Operators", "30 AI SOPs per month" → "30 AI-generated SOPs/month,
    up to 3 revisions each")
- Remove redundant "Everything in Growth" if visual diff already makes it clear

--- new task

# Task: Add demo booking option (no modal popup)

Add a "Book a demo" option in two spots on the landing page + pricing, plus
a dedicated /demo page with an embedded Cal.com widget.

## Context

Sopia targets SMB teams (10-50 people) with a 14-day free trial. Self-serve
is the primary path. A demo option helps users on the fence — especially for
the higher-priced Business tier — without interrupting the trial flow.

## Changes

### 1. Hero (landing page)

Under the existing CTAs, add a tiny text link:
"Or <a href="/demo">book a 20-min demo</a>"
Muted color, no border, text-sm.

### 2. Pricing page

Below the Business tier card, add a small CTA card:
"Not sure which plan fits?"
"Get a 20-min walkthrough with us — we'll help you pick."
[Book a demo] (variant=outline button linking to /demo)

### 3. New /demo page

- Use Cal.com embed (or Calendly if Cal.com isn't set up)
- Title: "Book a demo with Sopia"
- Subtitle: "Pick a 20-min slot. We'll walk through your use case and answer
  any questions."
- Embed iframe (https://cal.com/embed/...)
- If no Cal.com account yet: placeholder + mailto:hello@sopia.xyz CTA

### 4. Do NOT add any modal or exit-intent popup

Popup-based demo CTAs are friction and tank conversion. Text links only.

## Constraints

- Use next-intl keys (Landing.bookDemo, Pricing.notSureTitle, Demo.title, etc.)
- Respect existing Button/Card components
- Mobile-first — CTA stacks properly

## Acceptance

- [ ] Tiny "Book a demo" link under hero CTAs
- [ ] Demo CTA card on pricing below Business tier
- [ ] /demo page with Cal.com embed (or mailto fallback)
- [ ] No modal popup anywhere
- [ ] tsc + eslint pass

## Constraints

- Keep next-intl i18n pattern — add new keys to messages/en.json and ro.json
- Keep existing Badge, Button, Card components
- Mobile-first — columns stack at <768px
- Don't change the free-trial copy ("14-day free trial — no credit card required")
- Don't add any real payment integration yet — use placeholder handlers

## Acceptance

- [ ] Monthly/Annual toggle works and updates prices
- [ ] Annual prices show "Save 20%" badge
- [ ] No "we'll review and send payment link within 24 hours" copy visible
- [ ] Date.now() lint error on line 85 gone
- [ ] `npx tsc --noEmit` passes
- [ ] `npx eslint src/app/[locale]/pricing/page.tsx` passes
- [ ] Visual check on mobile + desktop

# Task: Interactive product tour (Arcade / Navattic)

**Replaces** the "Book a demo" task above. For SMB self-serve (10–50 people
teams evaluating a €99/mo tool), a click-through tour converts higher than
a booked call — zero friction, no signup required, scales infinitely. Live
demos can stay as a mailto CTA for Business-tier prospects.

## Tool

- **Arcade** (https://arcade.software) — free tier, browser extension records
  clicks, iframe embed. **Start here.**
- Navattic as an upgrade path if Arcade's free tier gets outgrown. More
  enterprise-priced, richer interactivity.

## Flows to record (ask user first)

- (a) Manager creates an SOP from a prompt → publishes. ~60–90s.
- (b) Operator runs the checklist + asks AI a question. ~60–90s.

## Changes

### 1. New `/tour` page

- Title: "See Sopia in action"
- Subtitle: "Click through the product — no signup needed."
- 16:9 iframe container for the Arcade embed (`src` to be filled in when the
  recording is ready — leave a TODO).
- "What you'll see" bullets (3–4 items describing the flow).
- CTA below: "Start 14-day free trial" (primary) + muted "or talk to us"
  mailto (secondary).

### 2. Landing page wiring

- "Watch 60s demo" button currently points to `#demo` anchor with no modal.
  Option A: rewire to `/tour`. Option B: add a second CTA "Click through
  the product" next to it. Pick A unless the user wants both.

### 3. Pricing page

- Optional: small muted link below the Business tier card — "Not sure which
  plan? Talk to us" → `mailto:hello@sopia.xyz`. Matches the Business-tier
  high-touch posture without a modal.

### 4. i18n

Keys under `Tour.*` in EN + RO: `title`, `subtitle`, `whatYoullSee`,
`bullet1..4`, `ctaTrial`, `ctaTalk`, `placeholderNotice` (shown while the
iframe URL is still a TODO).

## What blocks shipping end-to-end

- Arcade account + recorded flow(s) → embed URL.

## Acceptance

- [ ] `/tour` page renders with placeholder iframe + "What you'll see" + CTAs
- [ ] Landing "Watch 60s demo" points to `/tour`
- [ ] i18n complete in EN + RO
- [ ] `npx tsc --noEmit` + `npx eslint` pass
- [ ] Once Arcade URL exists: paste `src`, remove placeholder notice

## Nice-to-have polish

- [ ] Dedicated Escalations page — add filters (by process, by operator, by date range)
- [ ] Operator execute view — the chat panel is a Sheet; the mockup shows it side-by-side on desktop. Consider a responsive two-column layout on xl breakpoint
- [ ] Replace `/hero-placeholder.png` reference (not needed now — the hero uses CSS mockup)
- [ ] Run a `rm -rf .claude/worktrees` cleanup + confirm `.gitignore` has `.claude/worktrees/` + `.claude/settings.local.json`
- [ ] Record a real 60s product demo and wire it to the `Watch 60s demo` button on landing (currently `#demo` anchor with no modal)

## Done this session (for context)

- Landing page: new hero, product visual mockup, Why Sopia comparison table, varied pain-point icons, Watch 60s demo CTA
- Sidebar nav (desktop) + mobile drawer — role-based items
- Admin/Manager/Operator dashboards: stat cards with deltas, escalations moved to top
- Process details: tabs (Document/Checklist/Version history placeholder), sticky TOC, 3-column layout, Smart suggestion card, right rail
- Execution overview: friction points panel, chat bubbles, duration format fix
- Operator dashboard: progress bars on In Progress, step count on Assigned cards
- Profile: AppShell layout, breadcrumbs, icon stat cards, 6-month trend chart
- Dedicated `/manager/escalations` page
- ProcessCard enriched with status/runs/operators/last run
- MemberList with colored avatars + role pills
- Subscription banner: bold title + muted sub + Manage billing CTA
- Badge semantic variants (success, warning, info, danger, neutral, purple) — squared + uppercase + colored bg
- Breadcrumbs everywhere, zero legacy back buttons
- User chip in header with avatar + email

## Current branch state

Latest changes may not be committed yet. Check with:

```bash
cd /Users/raducimpian/Projects/sop-assistant
git status
git log --oneline -10
```

If there are uncommitted changes, the last commit command was:

```bash
git add messages/ src/
git commit -m "feat(ui): operator dashboard matches mockup — progress bar + enriched cards"
git push origin main
```
