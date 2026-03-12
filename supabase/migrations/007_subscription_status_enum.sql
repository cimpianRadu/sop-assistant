-- Convert subscription_status from TEXT with CHECK to a proper enum type
-- so Supabase UI shows the allowed values.

-- 1. Create the enum type
CREATE TYPE subscription_status_enum AS ENUM ('trialing', 'active', 'expired');

-- 2. Drop the existing CHECK constraint and default (must drop default before type change)
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_subscription_status_check;
ALTER TABLE organizations ALTER COLUMN subscription_status DROP DEFAULT;

-- 3. Convert the column from TEXT to the enum type
ALTER TABLE organizations
  ALTER COLUMN subscription_status TYPE subscription_status_enum
  USING subscription_status::subscription_status_enum;

-- 4. Re-set the default with the enum type
ALTER TABLE organizations
  ALTER COLUMN subscription_status SET DEFAULT 'trialing'::subscription_status_enum;
