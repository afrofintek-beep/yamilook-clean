
-- 1. Index on profiles(kumbu_lifetime DESC) for ranking queries
CREATE INDEX IF NOT EXISTS idx_profiles_kumbu_lifetime ON public.profiles (kumbu_lifetime DESC);

-- 2. Append-only: block UPDATE and DELETE on kumbu_ledger
CREATE POLICY "No updates on ledger" ON public.kumbu_ledger
FOR UPDATE TO authenticated USING (false);

CREATE POLICY "No deletes on ledger" ON public.kumbu_ledger
FOR DELETE TO authenticated USING (false);

-- Block INSERT from client (only service_role / SECURITY DEFINER functions can insert)
CREATE POLICY "No client inserts on ledger" ON public.kumbu_ledger
FOR INSERT TO authenticated WITH CHECK (false);

-- 3. kumbu_award function (server-side only, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.kumbu_award(
  p_user_id uuid,
  p_amount integer,
  p_action_type text,
  p_source text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_daily_total integer;
  v_daily_max integer := 40;
  v_action_count integer;
  v_action_limit integer;
  v_new_available integer;
  v_new_lifetime integer;
  v_new_level text;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Check daily cap (40 Kumbu/day) - exclude weekly_bonus from cap
  IF p_action_type != 'weekly_bonus' THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
    FROM public.kumbu_ledger
    WHERE user_id = p_user_id
      AND amount > 0
      AND action_type != 'weekly_bonus'
      AND created_at >= CURRENT_DATE;

    IF v_daily_total >= v_daily_max THEN
      RETURN json_build_object('success', false, 'error', 'Daily earning limit reached (40 Kumbu)');
    END IF;

    -- Cap amount to not exceed daily limit
    IF v_daily_total + p_amount > v_daily_max THEN
      p_amount := v_daily_max - v_daily_total;
    END IF;
  END IF;

  -- Check per-action daily/monthly limits
  CASE p_action_type
    WHEN 'roda_join' THEN
      v_action_limit := 3;
      SELECT COUNT(*) INTO v_action_count FROM public.kumbu_ledger
      WHERE user_id = p_user_id AND action_type = 'roda_join' AND amount > 0 AND created_at >= CURRENT_DATE;
    WHEN 'roda_create' THEN
      v_action_limit := 2;
      SELECT COUNT(*) INTO v_action_count FROM public.kumbu_ledger
      WHERE user_id = p_user_id AND action_type = 'roda_create' AND amount > 0 AND created_at >= CURRENT_DATE;
    WHEN 'academia_session' THEN
      v_action_limit := 1;
      SELECT COUNT(*) INTO v_action_count FROM public.kumbu_ledger
      WHERE user_id = p_user_id AND action_type = 'academia_session' AND amount > 0 AND created_at >= CURRENT_DATE;
    WHEN 'referral' THEN
      v_action_limit := 5;
      SELECT COUNT(*) INTO v_action_count FROM public.kumbu_ledger
      WHERE user_id = p_user_id AND action_type = 'referral' AND amount > 0
        AND created_at >= date_trunc('month', CURRENT_DATE);
    WHEN 'post_create' THEN
      v_action_limit := 3;
      SELECT COUNT(*) INTO v_action_count FROM public.kumbu_ledger
      WHERE user_id = p_user_id AND action_type = 'post_create' AND amount > 0 AND created_at >= CURRENT_DATE;
    ELSE
      v_action_limit := NULL;
      v_action_count := 0;
  END CASE;

  IF v_action_limit IS NOT NULL AND v_action_count >= v_action_limit THEN
    RETURN json_build_object('success', false, 'error', format('Action limit reached for %s', p_action_type));
  END IF;

  -- Insert ledger entry
  INSERT INTO public.kumbu_ledger (user_id, amount, action_type, source, reference_id, description)
  VALUES (p_user_id, p_amount, p_action_type, p_source, p_reference_id, p_description);

  -- Update profile balances and level
  UPDATE public.profiles
  SET
    kumbu_available = kumbu_available + p_amount,
    kumbu_lifetime = kumbu_lifetime + p_amount,
    level = CASE
      WHEN kumbu_lifetime + p_amount >= 2000 THEN 'KOTA'
      WHEN kumbu_lifetime + p_amount >= 800 THEN 'Ouro'
      WHEN kumbu_lifetime + p_amount >= 200 THEN 'Prata'
      ELSE 'Bronze'
    END,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING kumbu_available, kumbu_lifetime, level
  INTO v_new_available, v_new_lifetime, v_new_level;

  RETURN json_build_object(
    'success', true,
    'awarded', p_amount,
    'available', v_new_available,
    'lifetime', v_new_lifetime,
    'level', v_new_level
  );
END;
$$;

-- 4. kumbu_spend function
CREATE OR REPLACE FUNCTION public.kumbu_spend(
  p_amount integer,
  p_action_type text DEFAULT 'spend',
  p_source text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_current_balance integer;
  v_new_balance integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Lock the row and check balance
  SELECT kumbu_available INTO v_current_balance
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient Kumbu balance');
  END IF;

  -- Insert debit entry (negative amount)
  INSERT INTO public.kumbu_ledger (user_id, amount, action_type, source, reference_id, description)
  VALUES (v_user_id, -p_amount, p_action_type, p_source, p_reference_id, p_description);

  -- Update balance (lifetime stays unchanged for debits)
  UPDATE public.profiles
  SET kumbu_available = kumbu_available - p_amount, updated_at = now()
  WHERE id = v_user_id
  RETURNING kumbu_available INTO v_new_balance;

  RETURN json_build_object('success', true, 'spent', p_amount, 'available', v_new_balance);
END;
$$;

-- 5. compute_weekly_ranking function
CREATE OR REPLACE FUNCTION public.compute_weekly_ranking()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_week_start date;
  v_week_end date;
  v_banda RECORD;
  v_ranking_id uuid;
  v_entry RECORD;
  v_position integer;
  v_bonus integer;
  v_total_bandas integer := 0;
  v_total_entries integer := 0;
BEGIN
  -- Calculate the previous week boundaries (Mon-Sun)
  v_week_start := date_trunc('week', CURRENT_DATE - INTERVAL '1 day')::date;
  v_week_end := v_week_start + INTERVAL '6 days';

  -- Process each banda
  FOR v_banda IN
    SELECT DISTINCT b.id AS banda_id
    FROM public.bandas b
    JOIN public.user_bandas ub ON ub.banda_id = b.id AND ub.is_active = true
  LOOP
    v_total_bandas := v_total_bandas + 1;

    -- Create ranking record (skip if already exists)
    INSERT INTO public.weekly_rankings (banda_id, week_start, week_end)
    VALUES (v_banda.banda_id, v_week_start, v_week_end)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_ranking_id;

    -- Skip if already computed
    IF v_ranking_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Compute top 10 by kumbu earned that week in this banda
    v_position := 0;
    FOR v_entry IN
      SELECT kl.user_id, SUM(kl.amount) AS score
      FROM public.kumbu_ledger kl
      JOIN public.user_bandas ub ON ub.user_id = kl.user_id AND ub.banda_id = v_banda.banda_id AND ub.is_active = true
      WHERE kl.amount > 0
        AND kl.created_at >= v_week_start
        AND kl.created_at < v_week_end + INTERVAL '1 day'
      GROUP BY kl.user_id
      ORDER BY score DESC
      LIMIT 10
    LOOP
      v_position := v_position + 1;

      INSERT INTO public.weekly_ranking_entries (ranking_id, user_id, position, score)
      VALUES (v_ranking_id, v_entry.user_id, v_position, v_entry.score);

      -- Award weekly bonus
      v_bonus := CASE
        WHEN v_position = 1 THEN 40
        WHEN v_position <= 3 THEN 25
        WHEN v_position <= 10 THEN 10
        ELSE 0
      END;

      IF v_bonus > 0 THEN
        PERFORM public.kumbu_award(
          v_entry.user_id,
          v_bonus,
          'weekly_bonus',
          'ranking',
          v_ranking_id,
          format('Top %s semanal', v_position)
        );
      END IF;

      v_total_entries := v_total_entries + 1;
    END LOOP;

    -- Archive to ranking_history
    INSERT INTO public.ranking_history (banda_id, week_start, week_end, entries)
    SELECT v_banda.banda_id, v_week_start, v_week_end,
      json_agg(json_build_object('position', wre.position, 'user_id', wre.user_id, 'score', wre.score) ORDER BY wre.position)
    FROM public.weekly_ranking_entries wre
    WHERE wre.ranking_id = v_ranking_id
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'week_start', v_week_start,
    'week_end', v_week_end,
    'bandas_processed', v_total_bandas,
    'entries_created', v_total_entries
  );
END;
$$;
