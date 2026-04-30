-- =============================================
-- Migration 012: Allow managers/admins to delete checklist_steps
--
-- The updateProcess() server action does delete-then-insert when
-- a SOP's checklist changes. Without a DELETE policy, RLS silently
-- blocks the delete (no error, 0 rows), and the subsequent INSERT
-- with the same step_numbers hits the (process_id, step_number)
-- unique constraint.
-- =============================================

DROP POLICY IF EXISTS "Managers delete steps" ON checklist_steps;

CREATE POLICY "Managers delete steps" ON checklist_steps FOR DELETE USING (
  is_manager_of_process(process_id)
);
