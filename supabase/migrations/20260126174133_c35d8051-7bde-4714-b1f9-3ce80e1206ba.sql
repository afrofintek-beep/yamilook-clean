-- Create enum for palco type (standard vs premium)
CREATE TYPE public.palco_type AS ENUM ('standard', 'premium');

-- Create enum for artistic category
CREATE TYPE public.artistic_category AS ENUM ('singer', 'comedian', 'performer', 'influencer');

-- Add new columns to palcos table for premium model (excluding max_voices_per_roda which already exists)
ALTER TABLE public.palcos
ADD COLUMN palco_type public.palco_type NOT NULL DEFAULT 'standard',
ADD COLUMN artistic_category public.artistic_category,
ADD COLUMN allow_custom_pricing BOOLEAN DEFAULT false,
ADD COLUMN suggested_min_price NUMERIC(10,2),
ADD COLUMN suggested_max_price NUMERIC(10,2);

-- Create table for category-specific pricing tiers
CREATE TABLE public.palco_category_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category public.artistic_category NOT NULL UNIQUE,
  tier_name TEXT NOT NULL,
  suggested_email_price NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  suggested_live_price NUMERIC(10,2) NOT NULL DEFAULT 25.00,
  suggested_highlight_price NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  min_price NUMERIC(10,2) NOT NULL DEFAULT 5.00,
  max_price NUMERIC(10,2) NOT NULL DEFAULT 500.00,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.palco_category_pricing ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read category pricing (public data)
CREATE POLICY "Category pricing is publicly readable"
  ON public.palco_category_pricing FOR SELECT
  USING (true);

-- Only admins can manage category pricing
CREATE POLICY "Admins can manage category pricing"
  ON public.palco_category_pricing FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default pricing tiers for each category
INSERT INTO public.palco_category_pricing (category, tier_name, suggested_email_price, suggested_live_price, suggested_highlight_price, min_price, max_price, description)
VALUES 
  ('singer', 'Músicos & Cantores', 15.00, 50.00, 150.00, 10.00, 1000.00, 'Faixas de preço para artistas musicais'),
  ('comedian', 'Humoristas & Comediantes', 10.00, 35.00, 100.00, 5.00, 500.00, 'Faixas de preço para artistas de comédia'),
  ('performer', 'Atores & Performers', 12.00, 40.00, 120.00, 8.00, 750.00, 'Faixas de preço para performers e atores'),
  ('influencer', 'Influenciadores & Criadores', 8.00, 25.00, 75.00, 3.00, 300.00, 'Faixas de preço para criadores de conteúdo');

-- Add max_voices column to rodas table (per-session limit)
ALTER TABLE public.rodas
ADD COLUMN IF NOT EXISTS max_voices INTEGER;

-- Create index for faster queries
CREATE INDEX idx_palcos_type ON public.palcos(palco_type);
CREATE INDEX idx_palcos_category ON public.palcos(artistic_category);

-- Add trigger for updated_at on category pricing
CREATE TRIGGER update_palco_category_pricing_updated_at
  BEFORE UPDATE ON public.palco_category_pricing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();