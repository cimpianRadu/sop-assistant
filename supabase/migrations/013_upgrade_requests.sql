-- Upgrade requests: captures interest from trialing/active users who want
-- to upgrade or talk to sales. Replaces the previous mailto: flow.

CREATE TABLE upgrade_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  plan TEXT NOT NULL CHECK (plan IN ('growth', 'team', 'business')),
  cycle TEXT NOT NULL CHECK (cycle IN ('monthly', 'annual')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'contacted', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_upgrade_requests_org_id ON upgrade_requests(org_id);
CREATE INDEX idx_upgrade_requests_status ON upgrade_requests(status);

ALTER TABLE upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Members can read their org's upgrade requests (so admins can see history).
CREATE POLICY upgrade_requests_select_own_org ON upgrade_requests
  FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

-- Admins/managers can create upgrade requests for their own org.
CREATE POLICY upgrade_requests_insert_own_org ON upgrade_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = get_user_org_id()
    AND (has_org_role('admin') OR has_org_role('manager'))
    AND requested_by = auth.uid()
  );
