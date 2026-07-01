-- Fix 1: Add RLS policies for media and voice-messages buckets

-- Media bucket policies
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can view media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Voice messages bucket policies
CREATE POLICY "Authenticated users can upload voice messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-messages' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can view voice messages"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'voice-messages' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own voice messages"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice-messages' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Fix 2: Create secure view for profiles to protect sensitive fields
CREATE OR REPLACE VIEW public.public_profiles 
WITH (security_barrier = true) AS
SELECT 
  id,
  username,
  display_name,
  avatar_url,
  bio,
  status_message,
  is_online,
  is_verified,
  last_seen,
  show_online_status,
  show_last_seen,
  show_typing_indicators,
  show_read_receipts,
  profile_theme_color,
  account_status,
  created_at,
  updated_at,
  -- Only show sensitive fields to the owner
  CASE WHEN auth.uid() = id THEN email ELSE NULL END as email,
  CASE WHEN auth.uid() = id THEN phone_number ELSE NULL END as phone_number,
  CASE WHEN auth.uid() = id THEN birthday ELSE NULL END as birthday,
  CASE WHEN auth.uid() = id THEN gender ELSE NULL END as gender,
  CASE WHEN auth.uid() = id THEN two_factor_enabled ELSE NULL END as two_factor_enabled,
  CASE WHEN auth.uid() = id THEN contacts_synced ELSE NULL END as contacts_synced,
  CASE WHEN auth.uid() = id THEN onboarding_completed ELSE NULL END as onboarding_completed,
  CASE WHEN auth.uid() = id THEN app_tour_completed ELSE NULL END as app_tour_completed
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;