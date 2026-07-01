-- =============================================
-- YAMILOOK ADVERTISING MODULE - PRIVACY & TARGETING UPDATE
-- =============================================

-- 1) Remove radius columns from advertisements (MVP simplification)
ALTER TABLE public.advertisements 
  DROP COLUMN IF EXISTS target_radius_km,
  DROP COLUMN IF EXISTS target_latitude,
  DROP COLUMN IF EXISTS target_longitude;

-- 2) Add location_market_id for clean targeting
ALTER TABLE public.advertisements 
  ADD COLUMN IF NOT EXISTS target_market_id UUID REFERENCES public.location_markets(id);

-- 3) Remove latitude/longitude from business_profiles targeting
ALTER TABLE public.business_profiles 
  DROP COLUMN IF EXISTS targeting_radius_km;

-- 4) Add default_market_id to business_profiles
ALTER TABLE public.business_profiles 
  ADD COLUMN IF NOT EXISTS default_market_id UUID REFERENCES public.location_markets(id);

-- 5) Create aggregated daily stats table (privacy-preserving)
CREATE TABLE IF NOT EXISTS public.ad_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  market_id UUID REFERENCES public.location_markets(id),
  city TEXT,
  neighborhood TEXT,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  credits_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ad_id, stat_date, market_id)
);

-- Enable RLS on ad_daily_stats
ALTER TABLE public.ad_daily_stats ENABLE ROW LEVEL SECURITY;

-- Advertisers can view their own aggregated stats
CREATE POLICY "Advertisers can view their ad stats"
  ON public.ad_daily_stats FOR SELECT
  USING (
    ad_id IN (
      SELECT a.id FROM public.advertisements a
      JOIN public.business_profiles b ON a.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- 6) Modify ad_impressions to remove personal location data
-- Drop old columns with user GPS
ALTER TABLE public.ad_impressions 
  DROP COLUMN IF EXISTS user_latitude,
  DROP COLUMN IF EXISTS user_longitude;

-- Add market-level location only (privacy-preserving)
ALTER TABLE public.ad_impressions 
  ADD COLUMN IF NOT EXISTS market_id UUID REFERENCES public.location_markets(id),
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- 7) Remove the policy that lets advertisers see per-user impressions
DROP POLICY IF EXISTS "Advertisers can view their ad impressions" ON public.ad_impressions;

-- 8) Create new restricted policy - advertisers can only see aggregated data
-- Individual impressions are for internal system use only
CREATE POLICY "System can record impressions"
  ON public.ad_impressions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- No SELECT policy for advertisers on raw impressions (privacy)
-- They use ad_daily_stats instead

-- 9) Create function to aggregate impressions into daily stats
CREATE OR REPLACE FUNCTION public.aggregate_ad_impression()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert into daily stats
  INSERT INTO public.ad_daily_stats (ad_id, stat_date, market_id, city, neighborhood, impressions, unique_viewers)
  VALUES (NEW.ad_id, CURRENT_DATE, NEW.market_id, NEW.city, NEW.neighborhood, 1, 1)
  ON CONFLICT (ad_id, stat_date, market_id)
  DO UPDATE SET 
    impressions = ad_daily_stats.impressions + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10) Create function to aggregate clicks into daily stats
CREATE OR REPLACE FUNCTION public.aggregate_ad_click()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.ad_daily_stats (ad_id, stat_date, market_id, city, neighborhood, clicks)
  VALUES (
    NEW.ad_id, 
    CURRENT_DATE, 
    (SELECT market_id FROM public.ad_impressions WHERE ad_id = NEW.ad_id LIMIT 1),
    (SELECT city FROM public.ad_impressions WHERE ad_id = NEW.ad_id LIMIT 1),
    (SELECT neighborhood FROM public.ad_impressions WHERE ad_id = NEW.ad_id LIMIT 1),
    1
  )
  ON CONFLICT (ad_id, stat_date, market_id)
  DO UPDATE SET 
    clicks = ad_daily_stats.clicks + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11) Create triggers for aggregation
DROP TRIGGER IF EXISTS trigger_aggregate_impression ON public.ad_impressions;
CREATE TRIGGER trigger_aggregate_impression
  AFTER INSERT ON public.ad_impressions
  FOR EACH ROW
  EXECUTE FUNCTION public.aggregate_ad_impression();

DROP TRIGGER IF EXISTS trigger_aggregate_click ON public.ad_clicks;
CREATE TRIGGER trigger_aggregate_click
  AFTER INSERT ON public.ad_clicks
  FOR EACH ROW
  EXECUTE FUNCTION public.aggregate_ad_click();

-- 12) Create index for efficient stats queries
CREATE INDEX IF NOT EXISTS idx_ad_daily_stats_ad_date ON public.ad_daily_stats(ad_id, stat_date);
CREATE INDEX IF NOT EXISTS idx_ad_daily_stats_market ON public.ad_daily_stats(market_id);

-- 13) Update trigger for ad_daily_stats updated_at
CREATE TRIGGER update_ad_daily_stats_updated_at
  BEFORE UPDATE ON public.ad_daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 14) Add more location markets for better coverage
INSERT INTO public.location_markets (city, neighborhood, display_name, latitude, longitude) VALUES
('Luanda', 'Maculusso', 'Luanda - Maculusso', -8.8250, 13.2400),
('Luanda', 'Alvalade', 'Luanda - Alvalade', -8.8450, 13.2600),
('Luanda', 'Sambizanga', 'Luanda - Sambizanga', -8.8100, 13.2500),
('Luanda', 'Rangel', 'Luanda - Rangel', -8.8350, 13.2700),
('Luanda', 'Cazenga', 'Luanda - Cazenga', -8.8200, 13.3100),
('Luanda', 'Mutamba', 'Luanda - Mutamba', -8.8150, 13.2350)
ON CONFLICT DO NOTHING;