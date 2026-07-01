-- Enable REPLICA IDENTITY FULL on typing_indicators so UPDATE events carry full row data
ALTER TABLE public.typing_indicators REPLICA IDENTITY FULL;