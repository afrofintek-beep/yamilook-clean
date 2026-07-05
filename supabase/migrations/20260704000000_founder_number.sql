-- "Membros Fundadores" — the first 100 users of the network are recognised
-- with a "Fundador #N" badge (rendered by ProfileBadges via profiles.founder_number).

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS founder_number integer;

-- Backfill: the first 100 profiles by signup order get 1..100.
WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn FROM public.profiles
)
UPDATE public.profiles p
SET founder_number = r.rn
FROM ranked r
WHERE p.id = r.id AND r.rn <= 100 AND p.founder_number IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_founder_number_key
  ON public.profiles(founder_number) WHERE founder_number IS NOT NULL;

-- New signups get the next founder number until 100 are assigned; after that, none.
CREATE OR REPLACE FUNCTION public.assign_founder_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next integer;
BEGIN
  IF NEW.founder_number IS NOT NULL THEN
    RETURN NEW;
  END IF;
  SELECT COALESCE(max(founder_number), 0) + 1 INTO v_next FROM public.profiles;
  IF v_next <= 100 THEN
    NEW.founder_number := v_next;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_founder ON public.profiles;
CREATE TRIGGER trg_assign_founder
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_founder_number();
