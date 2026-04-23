-- AI-generated smart suggestions for SOPs. Cached per process, TTL enforced in app.

CREATE TABLE IF NOT EXISTS public.process_ai_suggestions (
  process_id uuid PRIMARY KEY REFERENCES public.processes(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  suggestion jsonb NOT NULL,
  based_on_count integer NOT NULL DEFAULT 0,
  generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS process_ai_suggestions_org_id_idx
  ON public.process_ai_suggestions (org_id);

ALTER TABLE public.process_ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Managers + admins of the owning org can read/write. Operators have no access.
CREATE POLICY "pas_select_by_org"
  ON public.process_ai_suggestions FOR SELECT
  USING (
    org_id = public.get_user_org_id()
    AND (public.has_org_role('admin') OR public.has_org_role('manager'))
  );

CREATE POLICY "pas_insert_by_org"
  ON public.process_ai_suggestions FOR INSERT
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND (public.has_org_role('admin') OR public.has_org_role('manager'))
  );

CREATE POLICY "pas_update_by_org"
  ON public.process_ai_suggestions FOR UPDATE
  USING (
    org_id = public.get_user_org_id()
    AND (public.has_org_role('admin') OR public.has_org_role('manager'))
  )
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND (public.has_org_role('admin') OR public.has_org_role('manager'))
  );

CREATE POLICY "pas_delete_by_org"
  ON public.process_ai_suggestions FOR DELETE
  USING (
    org_id = public.get_user_org_id()
    AND (public.has_org_role('admin') OR public.has_org_role('manager'))
  );
