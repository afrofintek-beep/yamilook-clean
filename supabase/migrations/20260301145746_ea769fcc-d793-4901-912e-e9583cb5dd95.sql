
-- Remove permissive client-side INSERT on credit_transactions
DROP POLICY IF EXISTS "Users can insert their own credit transactions" ON public.credit_transactions;

-- Only service_role (edge functions / backend) can insert credit transactions
-- No INSERT policy for authenticated/anon = blocked by RLS
