
-- ============================================
-- SISTEMA DE STRIKES (Avisos por violação)
-- ============================================

-- Enum for violation categories (more granular than report_category)
DO $$ BEGIN
  CREATE TYPE public.violation_category AS ENUM (
    'hate_speech',
    'bullying',
    'harassment',
    'nudity',
    'sexual_content',
    'violence',
    'graphic_violence',
    'spam',
    'scam',
    'misinformation',
    'impersonation',
    'intellectual_property',
    'self_harm',
    'illegal_activity',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enum for strike status
DO $$ BEGIN
  CREATE TYPE public.strike_status AS ENUM (
    'active',
    'expired',
    'appealed',
    'revoked'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enum for appeal status  
DO $$ BEGIN
  CREATE TYPE public.appeal_status AS ENUM (
    'pending',
    'under_review',
    'approved',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Strikes table
CREATE TABLE IF NOT EXISTS public.user_strikes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  issued_by UUID NOT NULL,
  report_id UUID REFERENCES public.content_reports(id),
  violation_category public.violation_category NOT NULL,
  severity INT NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 3),
  reason TEXT NOT NULL,
  evidence_url TEXT,
  content_type TEXT, -- 'post', 'comment', 'message', 'profile'
  content_id TEXT,
  status public.strike_status NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  revoked_by UUID,
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-actions config: what happens at N strikes
CREATE TABLE IF NOT EXISTS public.strike_thresholds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strike_count INT NOT NULL UNIQUE,
  action_type TEXT NOT NULL, -- 'warning', 'suspend_24h', 'suspend_7d', 'suspend_30d', 'ban'
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default thresholds (Instagram-style)
INSERT INTO public.strike_thresholds (strike_count, action_type, description) VALUES
  (1, 'warning', 'Aviso formal — o conteúdo foi removido'),
  (2, 'suspend_24h', 'Suspensão temporária de 24 horas'),
  (3, 'suspend_7d', 'Suspensão de 7 dias — funcionalidades limitadas'),
  (4, 'suspend_30d', 'Suspensão de 30 dias'),
  (5, 'ban', 'Banimento permanente da plataforma')
ON CONFLICT (strike_count) DO NOTHING;

-- ============================================
-- SISTEMA DE APELAÇÕES
-- ============================================

CREATE TABLE IF NOT EXISTS public.moderation_appeals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  strike_id UUID REFERENCES public.user_strikes(id),
  report_id UUID REFERENCES public.content_reports(id),
  appeal_type TEXT NOT NULL, -- 'strike', 'content_removal', 'suspension', 'ban'
  reason TEXT NOT NULL,
  evidence_text TEXT,
  evidence_url TEXT,
  status public.appeal_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- NOTIFICAÇÕES DE MODERAÇÃO (Transparência)
-- ============================================

CREATE TABLE IF NOT EXISTS public.moderation_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'content_removed', 'strike_issued', 'suspension', 'appeal_result', 'strike_expired'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_strike_id UUID REFERENCES public.user_strikes(id),
  related_appeal_id UUID REFERENCES public.moderation_appeals(id),
  action_url TEXT, -- deep link to appeal page, etc.
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.user_strikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strike_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_notifications ENABLE ROW LEVEL SECURITY;

-- user_strikes: moderators/admins can manage, users can view their own
CREATE POLICY "Users can view own strikes"
  ON public.user_strikes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Moderators can view all strikes"
  ON public.user_strikes FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin(auth.uid()));

CREATE POLICY "Moderators can issue strikes"
  ON public.user_strikes FOR INSERT TO authenticated
  WITH CHECK (public.is_moderator_or_admin(auth.uid()));

CREATE POLICY "Moderators can update strikes"
  ON public.user_strikes FOR UPDATE TO authenticated
  USING (public.is_moderator_or_admin(auth.uid()));

-- strike_thresholds: admins manage, everyone can read
CREATE POLICY "Anyone can read thresholds"
  ON public.strike_thresholds FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage thresholds"
  ON public.strike_thresholds FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- moderation_appeals: users submit their own, moderators review all
CREATE POLICY "Users can view own appeals"
  ON public.moderation_appeals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit appeals"
  ON public.moderation_appeals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Moderators can view all appeals"
  ON public.moderation_appeals FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin(auth.uid()));

CREATE POLICY "Moderators can update appeals"
  ON public.moderation_appeals FOR UPDATE TO authenticated
  USING (public.is_moderator_or_admin(auth.uid()));

-- moderation_notifications: users see their own
CREATE POLICY "Users can view own notifications"
  ON public.moderation_notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.moderation_notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Moderators can insert notifications"
  ON public.moderation_notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_moderator_or_admin(auth.uid()));

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_user_strikes_updated_at
  BEFORE UPDATE ON public.user_strikes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_moderation_appeals_updated_at
  BEFORE UPDATE ON public.moderation_appeals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_strikes_user_id ON public.user_strikes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_strikes_status ON public.user_strikes(status);
CREATE INDEX IF NOT EXISTS idx_moderation_appeals_user_id ON public.moderation_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_appeals_status ON public.moderation_appeals(status);
CREATE INDEX IF NOT EXISTS idx_moderation_notifications_user_id ON public.moderation_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_notifications_read ON public.moderation_notifications(user_id, is_read);
