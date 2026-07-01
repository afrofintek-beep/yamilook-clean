-- Add photos_visibility enum type
CREATE TYPE public.photos_visibility AS ENUM ('everyone', 'friends', 'nobody');

-- Add photos_visibility column to profiles
ALTER TABLE public.profiles 
ADD COLUMN photos_visibility public.photos_visibility DEFAULT 'friends';

-- Update profile_photos RLS policy to respect owner's visibility setting
DROP POLICY IF EXISTS "Authenticated users can view profile photos" ON public.profile_photos;

CREATE POLICY "View profile photos based on owner settings" 
ON public.profile_photos 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Owner can always see their own photos
    auth.uid() = user_id
    OR
    -- Check owner's visibility setting
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profile_photos.user_id
      AND (
        -- Everyone can see
        p.photos_visibility = 'everyone'
        OR
        -- Friends can see (check if viewer is a friend)
        (p.photos_visibility = 'friends' AND EXISTS (
          SELECT 1 FROM public.contacts c
          WHERE c.user_id = auth.uid()
          AND c.contact_user_id = profile_photos.user_id
          AND c.is_blocked = false
        ))
      )
    )
  )
);