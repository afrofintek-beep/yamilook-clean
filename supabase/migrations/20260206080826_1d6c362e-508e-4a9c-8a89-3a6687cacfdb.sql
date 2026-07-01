
-- Add journey visibility setting (reuses the same levels as show_banda)
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS journey_visibility text NOT NULL DEFAULT 'everyone';

COMMENT ON COLUMN public.user_settings.journey_visibility IS 'Controls who can see the Yamilook Journey: everyone, friends, close_friends, nobody';
