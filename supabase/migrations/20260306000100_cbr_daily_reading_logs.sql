-- Daily Reading Log for CBR (365-day tracker)
CREATE TABLE IF NOT EXISTS public.cbr_daily_reading_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  reading_date date NOT NULL,
  bible_book text NOT NULL,
  passage text NOT NULL,
  reflection text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, program_id, reading_date)
);

ALTER TABLE public.cbr_daily_reading_logs ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_cbr_daily_reading_logs_updated_at
  BEFORE UPDATE ON public.cbr_daily_reading_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- RLS policies (members can manage their own logs)
CREATE POLICY "cbr_daily_logs_select_own" ON public.cbr_daily_reading_logs
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_any_admin_role(auth.uid())
  );

CREATE POLICY "cbr_daily_logs_insert_own" ON public.cbr_daily_reading_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.program_enrollments pe
      WHERE pe.user_id = auth.uid()
        AND pe.program_id = cbr_daily_reading_logs.program_id
        AND pe.status IN ('active', 'completed')
    )
  );

CREATE POLICY "cbr_daily_logs_update_own" ON public.cbr_daily_reading_logs
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_any_admin_role(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "cbr_daily_logs_delete_own" ON public.cbr_daily_reading_logs
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_any_admin_role(auth.uid()));

-- Recompute enrollment progress from daily entries.
-- Progress % = (days_logged / 365) * 100, capped at 100.
CREATE OR REPLACE FUNCTION public.recompute_cbr_daily_progress(_user_id uuid, _program_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  days_logged int;
  pct numeric;
BEGIN
  SELECT COUNT(*)::int
  INTO days_logged
  FROM public.cbr_daily_reading_logs
  WHERE user_id = _user_id
    AND program_id = _program_id;

  pct := LEAST(100, (days_logged::numeric / 365) * 100);

  UPDATE public.program_enrollments pe
  SET
    progress = CASE WHEN days_logged >= 365 THEN 100 ELSE pct END,
    status = CASE
      WHEN pe.status = 'withdrawn' THEN pe.status
      WHEN days_logged >= 365 THEN 'completed'
      ELSE 'active'
    END,
    completed_at = CASE
      WHEN pe.status = 'withdrawn' THEN pe.completed_at
      WHEN days_logged >= 365 THEN COALESCE(pe.completed_at, now())
      ELSE NULL
    END
  WHERE pe.user_id = _user_id
    AND pe.program_id = _program_id
    AND pe.status <> 'withdrawn';
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_cbr_daily_logs_sync_enrollment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_cbr_daily_progress(OLD.user_id, OLD.program_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF (OLD.user_id <> NEW.user_id) OR (OLD.program_id <> NEW.program_id) THEN
      PERFORM public.recompute_cbr_daily_progress(OLD.user_id, OLD.program_id);
    END IF;
    PERFORM public.recompute_cbr_daily_progress(NEW.user_id, NEW.program_id);
    RETURN NEW;
  END IF;

  -- INSERT
  PERFORM public.recompute_cbr_daily_progress(NEW.user_id, NEW.program_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cbr_daily_logs_sync_enrollment ON public.cbr_daily_reading_logs;
CREATE TRIGGER trg_cbr_daily_logs_sync_enrollment
  AFTER INSERT OR UPDATE OR DELETE ON public.cbr_daily_reading_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_cbr_daily_logs_sync_enrollment();

-- Ensure CBR program requires full completion (365 days => 100%).
UPDATE public.programs
SET completion_threshold = 100
WHERE slug = 'cbr';

