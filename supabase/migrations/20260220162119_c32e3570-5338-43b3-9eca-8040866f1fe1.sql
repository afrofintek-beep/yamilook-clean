
-- Tabela de candidatos MVP
CREATE TABLE public.mvp_candidates (
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

-- Índices
CREATE UNIQUE INDEX idx_mvp_candidates_email ON public.mvp_candidates(email);
CREATE INDEX idx_mvp_candidates_status ON public.mvp_candidates(status);
CREATE INDEX idx_mvp_candidates_access_code ON public.mvp_candidates(access_code);

-- Enable RLS
ALTER TABLE public.mvp_candidates ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver e gerir candidatos
CREATE POLICY "Admins can manage MVP candidates"
  ON public.mvp_candidates
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Candidatos anônimos podem submeter candidatura (insert público)
CREATE POLICY "Anyone can submit candidacy"
  ON public.mvp_candidates
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND access_code IS NULL
    AND code_used = false
  );

-- Função para gerar código de acesso único
CREATE OR REPLACE FUNCTION public.generate_mvp_access_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..4 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    result := result || '-';
    FOR i IN 1..4 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;

    SELECT EXISTS(SELECT 1 FROM public.mvp_candidates WHERE access_code = result) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN result;
END;
$$;

-- Função para aprovar candidato e gerar código (chamada pelo admin)
CREATE OR REPLACE FUNCTION public.approve_mvp_candidate(p_candidate_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_candidate RECORD;
BEGIN
  -- Verificar se é admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Gerar código único
  v_code := public.generate_mvp_access_code();

  -- Atualizar candidato
  UPDATE public.mvp_candidates
  SET
    status = 'approved',
    access_code = v_code,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_candidate_id AND status = 'pending'
  RETURNING * INTO v_candidate;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Candidate not found or already reviewed');
  END IF;

  RETURN json_build_object(
    'success', true,
    'access_code', v_code,
    'candidate_email', v_candidate.email,
    'candidate_name', v_candidate.full_name
  );
END;
$$;

-- Função para rejeitar candidato
CREATE OR REPLACE FUNCTION public.reject_mvp_candidate(p_candidate_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;

  UPDATE public.mvp_candidates
  SET
    status = 'rejected',
    rejection_reason = p_reason,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_candidate_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Candidate not found or already reviewed');
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

-- Função para validar código de acesso no registo
CREATE OR REPLACE FUNCTION public.validate_mvp_access_code(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_candidate RECORD;
BEGIN
  SELECT * INTO v_candidate
  FROM public.mvp_candidates
  WHERE access_code = UPPER(TRIM(p_code));

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Código inválido');
  END IF;

  IF v_candidate.status != 'approved' THEN
    RETURN json_build_object('valid', false, 'error', 'Código não está ativo');
  END IF;

  IF v_candidate.code_used THEN
    RETURN json_build_object('valid', false, 'error', 'Este código já foi utilizado');
  END IF;

  RETURN json_build_object(
    'valid', true,
    'candidate_id', v_candidate.id,
    'full_name', v_candidate.full_name,
    'email', v_candidate.email
  );
END;
$$;

-- Função para marcar código como utilizado após registo bem-sucedido
CREATE OR REPLACE FUNCTION public.consume_mvp_access_code(p_code TEXT, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.mvp_candidates
  SET
    code_used = true,
    code_used_at = now(),
    code_used_by = p_user_id,
    updated_at = now()
  WHERE access_code = UPPER(TRIM(p_code))
    AND status = 'approved'
    AND code_used = false;

  RETURN FOUND;
END;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_mvp_candidates_updated_at
  BEFORE UPDATE ON public.mvp_candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
