-- Add journey visibility settings to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS show_journey_friends BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_journey_posts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_journey_momambos BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_journey_messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_journey_calls BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_journey_reactions BOOLEAN DEFAULT true;