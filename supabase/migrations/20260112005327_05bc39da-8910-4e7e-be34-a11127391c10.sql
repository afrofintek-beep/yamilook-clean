-- Fix the SECURITY DEFINER view warning by using SECURITY INVOKER instead
-- Drop and recreate the view with correct security setting

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
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

-- Set the view to use SECURITY INVOKER (uses caller's permissions, not definer's)
ALTER VIEW public.public_profiles SET (security_invoker = on);

-- Grant access to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;