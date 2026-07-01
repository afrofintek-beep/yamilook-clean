
-- creator_verification_docs: link between applications and uploaded documents
CREATE TABLE IF NOT EXISTS public.creator_verification_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.creator_applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  doc_type text NOT NULL DEFAULT 'bi',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_verification_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own docs"
  ON public.creator_verification_docs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own docs"
  ON public.creator_verification_docs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all docs"
  ON public.creator_verification_docs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for creator-documents bucket (owner can upload, admins can read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-documents', 'creator-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'creator-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'creator-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins read all docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'creator-documents' AND public.has_role(auth.uid(), 'admin'));
