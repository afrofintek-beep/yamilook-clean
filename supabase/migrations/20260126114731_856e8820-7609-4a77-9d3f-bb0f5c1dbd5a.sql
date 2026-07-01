-- PALCO Module Tables

-- Palcos (stages/shows)
CREATE TABLE public.palcos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  theme TEXT,
  description TEXT,
  cover_url TEXT,
  language TEXT NOT NULL DEFAULT 'PT',
  location TEXT DEFAULT 'Angola',
  tags TEXT[] DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'live', 'ended', 'archived')),
  max_voices_per_roda INTEGER DEFAULT 20,
  allow_custom_voice_text BOOLEAN DEFAULT true,
  allow_ai_assist BOOLEAN DEFAULT false,
  min_price NUMERIC(10,2) DEFAULT 1.00,
  total_rodas INTEGER DEFAULT 0,
  total_voices INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rodas (sessions within a Palco)
CREATE TABLE public.rodas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palco_id UUID NOT NULL REFERENCES public.palcos(id) ON DELETE CASCADE,
  title TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  phase TEXT NOT NULL DEFAULT 'scheduled' CHECK (phase IN ('scheduled', 'content', 'qa', 'ended')),
  qa_start_at TIMESTAMPTZ,
  livekit_room_name TEXT,
  viewer_count INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Voice types (pricing options for questions)
CREATE TABLE public.palco_voice_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palco_id UUID NOT NULL REFERENCES public.palcos(id) ON DELETE CASCADE,
  voice_type TEXT NOT NULL CHECK (voice_type IN ('email', 'live', 'highlight')),
  enabled BOOLEAN DEFAULT true,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  delivery_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(palco_id, voice_type)
);

-- Vozes (questions/interactions)
CREATE TABLE public.vozes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roda_id UUID NOT NULL REFERENCES public.rodas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  voice_type TEXT NOT NULL CHECK (voice_type IN ('email', 'live', 'highlight')),
  custom_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'queued', 'answered', 'refunded')),
  payment_ref TEXT,
  payment_method TEXT,
  amount_paid NUMERIC(10,2),
  currency TEXT DEFAULT 'EUR',
  answered_at TIMESTAMPTZ,
  answer_text TEXT,
  answer_audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roda participants (plateia/audience)
CREATE TABLE public.roda_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roda_id UUID NOT NULL REFERENCES public.rodas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('guide', 'co_guide', 'viewer')),
  has_paid_qa BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  UNIQUE(roda_id, user_id)
);

-- Stage rental payments
CREATE TABLE public.palco_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palco_id UUID NOT NULL REFERENCES public.palcos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  model TEXT NOT NULL DEFAULT 'fixed_per_palco',
  fixed_fee NUMERIC(10,2) DEFAULT 25.00,
  fee_per_roda NUMERIC(10,2) DEFAULT 10.00,
  percent_of_sales NUMERIC(5,2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed')),
  payment_ref TEXT,
  invoice_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.palcos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rodas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palco_voice_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vozes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roda_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palco_rentals ENABLE ROW LEVEL SECURITY;

-- Palcos policies
CREATE POLICY "Anyone can view public palcos" ON public.palcos
  FOR SELECT USING (visibility = 'public' OR guide_id = auth.uid());

CREATE POLICY "Guides can manage their palcos" ON public.palcos
  FOR ALL USING (guide_id = auth.uid()) WITH CHECK (guide_id = auth.uid());

-- Rodas policies
CREATE POLICY "Anyone can view rodas of public palcos" ON public.rodas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.palcos WHERE id = palco_id AND (visibility = 'public' OR guide_id = auth.uid()))
  );

CREATE POLICY "Guides can manage their rodas" ON public.rodas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.palcos WHERE id = palco_id AND guide_id = auth.uid())
  );

-- Voice types policies
CREATE POLICY "Anyone can view voice types" ON public.palco_voice_types
  FOR SELECT USING (true);

CREATE POLICY "Guides can manage their voice types" ON public.palco_voice_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.palcos WHERE id = palco_id AND guide_id = auth.uid())
  );

-- Vozes policies
CREATE POLICY "Users can view their own vozes" ON public.vozes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Guides can view vozes for their rodas" ON public.vozes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rodas r 
      JOIN public.palcos p ON r.palco_id = p.id 
      WHERE r.id = roda_id AND p.guide_id = auth.uid()
    )
  );

CREATE POLICY "Users can submit vozes" ON public.vozes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their pending vozes" ON public.vozes
  FOR UPDATE USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Guides can update vozes in their rodas" ON public.vozes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.rodas r 
      JOIN public.palcos p ON r.palco_id = p.id 
      WHERE r.id = roda_id AND p.guide_id = auth.uid()
    )
  );

-- Roda participants policies
CREATE POLICY "Anyone can view roda participants" ON public.roda_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join rodas" ON public.roda_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave rodas" ON public.roda_participants
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can update their participation" ON public.roda_participants
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Guides can update participants in their rodas" ON public.roda_participants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.rodas r 
      JOIN public.palcos p ON r.palco_id = p.id 
      WHERE r.id = roda_id AND p.guide_id = auth.uid()
    )
  );

-- Palco rentals policies
CREATE POLICY "Users can view their own rentals" ON public.palco_rentals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create rentals" ON public.palco_rentals
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rodas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vozes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.roda_participants;

-- Triggers for updated_at
CREATE TRIGGER update_palcos_updated_at
  BEFORE UPDATE ON public.palcos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rodas_updated_at
  BEFORE UPDATE ON public.rodas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vozes_updated_at
  BEFORE UPDATE ON public.vozes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();