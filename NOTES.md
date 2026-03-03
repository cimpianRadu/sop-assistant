# Sopia - Notes & Future Plans

## Current MVP Architecture
- **Roles**: Manager, Operator (selected at signup)
- **Flow**: Manager creates processes (AI-generated SOPs) → assigns operators by email → operators execute step-by-step
- **Auth**: Email + password + role selection at signup
- **Data model**: Single-tenant, no organization concept, processes owned by individual managers

---

## Positioning & Go-To-Market Strategy

### Core Value Proposition
> "Transformă experiența echipei tale în proceduri operaționale clare, generate cu AI.
> Angajații noi devin productivi din prima zi, fără să blochezi seniorii."

### Three Potential Angles (evaluated)
1. **Senior productivity tool** - valid pain, but hard to sell (nice-to-have, unclear buyer)
2. **SMB SOP digitization** - too broad, lots of competition (Trainual, SweetProcess, Process Street)
3. **Safety-critical / industrial** - strong (legal obligation, budget exists), but longer sales cycle

### Chosen Initial Target: Sales Teams in Romania
**Why sales teams:**
- High turnover (30-50%/year in Romania)
- Expensive onboarding - untrained rep loses deals for 2-3 months
- Measurable ROI: "new hire closed first deal in 2 weeks instead of 2 months"
- Buyer = user (sales manager feels the pain AND has budget authority)
- Repetitive processes: sales scripts, objection handling, CRM flows, follow-up processes

**Company size: 10-50 employees**
- Under 10: seniors can still do 1-on-1 training, low pain
- 10-50: pain explodes - growing, hiring, but no HR/L&D department
- 50+: likely have solutions already, long sales cycle, want enterprise features

**Concrete target companies:**
- Real estate agencies (RE/MAX, Blitz, etc. - each franchise)
- Insurance brokers
- Recruitment agencies
- B2B sales / distribution companies
- Marketing/digital agencies with sales teams

### Validation Approach
1. Ask the senior sales people already contacted: "Know sales team managers (10+ people) who hire frequently?"
2. LinkedIn outreach → Sales Manager / Director Vânzări from Cluj/București
3. Show 15-minute demo
4. Key question: "How much time does your best person lose on onboarding new hires?"
5. If they say "too much" and offer to pay → product-market fit confirmed

### Expansion Path (after validation)
1. Other departments in same companies (customer support, operations)
2. Other niches with same pain (HoReCa, retail chains, auto service)
3. Larger companies (50-200)
4. Industrial/safety-critical (construction, logistics, manufacturing)

---

## Pricing & Monetization Strategy

### Recommended Model: Flat Subscription per Organization (with tiers)

**Do NOT make the customer use their own API key** - it's friction, confusing for non-technical buyers, and makes you look like a wrapper, not a product.

**Do NOT do pure freemium** for B2B at this stage - free users don't convert well, and support cost is real.

### MVP Pricing: One Plan, Simple

**~€99/month** (or €79 if aggressive for Romanian market)
- 3 Managers, up to 20 Operators
- 30 AI-generated SOPs/month
- Help system with AI responses + escalation
- Execution tracking & analytics
- Email/chat support

**Don't build multiple tiers upfront.** Add them when customers tell you:
- "Too expensive for our 3-person team" → add Starter at ~€49
- "We have 50 operators, need more" → add Business at ~€199
- Let customers dictate tiers, not assumptions

### Trial Strategy: 14 Days, Full Access, No Limits

**Why 14 days full access (not 7 days limited):**
- B2B decision cycle: manager needs time to create SOPs, invite team, see results
- The "aha moment" is when an operator completes a process alone without bothering anyone
- With limits (e.g., 3 operators, 3 SOPs), they never reach that moment
- 7 days is too short: Day 1-3 setup, Day 4-5 team starts using, Day 6-7 expires before seeing value
- If any limit, put it on AI generation (10 SOPs), NOT on users - team size is what shows value

**Trial conversion tactics (manual for first clients):**
- Day 3: "Have you created your first SOP?" (WhatsApp/email)
- Day 7: "Your team has completed X executions - here's what you've saved"
- Day 10: "Trial expires in 4 days, here's what you've achieved"
- Day 13: "Tomorrow it ends, want to continue?"

### Key Pricing Decisions
- **AI cost baked into price** - NOT "bring your own API key" (looks like a wrapper, confuses non-technical buyers)
- **AI cost per SOP**: ~€0.03-0.05. At 30 SOPs/month = ~€1.50. Margin >98%
- **No credit card required** for trial
- **Annual discount**: 2 months free (pay 10 get 12) - add later
- **Price anchor**: "Your senior loses 10h/month training = ~€500 salary cost. This costs €99."

### For First 5-10 Clients (before building billing)
- Stripe payment link or bank transfer
- Manual onboarding (setup on Zoom, personal WhatsApp support)
- This is a feature, not a bug - direct access to learn what they really need
- Don't build billing/subscription infrastructure until 10+ paying customers

---

## Future: Multi-Tenant / Organization Layer (Post-Validation)

When there's proven demand and paying users, migrate to org-based architecture:

### New DB Tables
```sql
-- Organization
organizations (id, name, created_by, created_at)

-- Membership (replaces role from profiles)
organization_members (
  id,
  organization_id,
  user_id,
  role: 'admin' | 'manager' | 'operator',
  invited_by,
  created_at
)

-- Invitations
invitations (
  id,
  organization_id,
  email,
  role,
  invited_by,
  token,
  accepted_at,
  expires_at
)
```

### New Onboarding Flow
1. Public signup → creates account + organization → user becomes Admin
2. Admin → Dashboard → "Invite Team" → sends email with role
3. Invitee clicks link → Signup (or login if existing) → attached to org with assigned role
4. Remove public role picker from signup (role comes from invitation)

### Key Changes Required
- Add `organizations`, `organization_members`, `invitations` tables
- Move `role` from `profiles` to `organization_members`
- Add `organization_id` to `processes` table
- Refactor signup flow (public signup = new org, invite = join existing org)
- Implement invite system (email + token-based)
- Update all RLS policies to filter by `organization_id`
- Update middleware for org context
- A user can be manager in one org and operator in another

### Why This Pattern
- Industry standard (Slack, Notion, Linear, Asana all use it)
- Data isolation per organization
- Billing per organization, not per user
- Clear onboarding: admin controls who has access
- Better security: RLS on organization_id

### Migration Estimate
- ~1-2 days of work when the time comes
- Not a full rewrite, just adding a layer on top
