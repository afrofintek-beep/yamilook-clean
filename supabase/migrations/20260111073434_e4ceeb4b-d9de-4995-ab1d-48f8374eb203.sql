-- Add ringtone and call sound settings to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS ringtone_volume NUMERIC DEFAULT 0.5 CHECK (ringtone_volume >= 0 AND ringtone_volume <= 1),
ADD COLUMN IF NOT EXISTS ringtone_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS call_vibration_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ringtone_pattern TEXT DEFAULT 'default' CHECK (ringtone_pattern IN ('default', 'classic', 'modern', 'gentle', 'urgent', 'silent'));