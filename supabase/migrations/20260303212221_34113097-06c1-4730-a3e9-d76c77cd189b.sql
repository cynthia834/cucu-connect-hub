
ALTER TABLE public.secretary_reports ADD COLUMN IF NOT EXISTS attachment_url text;

INSERT INTO storage.buckets (id, name, public) VALUES ('report-attachments', 'report-attachments', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload report attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'report-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view report attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'report-attachments');

CREATE POLICY "Users can delete own report attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'report-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
