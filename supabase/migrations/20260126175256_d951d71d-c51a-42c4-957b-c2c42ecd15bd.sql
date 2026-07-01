-- Add recording support for Rodas
ALTER TABLE public.rodas 
ADD COLUMN IF NOT EXISTS recording_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS recording_status TEXT CHECK (recording_status IN ('idle', 'recording', 'paused', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS recording_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS recording_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS recording_completed_at TIMESTAMP WITH TIME ZONE;

-- Create table for roda recordings (similar to call_recordings but for Rodas)
CREATE TABLE IF NOT EXISTS public.roda_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roda_id UUID NOT NULL REFERENCES public.rodas(id) ON DELETE CASCADE,
  palco_id UUID NOT NULL REFERENCES public.palcos(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'recording', 'paused', 'stopped', 'processing', 'completed', 'failed')),
  storage_path TEXT,
  file_size_bytes BIGINT,
  duration_seconds INTEGER,
  has_transcription BOOLEAN NOT NULL DEFAULT false,
  transcription_text TEXT,
  retention_days INTEGER DEFAULT 90,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.roda_recordings ENABLE ROW LEVEL SECURITY;

-- Policies: Guide can manage their own recordings
CREATE POLICY "Guides can manage their roda recordings"
ON public.roda_recordings
FOR ALL
USING (
  initiated_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.palcos p
    WHERE p.id = palco_id AND p.guide_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.palcos p
    WHERE p.id = palco_id AND p.guide_id = auth.uid()
  )
);

-- Public can view completed recordings (if palco is public)
CREATE POLICY "Public can view completed recordings"
ON public.roda_recordings
FOR SELECT
USING (
  status = 'completed' AND
  EXISTS (
    SELECT 1 FROM public.palcos p
    WHERE p.id = palco_id AND p.visibility = 'public'
  )
);

-- Create storage bucket for roda recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('roda-recordings', 'roda-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for roda recordings
CREATE POLICY "Guides can upload roda recordings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'roda-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Guides can view their recordings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'roda-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Guides can delete their recordings"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'roda-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable realtime for roda_recordings
ALTER PUBLICATION supabase_realtime ADD TABLE public.roda_recordings;