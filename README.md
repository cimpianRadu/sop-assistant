# Sopia

Senior expertise where it matters. AI guidance everywhere else. Create SOPs, assign operators, and track execution with checklists.

Built with Next.js 16, Supabase (PostgreSQL + Auth), next-intl (EN/RO), and shadcn/ui.

## Prerequisites

- Node.js 18+
- A Supabase account (two projects: dev and prod)
- An Anthropic API key

## Environment Setup

This project uses **two Supabase projects** to separate development and production data.

| Environment | Supabase Project | Used When |
|-------------|-----------------|-----------|
| **Dev** | Sopia Dev (`obdiggtvvchlnyecchgm`) | `next dev` locally |
| **Prod** | Sopia (`eguixceaxwezabxaggtb`) | Vercel deployment |

### Local development

1. Copy the env template and fill in your values:

```bash
cp .env.example .env.local
```

2. `.env.local` should contain your **dev** Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<dev-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dev-anon-key>
ANTHROPIC_API_KEY=<your-anthropic-key>
```

3. Start the dev server:

```bash
npm run dev
```

### Production (Vercel)

Set these environment variables in the [Vercel dashboard](https://vercel.com/dashboard) under your project's Settings > Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL` — prod Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — prod anon key
- `ANTHROPIC_API_KEY` — your Anthropic API key

### Testing prod locally (optional)

To test against the production database locally:

```bash
# .env.production.local is gitignored and contains prod credentials
# next build && next start will pick it up automatically
npm run build && npm run start
```

## Database

### Migrations

Migration files are in `supabase/migrations/`. They are numbered sequentially:

| Migration | Description |
|-----------|-------------|
| 001 | Initial schema (profiles, processes, checklist_steps, executions, execution_steps) |
| 002 | Feature additions (process_assignments, help_requests) |
| 003 | Fix RLS recursion (SECURITY DEFINER helpers) |
| 004 | Trial and pricing columns |
| 005 | Organization-based model (organizations, org_members, org_invites) |
| 006 | Cleanup deprecated columns |
| 007 | Managers create executions policy |

Migrations are applied via the Supabase MCP tool (`apply_migration`) or the Supabase SQL Editor.

### Seed data (dev only)

After creating a user and organization through the app:

1. Open the Supabase SQL Editor for the **dev** project
2. Paste and run `supabase/seed.sql`
3. This creates 3 sample SOPs with checklist steps

## Project Structure

```
src/
  app/[locale]/          # Next.js app router (i18n routes)
  components/            # React components
  lib/                   # Utilities (Supabase client, session, actions)
  messages/              # i18n translation files (en.json, ro.json)
supabase/
  migrations/            # SQL migration files
  seed.sql               # Dev seed data
```
