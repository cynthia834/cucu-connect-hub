
-- Subcoms table
CREATE TABLE public.subcoms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subcom members (exactly 7 per subcom)
CREATE TABLE public.subcom_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcom_id UUID NOT NULL REFERENCES public.subcoms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role_title TEXT NOT NULL DEFAULT 'Member',
  responsibilities TEXT,
  display_order INTEGER NOT NULL DEFAULT 1 CHECK (display_order BETWEEN 1 AND 7),
  contact_visible BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(subcom_id, user_id),
  UNIQUE(subcom_id, display_order)
);

-- Subcom audit log
CREATE TABLE public.subcom_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcom_id UUID NOT NULL REFERENCES public.subcoms(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subcoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcom_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: can edit subcom (ministry chairperson, docket leader, super admin)
CREATE OR REPLACE FUNCTION public.can_edit_subcom(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'cu_chairperson', 'ministry_chairperson', 'docket_leader')
  )
$$;

-- Subcoms policies
CREATE POLICY "subcoms_select" ON public.subcoms FOR SELECT USING (true);
CREATE POLICY "subcoms_insert" ON public.subcoms FOR INSERT WITH CHECK (can_edit_subcom(auth.uid()));
CREATE POLICY "subcoms_update" ON public.subcoms FOR UPDATE USING (can_edit_subcom(auth.uid()));
CREATE POLICY "subcoms_delete" ON public.subcoms FOR DELETE USING (can_edit_subcom(auth.uid()));

-- Subcom members policies
CREATE POLICY "subcom_members_select" ON public.subcom_members FOR SELECT USING (true);
CREATE POLICY "subcom_members_insert" ON public.subcom_members FOR INSERT WITH CHECK (can_edit_subcom(auth.uid()));
CREATE POLICY "subcom_members_update" ON public.subcom_members FOR UPDATE USING (can_edit_subcom(auth.uid()));
CREATE POLICY "subcom_members_delete" ON public.subcom_members FOR DELETE USING (can_edit_subcom(auth.uid()));

-- Audit log: read-only for admins, auto-inserted via trigger
CREATE POLICY "subcom_audit_select" ON public.subcom_audit_log FOR SELECT USING (can_edit_subcom(auth.uid()));

-- Trigger for audit logging on subcom_members changes
CREATE OR REPLACE FUNCTION public.log_subcom_member_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subcom_audit_log (subcom_id, action, old_values, new_values, performed_by)
  VALUES (
    COALESCE(NEW.subcom_id, OLD.subcom_id),
    TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000')
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER subcom_member_audit
AFTER INSERT OR UPDATE OR DELETE ON public.subcom_members
FOR EACH ROW EXECUTE FUNCTION public.log_subcom_member_change();

-- Updated_at triggers
CREATE TRIGGER update_subcoms_updated_at BEFORE UPDATE ON public.subcoms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_subcom_members_updated_at BEFORE UPDATE ON public.subcom_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
