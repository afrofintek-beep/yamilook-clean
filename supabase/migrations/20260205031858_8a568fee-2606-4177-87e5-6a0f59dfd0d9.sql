-- Add location columns to profiles for "Banda" (community location)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'AO',
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles (country_code, city, neighborhood);

-- Update RLS policy to allow users to update their own location
-- (existing policy already allows users to update their own profile)