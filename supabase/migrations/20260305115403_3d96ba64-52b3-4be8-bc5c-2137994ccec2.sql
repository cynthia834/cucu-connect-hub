
-- CBR Reading Progress table
CREATE TABLE public.cbr_reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cbr_plan_id uuid REFERENCES public.cbr_plans(id) ON DELETE CASCADE NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, cbr_plan_id)
);

ALTER TABLE public.cbr_reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cbr_progress_select" ON public.cbr_reading_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_any_admin_role(auth.uid()));

CREATE POLICY "cbr_progress_insert" ON public.cbr_reading_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "cbr_progress_update" ON public.cbr_reading_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Support Tickets table
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets_select_own" ON public.support_tickets FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "tickets_select_admin" ON public.support_tickets FOR SELECT TO authenticated
  USING (has_any_admin_role(auth.uid()));

CREATE POLICY "tickets_insert" ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at on support_tickets
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
