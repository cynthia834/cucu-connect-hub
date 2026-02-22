
-- Broadcast logs table for ICT module
CREATE TABLE public.broadcast_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'youtube',
  livestream_url TEXT,
  event_id UUID REFERENCES public.events(id),
  broadcast_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.broadcast_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broadcast_select" ON public.broadcast_logs FOR SELECT USING (true);
CREATE POLICY "broadcast_insert" ON public.broadcast_logs FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'ict_leader'::app_role) OR has_any_admin_role(auth.uid())
);
CREATE POLICY "broadcast_update" ON public.broadcast_logs FOR UPDATE USING (
  has_role(auth.uid(), 'ict_leader'::app_role) OR has_any_admin_role(auth.uid())
);

CREATE TRIGGER update_broadcast_logs_updated_at BEFORE UPDATE ON public.broadcast_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
