
-- Mission team members (roles per mission)
CREATE TABLE public.mission_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  team_role TEXT NOT NULL DEFAULT 'volunteer',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mission_id, user_id)
);

ALTER TABLE public.mission_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mission_team_select" ON public.mission_team_members FOR SELECT USING (true);
CREATE POLICY "mission_team_insert" ON public.mission_team_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'missions_leader'::app_role)
    OR has_any_admin_role(auth.uid())
  );
CREATE POLICY "mission_team_update" ON public.mission_team_members FOR UPDATE
  USING (has_role(auth.uid(), 'missions_leader'::app_role) OR has_any_admin_role(auth.uid()));
CREATE POLICY "mission_team_delete" ON public.mission_team_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'missions_leader'::app_role)
    OR has_any_admin_role(auth.uid())
  );

-- Post-mission reports
CREATE TABLE public.mission_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL,
  souls_reached INTEGER DEFAULT 0,
  salvations INTEGER DEFAULT 0,
  followups TEXT,
  challenges TEXT,
  testimonies TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mission_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mission_reports_select" ON public.mission_reports FOR SELECT USING (true);
CREATE POLICY "mission_reports_insert" ON public.mission_reports FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'missions_leader'::app_role) OR has_any_admin_role(auth.uid()));
CREATE POLICY "mission_reports_update" ON public.mission_reports FOR UPDATE
  USING (has_role(auth.uid(), 'missions_leader'::app_role) OR has_any_admin_role(auth.uid()));

-- Add columns to missions
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS mission_type TEXT NOT NULL DEFAULT 'campus';
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS target_group TEXT;

-- Trigger for updated_at
CREATE TRIGGER update_mission_reports_updated_at
  BEFORE UPDATE ON public.mission_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
