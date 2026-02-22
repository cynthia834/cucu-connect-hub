
-- 1. Enum
CREATE TYPE public.app_role AS ENUM (
  'super_admin','cu_chairperson','ministry_chairperson','docket_leader',
  'finance_leader','assets_leader','ict_leader','missions_leader',
  'welfare_officer','content_moderator','cell_group_leader',
  'finance_subcommittee','assets_subcommittee','general_member','visitor'
);

-- 2. Utility function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- 3. All tables
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '', email TEXT, phone TEXT, bio TEXT,
  avatar_url TEXT, student_id TEXT, year_of_study INT, department TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL, assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT,
  completion_threshold NUMERIC NOT NULL DEFAULT 90, is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_programs BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.program_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  enrolled_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn')),
  progress NUMERIC NOT NULL DEFAULT 0, enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, program_id)
);
ALTER TABLE public.program_enrollments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, description TEXT, event_type TEXT NOT NULL DEFAULT 'general',
  location TEXT, start_date TIMESTAMPTZ NOT NULL, end_date TIMESTAMPTZ,
  is_livestreamed BOOLEAN DEFAULT false, livestream_url TEXT,
  created_by UUID REFERENCES auth.users(id), is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_events BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.ministries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, description TEXT, leader_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_ministries BEFORE UPDATE ON public.ministries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.testimonies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, content TEXT NOT NULL, user_id UUID REFERENCES auth.users(id) NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false, approved_by UUID REFERENCES auth.users(id), approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.testimonies ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_testimonies BEFORE UPDATE ON public.testimonies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.welfare_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','under_review','approved','resolved','rejected')),
  resolved_by UUID REFERENCES auth.users(id), resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.welfare_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_welfare BEFORE UPDATE ON public.welfare_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.finance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('income','expenditure')),
  category TEXT NOT NULL, description TEXT NOT NULL, amount NUMERIC(12,2) NOT NULL,
  reference_number TEXT, transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  is_submitted BOOLEAN NOT NULL DEFAULT false, submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id), approved_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','flagged')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_finance BEFORE UPDATE ON public.finance_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.finance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES public.finance_entries(id) NOT NULL,
  action TEXT NOT NULL, old_values JSONB, new_values JSONB,
  performed_by UUID REFERENCES auth.users(id) NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_audit_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.giving_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), amount NUMERIC(12,2) NOT NULL,
  giving_type TEXT NOT NULL DEFAULT 'tithe' CHECK (giving_type IN ('tithe','offering','seed','fundraiser','other')),
  payment_method TEXT, payment_reference TEXT, is_anonymous BOOLEAN NOT NULL DEFAULT false,
  giving_date DATE NOT NULL DEFAULT CURRENT_DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.giving_records ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, description TEXT, asset_type TEXT NOT NULL, serial_number TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','allocated','maintenance','disposed','lost')),
  condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('new','good','fair','poor','damaged')),
  assigned_to UUID REFERENCES auth.users(id), location TEXT,
  purchase_date DATE, purchase_price NUMERIC(12,2), depreciation_rate NUMERIC(5,2) DEFAULT 0,
  finance_entry_id UUID REFERENCES public.finance_entries(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_assets BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.asset_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id) NOT NULL,
  action TEXT NOT NULL, old_values JSONB, new_values JSONB,
  performed_by UUID REFERENCES auth.users(id) NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.asset_audit_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, description TEXT, location TEXT,
  start_date DATE, end_date DATE, target_souls INT DEFAULT 0, souls_reached INT DEFAULT 0,
  target_amount NUMERIC(12,2) DEFAULT 0, raised_amount NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','active','completed','cancelled')),
  led_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_missions BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.service_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, content TEXT NOT NULL,
  update_type TEXT NOT NULL DEFAULT 'announcement' CHECK (update_type IN ('announcement','sermon','devotional','blog')),
  is_published BOOLEAN NOT NULL DEFAULT false, published_at TIMESTAMPTZ,
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_updates ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_service_updates BEFORE UPDATE ON public.service_updates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.cbr_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.programs(id),
  title TEXT NOT NULL, week_number INT NOT NULL, scripture_reference TEXT, content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cbr_plans ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_cbr BEFORE UPDATE ON public.cbr_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL, description TEXT, is_anonymous BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','answered','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_prayer BEFORE UPDATE ON public.prayer_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. Helper functions (after all tables exist)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_any_admin_role(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin','cu_chairperson','ministry_chairperson','docket_leader'))
$$;

CREATE OR REPLACE FUNCTION public.has_finance_role(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin','cu_chairperson','finance_leader','finance_subcommittee'))
$$;

CREATE OR REPLACE FUNCTION public.has_assets_role(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin','cu_chairperson','assets_leader','assets_subcommittee'))
$$;

CREATE OR REPLACE FUNCTION public.is_enrolled(_user_id UUID, _program_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.program_enrollments WHERE user_id = _user_id AND program_id = _program_id AND status = 'active')
$$;

-- 5. Triggers for audit
CREATE OR REPLACE FUNCTION public.log_finance_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.finance_audit_log (entry_id, action, old_values, new_values, performed_by)
  VALUES (COALESCE(NEW.id, OLD.id), TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'));
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER finance_audit AFTER INSERT OR UPDATE ON public.finance_entries FOR EACH ROW EXECUTE FUNCTION public.log_finance_change();

CREATE OR REPLACE FUNCTION public.log_asset_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.asset_audit_log (asset_id, action, old_values, new_values, performed_by)
  VALUES (COALESCE(NEW.id, OLD.id), TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'));
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER asset_audit AFTER INSERT OR UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.log_asset_change();

-- 6. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'general_member');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. RLS Policies
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "roles_select" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "roles_insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_any_admin_role(auth.uid()));
CREATE POLICY "roles_update" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_any_admin_role(auth.uid()));
CREATE POLICY "roles_delete" ON public.user_roles FOR DELETE TO authenticated USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "programs_select" ON public.programs FOR SELECT USING (true);
CREATE POLICY "programs_insert" ON public.programs FOR INSERT TO authenticated WITH CHECK (public.has_any_admin_role(auth.uid()));
CREATE POLICY "programs_update" ON public.programs FOR UPDATE TO authenticated USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "enrollments_select" ON public.program_enrollments FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "enrollments_insert" ON public.program_enrollments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'docket_leader') OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "enrollments_update" ON public.program_enrollments FOR UPDATE TO authenticated USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "events_select_public" ON public.events FOR SELECT USING (is_published = true);
CREATE POLICY "events_select_admin" ON public.events FOR SELECT TO authenticated USING (public.has_any_admin_role(auth.uid()));
CREATE POLICY "events_insert" ON public.events FOR INSERT TO authenticated WITH CHECK (public.has_any_admin_role(auth.uid()));
CREATE POLICY "events_update" ON public.events FOR UPDATE TO authenticated USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "ministries_select" ON public.ministries FOR SELECT USING (true);
CREATE POLICY "ministries_insert" ON public.ministries FOR INSERT TO authenticated WITH CHECK (public.has_any_admin_role(auth.uid()));
CREATE POLICY "ministries_update" ON public.ministries FOR UPDATE TO authenticated USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "testimonies_select_approved" ON public.testimonies FOR SELECT USING (is_approved = true);
CREATE POLICY "testimonies_select_own" ON public.testimonies FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "testimonies_select_mod" ON public.testimonies FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'content_moderator') OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "testimonies_insert" ON public.testimonies FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "testimonies_update" ON public.testimonies FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'content_moderator') OR public.has_any_admin_role(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "welfare_select_own" ON public.welfare_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "welfare_select_officer" ON public.welfare_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'welfare_officer') OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "welfare_insert" ON public.welfare_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "welfare_update" ON public.welfare_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'welfare_officer') OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "finance_select" ON public.finance_entries FOR SELECT TO authenticated USING (public.has_finance_role(auth.uid()));
CREATE POLICY "finance_insert" ON public.finance_entries FOR INSERT TO authenticated WITH CHECK (public.has_finance_role(auth.uid()));
CREATE POLICY "finance_update" ON public.finance_entries FOR UPDATE TO authenticated USING (public.has_finance_role(auth.uid()) AND status = 'draft');
CREATE POLICY "finance_audit_select" ON public.finance_audit_log FOR SELECT TO authenticated USING (public.has_finance_role(auth.uid()));

CREATE POLICY "giving_select" ON public.giving_records FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_finance_role(auth.uid()));
CREATE POLICY "giving_insert" ON public.giving_records FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "assets_select" ON public.assets FOR SELECT TO authenticated USING (public.has_assets_role(auth.uid()));
CREATE POLICY "assets_insert" ON public.assets FOR INSERT TO authenticated WITH CHECK (public.has_assets_role(auth.uid()));
CREATE POLICY "assets_update" ON public.assets FOR UPDATE TO authenticated USING (public.has_assets_role(auth.uid()));
CREATE POLICY "asset_audit_select" ON public.asset_audit_log FOR SELECT TO authenticated USING (public.has_assets_role(auth.uid()));

CREATE POLICY "missions_select" ON public.missions FOR SELECT USING (true);
CREATE POLICY "missions_insert" ON public.missions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'missions_leader') OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "missions_update" ON public.missions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'missions_leader') OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "updates_select" ON public.service_updates FOR SELECT USING (is_published = true);
CREATE POLICY "updates_insert" ON public.service_updates FOR INSERT TO authenticated WITH CHECK (public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'content_moderator'));
CREATE POLICY "updates_update" ON public.service_updates FOR UPDATE TO authenticated USING (public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'content_moderator'));

CREATE POLICY "cbr_select" ON public.cbr_plans FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.program_enrollments pe WHERE pe.user_id = auth.uid() AND pe.program_id = cbr_plans.program_id)
  OR public.has_any_admin_role(auth.uid())
);
CREATE POLICY "cbr_insert" ON public.cbr_plans FOR INSERT TO authenticated WITH CHECK (public.has_any_admin_role(auth.uid()));
CREATE POLICY "cbr_update" ON public.cbr_plans FOR UPDATE TO authenticated USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "prayer_select" ON public.prayer_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "prayer_insert" ON public.prayer_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "prayer_update" ON public.prayer_requests FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 8. Seed programs
INSERT INTO public.programs (name, slug, description) VALUES
  ('Consistent Bible Reading', 'cbr', 'Daily Bible reading program with structured plans'),
  ('Bible Study', 'bible-study', 'In-depth group Bible study sessions'),
  ('Faith Foundation', 'faith-foundation', 'Foundational Christian faith teachings'),
  ('BEST-P', 'best-p', 'Biblical Empowerment and Strategic Training Program');
