-- =============================================
-- Feature 3: Operator Assignment System
-- =============================================

-- New table: process_assignments
CREATE TABLE process_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(process_id, operator_id)
);

CREATE INDEX idx_process_assignments_process_id ON process_assignments(process_id);
CREATE INDEX idx_process_assignments_operator_id ON process_assignments(operator_id);

ALTER TABLE process_assignments ENABLE ROW LEVEL SECURITY;

-- Managers can view assignments for their own processes, operators can view their own
CREATE POLICY "View assignments" ON process_assignments FOR SELECT USING (
  operator_id = auth.uid() OR
  EXISTS (SELECT 1 FROM processes WHERE id = process_id AND manager_id = auth.uid())
);

CREATE POLICY "Managers assign operators" ON process_assignments FOR INSERT WITH CHECK (
  assigned_by = auth.uid() AND
  EXISTS (SELECT 1 FROM processes WHERE id = process_id AND manager_id = auth.uid())
);

CREATE POLICY "Managers remove assignments" ON process_assignments FOR DELETE USING (
  EXISTS (SELECT 1 FROM processes WHERE id = process_id AND manager_id = auth.uid())
);

-- Allow authenticated users to view profiles (needed for assignment by email lookup)
-- Profiles only contain email, role, created_at — nothing sensitive
CREATE POLICY "Authenticated users can view profiles" ON profiles FOR SELECT USING (
  auth.uid() IS NOT NULL
);

-- =============================================
-- Update existing RLS policies for assignment-based access
-- =============================================

-- DROP old policies that gave operators blanket access
DROP POLICY "View processes" ON processes;
DROP POLICY "View steps" ON checklist_steps;
DROP POLICY "Operators create executions" ON executions;

-- NEW: processes - managers see own, operators see only assigned
CREATE POLICY "View processes" ON processes FOR SELECT USING (
  manager_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM process_assignments
    WHERE process_id = id AND operator_id = auth.uid()
  )
);

-- NEW: checklist_steps - follow process visibility through assignments
CREATE POLICY "View steps" ON checklist_steps FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM processes WHERE id = process_id AND (
      manager_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM process_assignments
        WHERE process_id = processes.id AND operator_id = auth.uid()
      )
    )
  )
);

-- NEW: executions - require assignment
CREATE POLICY "Operators create executions" ON executions FOR INSERT WITH CHECK (
  operator_id = auth.uid() AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'operator') AND
  EXISTS (
    SELECT 1 FROM process_assignments
    WHERE process_id = executions.process_id AND operator_id = auth.uid()
  )
);

-- =============================================
-- Feature 4: Help Requests
-- =============================================

CREATE TABLE help_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  checklist_step_id UUID NOT NULL REFERENCES checklist_steps(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  ai_response TEXT,
  escalated BOOLEAN DEFAULT FALSE,
  escalation_note TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_help_requests_execution_id ON help_requests(execution_id);
CREATE INDEX idx_help_requests_process_id ON help_requests(process_id);
CREATE INDEX idx_help_requests_operator_id ON help_requests(operator_id);
CREATE INDEX idx_help_requests_escalated ON help_requests(escalated) WHERE escalated = TRUE;

ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View help requests" ON help_requests FOR SELECT USING (
  operator_id = auth.uid() OR
  EXISTS (SELECT 1 FROM processes WHERE id = process_id AND manager_id = auth.uid())
);

CREATE POLICY "Operators create help requests" ON help_requests FOR INSERT WITH CHECK (
  operator_id = auth.uid() AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'operator')
);

CREATE POLICY "Update help requests" ON help_requests FOR UPDATE USING (
  operator_id = auth.uid() OR
  EXISTS (SELECT 1 FROM processes WHERE id = process_id AND manager_id = auth.uid())
);
