-- Add notifications_enabled column to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN notifications_enabled boolean NOT NULL DEFAULT true;