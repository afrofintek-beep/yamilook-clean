
-- Drop existing policies that may conflict, then recreate
DROP POLICY IF EXISTS "Anyone can view public rodas" ON public.rodas;
DROP POLICY IF EXISTS "Admins can create rodas" ON public.rodas;
DROP POLICY IF EXISTS "Organizers can update their rodas" ON public.rodas;
DROP POLICY IF EXISTS "Users can create their own palcos" ON public.palcos;
DROP POLICY IF EXISTS "Guides can view vozes for their palcos" ON public.vozes;
DROP POLICY IF EXISTS "Guides can update vozes in their palcos" ON public.vozes;
DROP POLICY IF EXISTS "Organizers can update roda participants" ON public.roda_participants;

-- Rodas: anyone can view public rodas
CREATE POLICY "Anyone can view public rodas"
ON public.rodas FOR SELECT
USING (visibility IS NULL OR visibility = 'public');

-- Rodas: only admins can create
CREATE POLICY "Admins can create rodas"
ON public.rodas FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Rodas: organizer or admin can update
CREATE POLICY "Organizers can update their rodas"
ON public.rodas FOR UPDATE TO authenticated
USING (organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Palcos: authenticated users can create
CREATE POLICY "Users can create their own palcos"
ON public.palcos FOR INSERT TO authenticated
WITH CHECK (guide_id = auth.uid());

-- Vozes: guides can view vozes for palcos they own
CREATE POLICY "Guides can view vozes for their palcos"
ON public.vozes FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.palcos p
    WHERE p.guide_id = auth.uid()
    AND p.roda_id = vozes.roda_id
  )
  OR user_id = auth.uid()
);

-- Vozes: guides can update vozes in their palcos
CREATE POLICY "Guides can update vozes in their palcos"
ON public.vozes FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.palcos p
    WHERE p.guide_id = auth.uid()
    AND p.roda_id = vozes.roda_id
  )
);

-- Roda participants: organizer or admin can update
CREATE POLICY "Organizers can update roda participants"
ON public.roda_participants FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rodas r
    WHERE r.id = roda_participants.roda_id
    AND (r.organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);
