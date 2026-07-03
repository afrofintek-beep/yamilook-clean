-- kumbu_refund: give Kumbu back when a charged action is undone (e.g. a
-- premium Academia reservation is cancelled).
--
-- Why a dedicated function instead of kumbu_award:
--   * kumbu_award enforces a 40 Kumbu/day earning cap and would silently
--     cap (or zero) a refund — a refund is not an earning.
--   * kumbu_award inflates kumbu_lifetime (level progression); a refund
--     must not.
--   * kumbu_award takes an arbitrary p_user_id; a refund must be scoped to
--     the caller (auth.uid()).
--
-- Idempotency: the amount refunded is the OUTSTANDING net spend for the
-- given reference (SUM(amount) over the caller's ledger rows for that
-- reference_id/source). Prior refunds are positive rows, so once the net
-- reaches zero a second call refunds nothing — a double cancel can never
-- double-refund. action_type 'spend' is used because it is a known-valid
-- value for the live kumbu_ledger_action_type_check constraint; the sign
-- of amount (positive here) distinguishes the credit from the debit.
CREATE OR REPLACE FUNCTION public.kumbu_refund(
  p_reference_id uuid,
  p_source text DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_net integer;
  v_refund integer;
  v_new_balance integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Net Kumbu movement for this reference (debits are negative, prior
  -- refunds positive). A negative net means Kumbu is still outstanding.
  SELECT COALESCE(SUM(amount), 0) INTO v_net
  FROM public.kumbu_ledger
  WHERE user_id = v_user_id
    AND reference_id = p_reference_id
    AND (p_source IS NULL OR source = p_source);

  IF v_net >= 0 THEN
    RETURN json_build_object('success', true, 'refunded', 0);
  END IF;

  v_refund := -v_net;

  INSERT INTO public.kumbu_ledger (user_id, amount, action_type, source, reference_id, description)
  VALUES (v_user_id, v_refund, 'spend', p_source, p_reference_id, COALESCE(p_description, 'Reembolso'));

  UPDATE public.profiles
  SET kumbu_available = kumbu_available + v_refund, updated_at = now()
  WHERE id = v_user_id
  RETURNING kumbu_available INTO v_new_balance;

  RETURN json_build_object('success', true, 'refunded', v_refund, 'available', v_new_balance);
END;
$$;

GRANT EXECUTE ON FUNCTION public.kumbu_refund(uuid, text, text) TO authenticated;
