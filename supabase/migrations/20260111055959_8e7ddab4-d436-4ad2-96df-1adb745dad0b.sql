-- =============================================
-- YAMILOOK ADVERTISING MODULE
-- Hyperlocal advertising for small businesses
-- =============================================

-- Enum for ad status
CREATE TYPE public.ad_status AS ENUM ('draft', 'pending_review', 'active', 'paused', 'completed', 'rejected');

-- Enum for ad type
CREATE TYPE public.ad_type AS ENUM ('promoted_post', 'business_profile', 'sponsored_story');

-- Enum for credit transaction type
CREATE TYPE public.credit_transaction_type AS ENUM ('purchase', 'spend', 'refund', 'bonus', 'adjustment');

-- =============================================
-- Business Profiles for Advertisers
-- =============================================
CREATE TABLE public.business_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_category TEXT,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  neighborhood TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  targeting_radius_km NUMERIC(5, 2) DEFAULT 5.0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  credit_balance INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_profiles
CREATE POLICY "Users can view all active business profiles"
  ON public.business_profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can manage their own business profile"
  ON public.business_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Credit Transactions (Virtual Currency)
-- =============================================
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  transaction_type public.credit_transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  reference_id UUID,
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.business_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own credit transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.business_profiles WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- Advertisements / Campaigns
-- =============================================
CREATE TABLE public.advertisements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  ad_type public.ad_type NOT NULL,
  status public.ad_status NOT NULL DEFAULT 'draft',
  
  -- Content reference
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  
  -- Ad content (for profile/story ads)
  title TEXT,
  description TEXT,
  media_url TEXT,
  call_to_action TEXT,
  cta_url TEXT,
  
  -- Targeting
  target_city TEXT,
  target_neighborhood TEXT,
  target_latitude NUMERIC(10, 7),
  target_longitude NUMERIC(10, 7),
  target_radius_km NUMERIC(5, 2) DEFAULT 5.0,
  target_age_min INTEGER,
  target_age_max INTEGER,
  target_gender TEXT[],
  
  -- Budget & Schedule
  daily_budget INTEGER NOT NULL DEFAULT 100,
  total_budget INTEGER NOT NULL DEFAULT 500,
  spent_credits INTEGER DEFAULT 0,
  cost_per_impression INTEGER DEFAULT 1,
  cost_per_click INTEGER DEFAULT 5,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Performance metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_count INTEGER DEFAULT 0,
  
  -- Review
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for advertisements
CREATE POLICY "Users can view active ads"
  ON public.advertisements FOR SELECT
  USING (status = 'active' OR business_id IN (
    SELECT id FROM public.business_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Advertisers can manage their own ads"
  ON public.advertisements FOR ALL
  USING (
    business_id IN (
      SELECT id FROM public.business_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.business_profiles WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- Ad Impressions (for analytics & billing)
-- =============================================
CREATE TABLE public.ad_impressions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  impression_type TEXT NOT NULL DEFAULT 'view',
  user_latitude NUMERIC(10, 7),
  user_longitude NUMERIC(10, 7),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ad_impressions
CREATE POLICY "Advertisers can view their ad impressions"
  ON public.ad_impressions FOR SELECT
  USING (
    ad_id IN (
      SELECT a.id FROM public.advertisements a
      JOIN public.business_profiles b ON a.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can record impressions"
  ON public.ad_impressions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- Ad Clicks (for analytics & billing)
-- =============================================
CREATE TABLE public.ad_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  click_type TEXT NOT NULL DEFAULT 'cta',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ad_clicks
CREATE POLICY "Advertisers can view their ad clicks"
  ON public.ad_clicks FOR SELECT
  USING (
    ad_id IN (
      SELECT a.id FROM public.advertisements a
      JOIN public.business_profiles b ON a.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can record clicks"
  ON public.ad_clicks FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- Location Markets (predefined areas)
-- =============================================
CREATE TABLE public.location_markets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL DEFAULT 'AO',
  city TEXT NOT NULL,
  neighborhood TEXT,
  display_name TEXT NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.location_markets ENABLE ROW LEVEL SECURITY;

-- Public read access for location markets
CREATE POLICY "Anyone can view active location markets"
  ON public.location_markets FOR SELECT
  USING (is_active = true);

-- =============================================
-- Seed initial location markets (Angola)
-- =============================================
INSERT INTO public.location_markets (city, neighborhood, display_name, latitude, longitude) VALUES
('Luanda', 'Maianga', 'Luanda - Maianga', -8.8383, 13.2344),
('Luanda', 'Ingombota', 'Luanda - Ingombota', -8.8147, 13.2302),
('Luanda', 'Talatona', 'Luanda - Talatona', -8.9167, 13.1833),
('Luanda', 'Kilamba', 'Luanda - Kilamba', -8.9500, 13.2167),
('Luanda', 'Viana', 'Luanda - Viana', -8.9000, 13.3667),
('Luanda', 'Cacuaco', 'Luanda - Cacuaco', -8.7833, 13.3667),
('Benguela', NULL, 'Benguela', -12.5763, 13.4055),
('Lobito', NULL, 'Lobito', -12.3647, 13.5364),
('Huambo', NULL, 'Huambo', -12.7761, 15.7392),
('Lubango', NULL, 'Lubango', -14.9167, 13.5000),
('Cabinda', NULL, 'Cabinda', -5.5500, 12.2000),
('Malanje', NULL, 'Malanje', -9.5402, 16.3410);

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX idx_business_profiles_user ON public.business_profiles(user_id);
CREATE INDEX idx_business_profiles_location ON public.business_profiles(city, neighborhood);
CREATE INDEX idx_advertisements_business ON public.advertisements(business_id);
CREATE INDEX idx_advertisements_status ON public.advertisements(status);
CREATE INDEX idx_advertisements_type ON public.advertisements(ad_type);
CREATE INDEX idx_advertisements_dates ON public.advertisements(starts_at, ends_at);
CREATE INDEX idx_ad_impressions_ad ON public.ad_impressions(ad_id);
CREATE INDEX idx_ad_impressions_date ON public.ad_impressions(created_at);
CREATE INDEX idx_ad_clicks_ad ON public.ad_clicks(ad_id);

-- =============================================
-- Triggers for updated_at
-- =============================================
CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_advertisements_updated_at
  BEFORE UPDATE ON public.advertisements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Function to update ad metrics
-- =============================================
CREATE OR REPLACE FUNCTION public.increment_ad_impressions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.advertisements
  SET impressions = impressions + 1,
      spent_credits = spent_credits + cost_per_impression
  WHERE id = NEW.ad_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_ad_clicks()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.advertisements
  SET clicks = clicks + 1,
      spent_credits = spent_credits + cost_per_click
  WHERE id = NEW.ad_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_increment_impressions
  AFTER INSERT ON public.ad_impressions
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_ad_impressions();

CREATE TRIGGER trigger_increment_clicks
  AFTER INSERT ON public.ad_clicks
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_ad_clicks();