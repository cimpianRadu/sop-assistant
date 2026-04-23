-- Version history for SOP processes.
-- Snapshots are inserted from the app (updateProcess action) whenever a real
-- change is detected, alongside the existing processes.current_version bump.
-- Keeping the write in app code (not a trigger) because we already compare
-- state there and skip no-op saves.

CREATE TABLE IF NOT EXISTS public.process_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sop_text TEXT NOT NULL,
  steps_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (process_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_process_versions_process_id
  ON public.process_versions (process_id, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_process_versions_org_id
  ON public.process_versions (org_id);

ALTER TABLE public.process_versions ENABLE ROW LEVEL SECURITY;

-- SELECT: any org member can read the history of their org's processes.
CREATE POLICY "pv_select_by_org"
  ON public.process_versions FOR SELECT
  USING (org_id = public.get_user_org_id());

-- INSERT: only admins/managers of the owning org can snapshot.
CREATE POLICY "pv_insert_by_admin_or_manager"
  ON public.process_versions FOR INSERT
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND (public.has_org_role('admin') OR public.has_org_role('manager'))
  );

-- No UPDATE / DELETE policies: versions are immutable history. (CASCADE on
-- process delete still cleans them up.)
