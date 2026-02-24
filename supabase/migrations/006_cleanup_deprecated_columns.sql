-- =============================================
-- Migration 006: Drop deprecated columns
--
-- Now that all app code uses org_members for roles
-- and organizations for trial/subscription, remove
-- the old columns from profiles and processes.
-- =============================================

-- Drop deprecated columns from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS role;
ALTER TABLE profiles DROP COLUMN IF EXISTS trial_ends_at;
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_status;

-- Drop old RLS policy that references manager_id
DROP POLICY IF EXISTS "Managers insert steps" ON checklist_steps;

-- Replace with org-scoped policy
CREATE POLICY "Managers insert steps" ON checklist_steps FOR INSERT WITH CHECK (
  is_manager_of_process(process_id)
);

-- Drop deprecated column from processes
ALTER TABLE processes DROP COLUMN IF EXISTS manager_id;

-- Drop old index
DROP INDEX IF EXISTS idx_processes_manager_id;
