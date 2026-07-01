-- Fix typing_indicators so Realtime UPDATE events include all columns (user_id, updated_at, etc.)
ALTER TABLE public.typing_indicators REPLICA IDENTITY FULL;