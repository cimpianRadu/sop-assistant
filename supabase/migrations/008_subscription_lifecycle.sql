-- Extend subscription lifecycle: new statuses, current_period_end, soft-delete fields

-- 1. Add new enum values to subscription_status_enum
ALTER TYPE subscription_status_enum ADD VALUE IF NOT EXISTS 'past_due';
ALTER TYPE subscription_status_enum ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE subscription_status_enum ADD VALUE IF NOT EXISTS 'inactive';

-- 2. Add current_period_end to organizations (tracks when active/cancelled subscription ends)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- 3. Add soft-delete fields to profiles (GDPR-compliant account deletion)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
