-- FASE MVP: inscrição fechada. O RegisterForm já pedia um código de acesso
-- (validate/consume_mvp_access_code) mas a tabela/RPCs não existiam na BD
-- live (drift da migração Lovable). Este migration:
--   1) restaura mvp_candidates + funções originais (migração 20260220162119);
--   2) validate/consume aceitam TAMBÉM códigos de convite (profiles.referral_code)
--      — membros do MVP convidam diretamente pelo link/código deles;
--   3) handle_new_user passa a EXIGIR um código válido (gate no servidor,
--      cobre também chamadas diretas à API) e liga referred_by quando o
--      código é de um membro.

-- ═══ 1) Tabela e funções originais ═══
CREATE TABLE IF NOT EXISTS public.mvp_candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  country TEXT DEFAULT 'Angola',
  motivation TEXT,
  social_handle TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  access_code TEXT UNIQUE,
  code_used BOOLEAN DEFAULT false,
  code_used_at TIMESTAMPTZ,
  code_used_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  invite_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mvp_candidates_email ON public.mvp_candidates(email);
CREATE INDEX IF NOT EXISTS idx_mvp_candidates_status ON public.mvp_candidates(status);
CREATE INDEX IF NOT EXISTS idx_mvp_candidates_access_code ON public.mvp_candidates(access_code);

ALTER TABLE public.mvp_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage MVP candidates" ON public.mvp_candidates;
CREATE POLICY "Admins can manage MVP candidates"
  ON public.mvp_candidates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can submit candidacy" ON public.mvp_candidates;
CREATE POLICY "Anyone can submit candidacy"
  ON public.mvp_candidates FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND access_code IS NULL AND code_used = false);

CREATE OR REPLACE FUNCTION public.generate_mvp_access_code()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := ''; i INTEGER; code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..4 LOOP result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1); END LOOP;
    result := result || '-';
    FOR i IN 1..4 LOOP result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1); END LOOP;
    SELECT EXISTS(SELECT 1 FROM public.mvp_candidates WHERE access_code = result) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.approve_mvp_candidate(p_candidate_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_code TEXT; v_candidate RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;
  v_code := public.generate_mvp_access_code();
  UPDATE public.mvp_candidates
     SET status = 'approved', access_code = v_code, reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
   WHERE id = p_candidate_id AND status = 'pending'
  RETURNING * INTO v_candidate;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Candidate not found or already reviewed');
  END IF;
  RETURN json_build_object('success', true, 'access_code', v_code,
    'candidate_email', v_candidate.email, 'candidate_name', v_candidate.full_name);
END $$;

CREATE OR REPLACE FUNCTION public.reject_mvp_candidate(p_candidate_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;
  UPDATE public.mvp_candidates
     SET status = 'rejected', rejection_reason = p_reason, reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
   WHERE id = p_candidate_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Candidate not found or already reviewed');
  END IF;
  RETURN json_build_object('success', true);
END $$;

-- ═══ 2) Validar/consumir: código MVP OU código de convite de um membro ═══
CREATE OR REPLACE FUNCTION public.validate_mvp_access_code(p_code TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_candidate RECORD; v_member RECORD;
BEGIN
  -- código de convite de um membro (multi-uso)
  SELECT id, display_name INTO v_member FROM public.profiles
   WHERE upper(referral_code) = upper(trim(p_code)) LIMIT 1;
  IF FOUND THEN
    RETURN json_build_object('valid', true, 'referral', true, 'member_name', v_member.display_name);
  END IF;

  -- código MVP clássico (uso único, emitido por admin)
  SELECT * INTO v_candidate FROM public.mvp_candidates WHERE access_code = upper(trim(p_code));
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Código inválido');
  END IF;
  IF v_candidate.status != 'approved' THEN
    RETURN json_build_object('valid', false, 'error', 'Código não está ativo');
  END IF;
  IF v_candidate.code_used THEN
    RETURN json_build_object('valid', false, 'error', 'Este código já foi utilizado');
  END IF;
  RETURN json_build_object('valid', true, 'candidate_id', v_candidate.id,
    'full_name', v_candidate.full_name, 'email', v_candidate.email);
END $$;

CREATE OR REPLACE FUNCTION public.consume_mvp_access_code(p_code TEXT, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- código de convite: multi-uso, nada a consumir
  IF EXISTS (SELECT 1 FROM public.profiles WHERE upper(referral_code) = upper(trim(p_code))) THEN
    RETURN true;
  END IF;
  UPDATE public.mvp_candidates
     SET code_used = true, code_used_at = now(), code_used_by = p_user_id, updated_at = now()
   WHERE access_code = upper(trim(p_code)) AND status = 'approved' AND code_used = false;
  RETURN FOUND;
END $$;

-- ═══ 3) GATE no servidor: registo exige código válido ═══
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ref text; v_access text; v_referrer uuid; v_ok boolean := false;
BEGIN
  v_ref := trim(coalesce(NEW.raw_user_meta_data->>'ref', ''));
  v_access := trim(coalesce(NEW.raw_user_meta_data->>'access_code', ''));

  -- (a) código de convite via link ?ref=
  IF v_ref <> '' THEN
    SELECT id INTO v_referrer FROM public.profiles
     WHERE upper(referral_code) = upper(v_ref) AND id <> NEW.id LIMIT 1;
    IF v_referrer IS NOT NULL THEN v_ok := true; END IF;
  END IF;

  -- (b) código digitado no formulário: convite de membro OU código MVP aprovado
  IF NOT v_ok AND v_access <> '' THEN
    SELECT id INTO v_referrer FROM public.profiles
     WHERE upper(referral_code) = upper(v_access) AND id <> NEW.id LIMIT 1;
    IF v_referrer IS NOT NULL THEN
      v_ok := true;
    ELSIF EXISTS (
      SELECT 1 FROM public.mvp_candidates
       WHERE access_code = upper(v_access) AND status = 'approved' AND code_used = false
    ) THEN
      v_ok := true;
    END IF;
  END IF;

  -- (c) contas de teste internas continuam a funcionar
  IF NOT v_ok AND NEW.email LIKE '%@yamilook.test' THEN v_ok := true; END IF;

  IF NOT v_ok THEN
    RAISE EXCEPTION 'YAMILOOK_MVP_ONLY: inscrição por convite; lançamento público brevemente';
  END IF;

  INSERT INTO public.profiles (id, email, display_name, username, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    v_referrer
  );

  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);

  RETURN NEW;
END $$;
