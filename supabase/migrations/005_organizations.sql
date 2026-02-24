-- =============================================
-- Migration 005: Organization-based model
--
-- Adds multi-tenancy via organizations. Users sign up,
-- create an org (becoming admin), and invite team members.
-- Trial/subscription moves from profiles to organizations.
-- =============================================

-- =============================================
-- 1. New tables
-- =============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  subscription_status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (subscription_status IN ('trialing', 'active', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'operator')),
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_org_members_org_id ON org_members(org_id);
CREATE INDEX idx_org_members_user_id ON org_members(user_id);

CREATE TABLE org_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'operator')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  UNIQUE(org_id, email)
);

CREATE INDEX idx_org_invites_token ON org_invites(token);
CREATE INDEX idx_org_invites_email ON org_invites(email);

-- =============================================
-- 2. Alter existing tables
-- =============================================

-- Add full_name to profiles
ALTER TABLE profiles ADD COLUMN full_name TEXT;

-- Add org_id and created_by to processes
ALTER TABLE processes
  ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Backfill created_by from manager_id
UPDATE processes SET created_by = manager_id;

-- =============================================
-- 3. Enable RLS on new tables
-- =============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. SECURITY DEFINER helper functions
-- =============================================

-- Get user's org_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Check if user has a specific role in their org
CREATE OR REPLACE FUNCTION public.has_org_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE user_id = auth.uid() AND role = required_role
  );
$$;

-- Check if user is admin of their org
CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- REWRITE: check if user is admin or manager in the org that owns this process
CREATE OR REPLACE FUNCTION public.is_manager_of_process(p_process_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM processes p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE p.id = p_process_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
  );
$$;

-- is_assigned_to_process remains unchanged (already correct)

-- Accept invite: validates token, creates org_member, marks accepted
CREATE OR REPLACE FUNCTION public.accept_invite(invite_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'not_authenticated');
  END IF;

  SELECT * INTO v_invite FROM org_invites
  WHERE token = invite_token
    AND accepted_at IS NULL
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'invite_not_found_or_expired');
  END IF;

  -- Check email matches
  IF v_invite.email != (SELECT email FROM profiles WHERE id = v_user_id) THEN
    RETURN json_build_object('error', 'email_mismatch');
  END IF;

  -- Check user is not already in an org
  IF EXISTS (SELECT 1 FROM org_members WHERE user_id = v_user_id) THEN
    RETURN json_build_object('error', 'already_in_org');
  END IF;

  -- Create membership
  INSERT INTO org_members (org_id, user_id, role, invited_by, joined_at)
  VALUES (v_invite.org_id, v_user_id, v_invite.role, v_invite.invited_by, NOW());

  -- Mark invite accepted
  UPDATE org_invites SET accepted_at = NOW() WHERE id = v_invite.id;

  RETURN json_build_object('success', true, 'org_id', v_invite.org_id, 'role', v_invite.role);
END;
$$;

-- Helper to look up invite details by token (public access for invite page)
CREATE OR REPLACE FUNCTION public.get_invite_details(invite_token TEXT)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'id', i.id,
    'email', i.email,
    'role', i.role,
    'org_name', o.name,
    'expired', i.expires_at < NOW(),
    'accepted', i.accepted_at IS NOT NULL
  )
  FROM org_invites i
  JOIN organizations o ON o.id = i.org_id
  WHERE i.token = invite_token;
$$;

-- Look up pending invite for the current user (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_pending_invite_for_user()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'token', i.token,
    'role', i.role,
    'org_name', o.name
  )
  FROM org_invites i
  JOIN organizations o ON o.id = i.org_id
  WHERE i.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND i.accepted_at IS NULL
    AND i.expires_at > NOW()
  LIMIT 1;
$$;

-- Create org + admin membership (bypasses RLS for new users)
CREATE OR REPLACE FUNCTION public.create_organization(org_name TEXT, org_slug TEXT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_org_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM org_members WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'User already belongs to an organization';
  END IF;

  INSERT INTO organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO v_org_id;

  INSERT INTO org_members (org_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'admin');

  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. RLS policies for new tables
-- =============================================

-- organizations
CREATE POLICY "Members view own org" ON organizations FOR SELECT USING (
  id = get_user_org_id()
);
CREATE POLICY "Admins update org" ON organizations FOR UPDATE USING (
  id = get_user_org_id() AND is_org_admin()
);

-- org_members
CREATE POLICY "View org members" ON org_members FOR SELECT USING (
  org_id = get_user_org_id()
);
CREATE POLICY "Admins add members" ON org_members FOR INSERT WITH CHECK (
  org_id = get_user_org_id() AND is_org_admin()
);
CREATE POLICY "Admins remove members" ON org_members FOR DELETE USING (
  org_id = get_user_org_id() AND is_org_admin()
);
CREATE POLICY "Admins update members" ON org_members FOR UPDATE USING (
  org_id = get_user_org_id() AND is_org_admin()
);

-- org_invites
CREATE POLICY "Admins view invites" ON org_invites FOR SELECT USING (
  org_id = get_user_org_id() AND is_org_admin()
);
CREATE POLICY "Admins create invites" ON org_invites FOR INSERT WITH CHECK (
  org_id = get_user_org_id() AND is_org_admin()
);
CREATE POLICY "Admins delete invites" ON org_invites FOR DELETE USING (
  org_id = get_user_org_id() AND is_org_admin()
);

-- =============================================
-- 6. Rewrite existing RLS policies
-- =============================================

-- profiles: replace the broad "Authenticated users can view profiles"
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
CREATE POLICY "View org member profiles" ON profiles FOR SELECT USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM org_members om
    WHERE om.user_id = profiles.id AND om.org_id = get_user_org_id()
  )
);

-- processes: org-scoped access
DROP POLICY IF EXISTS "View processes" ON processes;
CREATE POLICY "View processes" ON processes FOR SELECT USING (
  org_id = get_user_org_id() AND (
    has_org_role('admin') OR
    has_org_role('manager') OR
    is_assigned_to_process(id)
  )
);

DROP POLICY IF EXISTS "Managers create processes" ON processes;
CREATE POLICY "Managers create processes" ON processes FOR INSERT WITH CHECK (
  org_id = get_user_org_id() AND (has_org_role('admin') OR has_org_role('manager'))
);

DROP POLICY IF EXISTS "Managers update own" ON processes;
CREATE POLICY "Managers update org processes" ON processes FOR UPDATE USING (
  org_id = get_user_org_id() AND (has_org_role('admin') OR has_org_role('manager'))
);

DROP POLICY IF EXISTS "Managers delete own" ON processes;
CREATE POLICY "Managers delete org processes" ON processes FOR DELETE USING (
  org_id = get_user_org_id() AND (has_org_role('admin') OR has_org_role('manager'))
);

-- executions: use org role check instead of profiles.role
DROP POLICY IF EXISTS "Operators create executions" ON executions;
CREATE POLICY "Operators create executions" ON executions FOR INSERT WITH CHECK (
  operator_id = auth.uid() AND
  has_org_role('operator') AND
  is_assigned_to_process(process_id)
);

-- help_requests: use org role check
DROP POLICY IF EXISTS "Operators create help requests" ON help_requests;
CREATE POLICY "Operators create help requests" ON help_requests FOR INSERT WITH CHECK (
  operator_id = auth.uid() AND
  has_org_role('operator')
);

-- =============================================
-- 7. Update handle_new_user trigger
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 8. Data migration for existing users
-- =============================================

DO $$
DECLARE
  mgr RECORD;
  new_org_id UUID;
BEGIN
  FOR mgr IN
    SELECT id, email, trial_ends_at, subscription_status
    FROM profiles WHERE role = 'manager'
  LOOP
    -- Create org
    INSERT INTO organizations (name, slug, trial_ends_at, subscription_status)
    VALUES (
      split_part(mgr.email, '@', 1) || '''s Organization',
      replace(split_part(mgr.email, '@', 1), '.', '-') || '-' || substr(mgr.id::text, 1, 8),
      mgr.trial_ends_at,
      mgr.subscription_status
    )
    RETURNING id INTO new_org_id;

    -- Make the manager an admin of the new org
    INSERT INTO org_members (org_id, user_id, role)
    VALUES (new_org_id, mgr.id, 'admin');

    -- Backfill org_id on their processes
    UPDATE processes SET org_id = new_org_id WHERE manager_id = mgr.id;

    -- Move any operators assigned to their processes into the org
    INSERT INTO org_members (org_id, user_id, role)
    SELECT DISTINCT new_org_id, pa.operator_id, 'operator'
    FROM process_assignments pa
    JOIN processes p ON p.id = pa.process_id
    WHERE p.manager_id = mgr.id
    ON CONFLICT (org_id, user_id) DO NOTHING;
  END LOOP;
END $$;

-- =============================================
-- 9. Make org_id NOT NULL after backfill
-- =============================================

ALTER TABLE processes ALTER COLUMN org_id SET NOT NULL;
CREATE INDEX idx_processes_org_id ON processes(org_id);
