
-- 1. Allow self-enrollment on program_enrollments
DROP POLICY IF EXISTS "enrollments_insert" ON public.program_enrollments;
CREATE POLICY "enrollments_insert" ON public.program_enrollments
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'docket_leader'::app_role) OR has_any_admin_role(auth.uid()));

-- 2. Add year_joined_cu to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year_joined_cu integer;

-- 3. Create secretary_reports table
CREATE TABLE IF NOT EXISTS public.secretary_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.secretary_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_insert" ON public.secretary_reports
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "reports_select_own" ON public.secretary_reports
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "reports_select_admin" ON public.secretary_reports
FOR SELECT TO authenticated
USING (has_any_admin_role(auth.uid()));

CREATE TRIGGER update_secretary_reports_updated_at
BEFORE UPDATE ON public.secretary_reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
