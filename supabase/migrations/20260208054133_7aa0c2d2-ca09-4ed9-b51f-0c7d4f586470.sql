
-- ============================================
-- MODERATION SYSTEM: Reports + Actions Audit
-- ============================================

-- Report categories enum
CREATE TYPE public.report_category AS ENUM (
  'spam',
  'harassment',
  'hate_speech',
  'nudity',
  'violence',
  'misinformation',
  'impersonation',
  'other'
);

-- Report status enum
CREATE TYPE public.report_status AS ENUM (
  'pending',
  'reviewing',
  'resolved',
  'dismissed'
);

-- Moderation action type enum
CREATE TYPE public.moderation_action_type AS ENUM (
  'hide_post',
  'unhide_post',
  'delete_post',
  'hide_comment',
  'unhide_comment',
  'delete_comment',
  'warn_user',
  'suspend_user',
  'unsuspend_user',
  'ban_user',
  'unban_user',
  'dismiss_report',
  'resolve_report'
);

-- ============================================
-- Content Reports Table
-- ============================================
CREATE TABLE public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Polymorphic target
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user', 'ritmo', 'status')),
  target_id UUID NOT NULL,
  category report_category NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  -- Resolution
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying pending reports
CREATE INDEX idx_content_reports_status ON public.content_reports(status);
CREATE INDEX idx_content_reports_target ON public.content_reports(target_type, target_id);
CREATE INDEX idx_content_reports_reporter ON public.content_reports(reporter_id);

-- ============================================
-- Moderation Actions (Audit Log)
-- ============================================
CREATE TABLE public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL REFERENCES auth.users(id),
  action_type moderation_action_type NOT NULL,
  -- What was acted upon
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user', 'ritmo', 'status')),
  target_id UUID NOT NULL,
  -- Link to report if action came from a report
  report_id UUID REFERENCES public.content_reports(id),
  reason TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_moderation_actions_moderator ON public.moderation_actions(moderator_id);
CREATE INDEX idx_moderation_actions_target ON public.moderation_actions(target_type, target_id);
CREATE INDEX idx_moderation_actions_created ON public.moderation_actions(created_at DESC);

-- ============================================
-- Add is_hidden column to posts for soft-hide
-- ============================================
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hidden_reason TEXT;

-- Add is_hidden to post_comments
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Add suspension fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- Reports: users can create their own reports
CREATE POLICY "Users can create reports"
  ON public.content_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Reports: users can view their own reports
CREATE POLICY "Users can view own reports"
  ON public.content_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Reports: admins and moderators can view all reports
CREATE POLICY "Moderators can view all reports"
  ON public.content_reports FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'moderator')
  );

-- Reports: admins and moderators can update reports (resolve/dismiss)
CREATE POLICY "Moderators can update reports"
  ON public.content_reports FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'moderator')
  );

-- Audit log: admins and moderators can insert
CREATE POLICY "Moderators can log actions"
  ON public.moderation_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = moderator_id AND (
      public.has_role(auth.uid(), 'admin') OR 
      public.has_role(auth.uid(), 'moderator')
    )
  );

-- Audit log: admins can view all actions (for auditing moderators)
CREATE POLICY "Admins can view all moderation actions"
  ON public.moderation_actions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Audit log: moderators can view their own actions
CREATE POLICY "Moderators can view own actions"
  ON public.moderation_actions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = moderator_id AND 
    public.has_role(auth.uid(), 'moderator')
  );

-- Updated_at trigger for reports
CREATE TRIGGER update_content_reports_updated_at
  BEFORE UPDATE ON public.content_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for reports (moderators see new reports live)
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_reports;

-- ============================================
-- Helper function: check if user is moderator or admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id
    AND role IN ('admin', 'moderator')
  )
$$;
