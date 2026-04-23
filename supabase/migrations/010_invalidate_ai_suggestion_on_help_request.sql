-- Invalidate the cached AI suggestion whenever a help_request for the same
-- process is created, updated (e.g. escalated, resolved) or deleted.
-- The next manager visit will then trigger a fresh AI call.

CREATE OR REPLACE FUNCTION public.invalidate_process_ai_suggestion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.process_ai_suggestions
  WHERE process_id = COALESCE(NEW.process_id, OLD.process_id);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS help_requests_invalidate_suggestion ON public.help_requests;

CREATE TRIGGER help_requests_invalidate_suggestion
  AFTER INSERT OR UPDATE OR DELETE ON public.help_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.invalidate_process_ai_suggestion();
