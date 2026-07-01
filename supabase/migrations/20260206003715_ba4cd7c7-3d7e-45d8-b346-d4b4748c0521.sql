
-- 1.1 Bandas
CREATE TABLE IF NOT EXISTS public.bandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  country text DEFAULT 'Angola',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS bandas_unique_name_city
ON public.bandas (lower(name), lower(coalesce(city,'')), lower(coalesce(country,'')));

-- 1.2 User ↔ Banda (1 banda ativa por user)
CREATE TABLE IF NOT EXISTS public.user_bandas (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banda_id uuid NOT NULL REFERENCES public.bandas(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  is_active boolean NOT NULL DEFAULT true,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, banda_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS user_one_active_banda
ON public.user_bandas (user_id)
WHERE is_active = true;

-- RLS
ALTER TABLE public.bandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bandas ENABLE ROW LEVEL SECURITY;

-- Bandas: readable by all authenticated users
CREATE POLICY "Bandas are viewable by authenticated users"
ON public.bandas FOR SELECT
TO authenticated
USING (true);

-- Bandas: only admins can insert (or via edge function)
CREATE POLICY "Authenticated users can create bandas"
ON public.bandas FOR INSERT
TO authenticated
WITH CHECK (true);

-- User_bandas: users can see their own memberships
CREATE POLICY "Users can view their own banda memberships"
ON public.user_bandas FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- User_bandas: users can join a banda
CREATE POLICY "Users can join a banda"
ON public.user_bandas FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- User_bandas: users can update their own membership
CREATE POLICY "Users can update their own banda membership"
ON public.user_bandas FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- User_bandas: users can leave a banda
CREATE POLICY "Users can leave a banda"
ON public.user_bandas FOR DELETE
TO authenticated
USING (user_id = auth.uid());
