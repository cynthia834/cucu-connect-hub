
-- Fix overly permissive giving insert policy
DROP POLICY "giving_insert" ON public.giving_records;
CREATE POLICY "giving_insert" ON public.giving_records FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR is_anonymous = true);
