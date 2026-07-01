-- Add banda visibility privacy setting
-- Values: 'everyone', 'friends', 'close_friends', 'nobody'
ALTER TABLE public.user_settings
ADD COLUMN show_banda text NOT NULL DEFAULT 'everyone';