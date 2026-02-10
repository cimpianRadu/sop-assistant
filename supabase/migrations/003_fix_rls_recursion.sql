-- =============================================
-- Fix: Infinite recursion between processes and process_assignments RLS policies
--
-- The cycle: processes SELECT policy queries process_assignments,
-- whose SELECT policy queries processes back → infinite loop.
--
-- Solution: Use SECURITY DEFINER functions to bypass RLS for cross-table checks.
-- =============================================

-- Helper: check if auth.uid() is the manager of a given process (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_manager_of_process(p_process_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM processes WHERE id = p_process_id AND manager_id = auth.uid()
  );
$$;

-- Helper: check if auth.uid() is assigned to a given process (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_assigned_to_process(p_process_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM process_assignments WHERE process_id = p_process_id AND operator_id = auth.uid()
  );
$$;

-- =============================================
-- Fix process_assignments policies (break the cycle)
-- =============================================

DROP POLICY "View assignments" ON process_assignments;
CREATE POLICY "View assignments" ON process_assignments FOR SELECT USING (
  operator_id = auth.uid() OR
  is_manager_of_process(process_id)
);

DROP POLICY "Managers assign operators" ON process_assignments;
CREATE POLICY "Managers assign operators" ON process_assignments FOR INSERT WITH CHECK (
  assigned_by = auth.uid() AND
  is_manager_of_process(process_id)
);

DROP POLICY "Managers remove assignments" ON process_assignments;
CREATE POLICY "Managers remove assignments" ON process_assignments FOR DELETE USING (
  is_manager_of_process(process_id)
);

-- =============================================
-- Fix processes SELECT policy (use helper for assignment check)
-- NOTE: INSERT/UPDATE/DELETE policies remain unchanged — only managers can create/edit/delete
-- =============================================

DROP POLICY "View processes" ON processes;
CREATE POLICY "View processes" ON processes FOR SELECT USING (
  manager_id = auth.uid() OR
  is_assigned_to_process(id)
);

-- =============================================
-- Fix checklist_steps policies
-- =============================================

DROP POLICY "View steps" ON checklist_steps;
CREATE POLICY "View steps" ON checklist_steps FOR SELECT USING (
  is_manager_of_process(process_id) OR
  is_assigned_to_process(process_id)
);

-- =============================================
-- Fix executions policies
-- =============================================

DROP POLICY "View executions" ON executions;
CREATE POLICY "View executions" ON executions FOR SELECT USING (
  operator_id = auth.uid() OR
  is_manager_of_process(process_id)
);

DROP POLICY "Operators create executions" ON executions;
CREATE POLICY "Operators create executions" ON executions FOR INSERT WITH CHECK (
  operator_id = auth.uid() AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'operator') AND
  is_assigned_to_process(process_id)
);

-- =============================================
-- Fix help_requests policies
-- =============================================

DROP POLICY "View help requests" ON help_requests;
CREATE POLICY "View help requests" ON help_requests FOR SELECT USING (
  operator_id = auth.uid() OR
  is_manager_of_process(process_id)
);

DROP POLICY "Update help requests" ON help_requests;
CREATE POLICY "Update help requests" ON help_requests FOR UPDATE USING (
  operator_id = auth.uid() OR
  is_manager_of_process(process_id)
);

-- =============================================
-- Fix execution_steps policies
-- =============================================

DROP POLICY "View exec steps" ON execution_steps;
CREATE POLICY "View exec steps" ON execution_steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM executions WHERE id = execution_id AND (
    operator_id = auth.uid() OR
    is_manager_of_process(executions.process_id)
  ))
);
