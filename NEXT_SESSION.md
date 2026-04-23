# Next session — TODO

Carried over from the UI redesign session. Top-priority items are blockers for features the UI already hints at but has no backend for.

## Top priority (backend + UI)

### 1. SOP editing — DONE
- [x] Schema: added `processes.updated_at` (trigger auto-sets on UPDATE) + `processes.current_version` (default 1). Migration applied to **dev** + **prod**.
- [x] Server action: `updateProcess(id, { title, description, sopText, checklist })` in `src/lib/actions/processes.ts`. Increments `current_version`, replaces `checklist_steps` (delete + insert).
- [x] UI: `/manager/processes/[id]/edit` page + new `EditProcessForm` component (title, description, sop_text textarea with mono font, dynamic step list with add/remove).
- [x] `EditSopButton` is now a server component `<Link>` to the edit page (no more "coming soon" toast).
- [ ] Follow-up: the `current_version` increments on every save — that's the hook for #3 version badge. But: it increments even if nothing changed. Consider skipping increment when nothing actually changed (low priority).

### 2. Version history
- [ ] New table `process_versions` (id, process_id, version_number, sop_text, steps_snapshot jsonb, updated_by, updated_at)
- [ ] On SOP update, insert a snapshot row + increment `processes.current_version`
- [ ] UI: Version history tab on process details — list versions + diff viewer (e.g. `diff` output rendered inline)
- [ ] Replace "coming soon" toast on the Version history tab

### 3. Real version badge — DONE
- [x] Shows `v{current_version} · updated {formatRelativeTime(updated_at)}` as a neutral badge next to status on process detail header
- [x] Pulls real values from `processes.current_version` + `processes.updated_at` (populated by #1's migration + `updateProcess` action)
- [x] i18n keys added: `Manager.versionBadge` in EN + RO

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

### 7. Execution overview — matches mockup
Translation keys are already added in `messages/en.json` / `ro.json` under `ExecutionDetail`:
`runSummary`, `avgTimePerStep`, `aiHelpRate`, `longestGap`, `longGapDetected`, `otherRunsTitle`, `executionNumber`, `stepsCompleted`, `ongoing`, etc.

- [ ] Refactor `execution-detail.tsx` to a 2-column layout: timeline (left) + right rail
- [ ] Right rail content:
  - Run summary: exec #, steps N/M, avg time per step, AI help rate, longest gap
  - Long-gap alert (amber card) when longest gap > threshold (e.g. 24h)
  - Other runs of this process (sibling executions)
- [ ] Compute metrics on the page: execution number (index of this exec in process's exec list), avg time = total duration / completed steps, AI help rate = ai_interactions / steps, longest gap = max time between consecutive step completions

## Pre-existing tech debt (not touched this session)

- `src/components/operator/chat-panel.tsx` — 3x `react-hooks/refs` errors (refs accessed during render)
- `src/app/[locale]/pricing/page.tsx:85` — `Date.now()` during render (server component — needs `eslint-disable-next-line react-hooks/purity`)
- `src/lib/actions/executions.ts:60` — unused `executionId` param
- Minor unused imports in `org-stats.tsx`, `reset-password-form.tsx`, `global-error.tsx`

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
