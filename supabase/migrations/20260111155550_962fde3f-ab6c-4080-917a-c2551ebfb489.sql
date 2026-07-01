-- Enable realtime for profiles table (for online status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;