-- Credit top-ups (advertisers buying ad credits with real money).
-- Provider-agnostic: a purchase is created as 'pending', then a payment
-- gateway (AppyPay) confirms via webhook and we fulfill it idempotently.

CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits       integer NOT NULL CHECK (credits > 0),
  amount_kwanza numeric(14,2) NOT NULL CHECK (amount_kwanza >= 0),
  provider      text NOT NULL DEFAULT 'appypay',
  method        text,                              -- GPO | REF | UMM ...
  provider_ref  text,                              -- AppyPay charge id / reference
  status        text NOT NULL DEFAULT 'pending'    -- pending | paid | failed | expired
                CHECK (status IN ('pending','paid','failed','expired')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  paid_at       timestamptz
);

CREATE INDEX IF NOT EXISTS credit_purchases_business_idx ON public.credit_purchases(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS credit_purchases_provider_ref_idx ON public.credit_purchases(provider_ref);

ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

-- The business owner can see their own purchases; inserts happen via the edge
-- function (service role), so no INSERT policy for end users.
DROP POLICY IF EXISTS "owner reads own purchases" ON public.credit_purchases;
CREATE POLICY "owner reads own purchases" ON public.credit_purchases
  FOR SELECT USING (user_id = auth.uid());

-- Idempotently fulfill a paid purchase: credit the business balance once and
-- log a 'purchase' transaction. Safe to call multiple times (webhook retries).
CREATE OR REPLACE FUNCTION public.fulfill_credit_purchase(
  p_purchase_id uuid,
  p_provider_ref text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase public.credit_purchases%ROWTYPE;
  v_new_balance integer;
BEGIN
  SELECT * INTO v_purchase FROM public.credit_purchases
    WHERE id = p_purchase_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'purchase_not_found');
  END IF;

  IF v_purchase.status = 'paid' THEN
    RETURN jsonb_build_object('success', true, 'already_fulfilled', true,
                              'credits', v_purchase.credits);
  END IF;

  UPDATE public.business_profiles
    SET credit_balance = COALESCE(credit_balance, 0) + v_purchase.credits,
        updated_at = now()
    WHERE id = v_purchase.business_id
    RETURNING credit_balance INTO v_new_balance;

  INSERT INTO public.credit_transactions
    (business_id, transaction_type, amount, balance_after, description, reference_id, stripe_payment_id)
  VALUES
    (v_purchase.business_id, 'purchase', v_purchase.credits, v_new_balance,
     'Compra de créditos (' || v_purchase.provider || ')',
     v_purchase.id, COALESCE(p_provider_ref, v_purchase.provider_ref));

  UPDATE public.credit_purchases
    SET status = 'paid', paid_at = now(),
        provider_ref = COALESCE(p_provider_ref, provider_ref)
    WHERE id = v_purchase.id;

  RETURN jsonb_build_object('success', true, 'credited', v_purchase.credits,
                            'balance', v_new_balance);
END;
$$;
