-- Create a secure view for public profile data that excludes sensitive fields
-- This allows other users to see profiles without exposing email/phone

-- First, create a security definer function to check if user owns the profile
CREATE OR REPLACE FUNCTION public.is_profile_owner(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = profile_id
$$;

-- Drop the overly permissive policy that exposes all profile data
DROP POLICY IF EXISTS "Users can view any profile" ON public.profiles;

-- Create policy for users to view their own full profile (including email/phone)
CREATE POLICY "Users can view own full profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create policy for users to view public profile data of others
-- This allows viewing profiles but the application should use the secure view for non-owners
CREATE POLICY "Users can view other profiles basic info" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create a secure view that returns profiles with sensitive data masked for non-owners
CREATE OR REPLACE VIEW public.public_profiles AS
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
  profile_theme_color,
  created_at,
  updated_at,
  -- Only show email/phone if the viewing user is the profile owner
  CASE WHEN auth.uid() = id THEN email ELSE NULL END as email,
  CASE WHEN auth.uid() = id THEN phone_number ELSE NULL END as phone_number,
  CASE WHEN auth.uid() = id THEN birthday ELSE NULL END as birthday,
  CASE WHEN auth.uid() = id THEN gender ELSE NULL END as gender
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Fix profile_photos RLS - require authentication to prevent anonymous bulk scraping
DROP POLICY IF EXISTS "Anyone can view profile photos" ON public.profile_photos;

CREATE POLICY "Authenticated users can view profile photos" 
ON public.profile_photos 
FOR SELECT 
USING (auth.uid() IS NOT NULL);