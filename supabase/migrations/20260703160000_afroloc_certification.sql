-- AFROLOC address certification as a monetization gate.
--
-- A "certified" address is one an authority (here: a platform moderator/admin)
-- has validated/recognised. It is a binary status on the user's profile, not
-- an auto-computed score. Monetization (creator application + payouts) requires
-- afroloc_certification_status = 'certified'.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS afroloc_certification_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS afroloc_certified_at timestamptz,
  ADD COLUMN IF NOT EXISTS afroloc_certified_by uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_afroloc_certification_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_afroloc_certification_status_check
      CHECK (afroloc_certification_status IN ('none', 'pending', 'certified', 'rejected'));
  END IF;
END $$;

-- A user requests certification of their own AFROLOC address.
CREATE OR REPLACE FUNCTION public.request_afroloc_certification()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_code text;
  v_status text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT afroloc_code, afroloc_certification_status
    INTO v_code, v_status
  FROM public.profiles WHERE id = v_uid;

  IF v_code IS NULL OR v_code = '' THEN
    RETURN json_build_object('success', false, 'error', 'no_address');
  END IF;
  IF v_status = 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'already_pending');
  END IF;
  IF v_status = 'certified' THEN
    RETURN json_build_object('success', false, 'error', 'already_certified');
  END IF;

  UPDATE public.profiles
  SET afroloc_certification_status = 'pending', updated_at = now()
  WHERE id = v_uid;

  RETURN json_build_object('success', true, 'status', 'pending');
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_afroloc_certification() TO authenticated;

-- An authority (moderator/admin) validates or rejects a pending request.
CREATE OR REPLACE FUNCTION public.set_afroloc_certification(p_user_id uuid, p_certified boolean)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.is_moderator_or_admin(v_uid) THEN
    RETURN json_build_object('success', false, 'error', 'forbidden');
  END IF;

  UPDATE public.profiles
  SET
    afroloc_certification_status = CASE WHEN p_certified THEN 'certified' ELSE 'rejected' END,
    afroloc_certified_at = CASE WHEN p_certified THEN now() ELSE NULL END,
    afroloc_certified_by = CASE WHEN p_certified THEN v_uid ELSE NULL END,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_afroloc_certification(uuid, boolean) TO authenticated;
