-- =============================================
-- Seed data for SOP Assistant DEV environment
--
-- This script creates test data for local development.
-- Run against the DEV Supabase project only!
--
-- Usage: paste into Supabase SQL Editor (dev project)
-- or run via: supabase db execute --project-ref obdiggtvvchlnyecchgm < supabase/seed.sql
--
-- NOTE: Auth users must be created via Supabase Auth (signup flow).
-- This script seeds the public tables assuming users already exist.
-- For a fresh dev DB, first create test users via the app signup,
-- then run this script to add orgs, SOPs, and assignments.
-- =============================================

-- =============================================
-- Helper: Create a test organization
-- =============================================
-- After signing up as admin@test.com via the app, run:

-- Create org for the admin user
-- (Replace the UUID with the actual admin user's profile ID)
--
-- SELECT create_organization('Test Organization', 'test-org');

-- =============================================
-- Sample SOP: Equipment Safety Check
-- =============================================
-- After org is created and you have the org_id:

DO $$
DECLARE
  v_org_id UUID;
  v_admin_id UUID;
  v_process_id UUID;
BEGIN
  -- Get the first org (assumes at least one exists)
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'No organization found. Create one first via the app, then re-run this script.';
    RETURN;
  END IF;

  -- Get the admin user
  SELECT om.user_id INTO v_admin_id
  FROM org_members om
  WHERE om.org_id = v_org_id AND om.role = 'admin'
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'No admin found for the organization.';
    RETURN;
  END IF;

  -- SOP 1: Equipment Safety Check
  INSERT INTO processes (id, org_id, created_by, title, description, sop_text)
  VALUES (
    uuid_generate_v4(), v_org_id, v_admin_id,
    'Equipment Safety Check',
    'Daily safety inspection procedure for manufacturing equipment',
    E'1. Verify power is disconnected before inspection\n2. Check all safety guards are in place\n3. Inspect electrical cables for damage\n4. Test emergency stop buttons\n5. Verify warning labels are visible\n6. Check fire extinguisher accessibility\n7. Document any issues found\n8. Sign off on inspection log'
  )
  RETURNING id INTO v_process_id;

  INSERT INTO checklist_steps (process_id, step_number, step_text) VALUES
    (v_process_id, 1, 'Verify power is disconnected before inspection'),
    (v_process_id, 2, 'Check all safety guards are in place'),
    (v_process_id, 3, 'Inspect electrical cables for damage'),
    (v_process_id, 4, 'Test emergency stop buttons'),
    (v_process_id, 5, 'Verify warning labels are visible'),
    (v_process_id, 6, 'Check fire extinguisher accessibility'),
    (v_process_id, 7, 'Document any issues found'),
    (v_process_id, 8, 'Sign off on inspection log');

  -- SOP 2: New Employee Onboarding
  INSERT INTO processes (id, org_id, created_by, title, description, sop_text)
  VALUES (
    uuid_generate_v4(), v_org_id, v_admin_id,
    'New Employee Onboarding',
    'Standard procedure for onboarding new team members',
    E'1. Send welcome email with first-day instructions\n2. Prepare workstation and access credentials\n3. Schedule orientation meeting\n4. Assign buddy/mentor\n5. Review company policies and handbook\n6. Complete IT setup (email, VPN, tools)\n7. Introduce to team members\n8. Set 30-60-90 day goals'
  )
  RETURNING id INTO v_process_id;

  INSERT INTO checklist_steps (process_id, step_number, step_text) VALUES
    (v_process_id, 1, 'Send welcome email with first-day instructions'),
    (v_process_id, 2, 'Prepare workstation and access credentials'),
    (v_process_id, 3, 'Schedule orientation meeting'),
    (v_process_id, 4, 'Assign buddy/mentor'),
    (v_process_id, 5, 'Review company policies and handbook'),
    (v_process_id, 6, 'Complete IT setup (email, VPN, tools)'),
    (v_process_id, 7, 'Introduce to team members'),
    (v_process_id, 8, 'Set 30-60-90 day goals');

  -- SOP 3: Incident Response
  INSERT INTO processes (id, org_id, created_by, title, description, sop_text)
  VALUES (
    uuid_generate_v4(), v_org_id, v_admin_id,
    'Incident Response Procedure',
    'Steps to follow when a production incident occurs',
    E'1. Acknowledge the incident alert\n2. Assess severity level (P1-P4)\n3. Notify the on-call team lead\n4. Begin incident log with timeline\n5. Identify root cause\n6. Implement fix or workaround\n7. Verify resolution\n8. Write post-mortem report'
  )
  RETURNING id INTO v_process_id;

  INSERT INTO checklist_steps (process_id, step_number, step_text) VALUES
    (v_process_id, 1, 'Acknowledge the incident alert'),
    (v_process_id, 2, 'Assess severity level (P1-P4)'),
    (v_process_id, 3, 'Notify the on-call team lead'),
    (v_process_id, 4, 'Begin incident log with timeline'),
    (v_process_id, 5, 'Identify root cause'),
    (v_process_id, 6, 'Implement fix or workaround'),
    (v_process_id, 7, 'Verify resolution'),
    (v_process_id, 8, 'Write post-mortem report');

  RAISE NOTICE 'Seeded 3 SOPs for org %', v_org_id;
END $$;
