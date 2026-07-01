-- Mentor-specific profile data (separate from general profile)
CREATE TABLE public.mentor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialty text NOT NULL DEFAULT '',
  mentor_bio text,
  is_verified_mentor boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view mentor profiles
CREATE POLICY "Authenticated users can view mentor profiles"
  ON public.mentor_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Mentors can update their own profile
CREATE POLICY "Mentors can update own mentor profile"
  ON public.mentor_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Mentors can insert their own profile
CREATE POLICY "Mentors can insert own mentor profile"
  ON public.mentor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Student reviews for academia sessions
CREATE TABLE public.academia_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.academia_sessions(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, reviewer_id)
);

ALTER TABLE public.academia_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view reviews
CREATE POLICY "Authenticated users can view reviews"
  ON public.academia_reviews FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert reviews for sessions they attended
CREATE POLICY "Users can create reviews"
  ON public.academia_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON public.academia_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewer_id);

-- Auto-create mentor_profile when someone creates an academia session (if not exists)
CREATE OR REPLACE FUNCTION public.ensure_mentor_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.mentor_profiles (user_id)
  VALUES (NEW.mentor_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ensure_mentor_profile
  AFTER INSERT ON public.academia_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_mentor_profile();