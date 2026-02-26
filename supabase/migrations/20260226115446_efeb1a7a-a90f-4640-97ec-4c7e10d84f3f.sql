
-- Create ministry_members table for tracking ministry membership
CREATE TABLE public.ministry_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ministry_id, user_id)
);

ALTER TABLE public.ministry_members ENABLE ROW LEVEL SECURITY;

-- Anyone can see ministry members
CREATE POLICY "ministry_members_select" ON public.ministry_members
FOR SELECT USING (true);

-- Users can join ministries themselves
CREATE POLICY "ministry_members_insert" ON public.ministry_members
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can leave, admins can remove
CREATE POLICY "ministry_members_delete" ON public.ministry_members
FOR DELETE USING (user_id = auth.uid() OR has_any_admin_role(auth.uid()));
