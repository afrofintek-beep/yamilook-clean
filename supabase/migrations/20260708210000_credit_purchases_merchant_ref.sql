-- AppyPay requires merchantTransactionId to be 1..15 alphanumeric chars, so we
-- send a short derived ref instead of the purchase UUID and store it to map the
-- webhook callback back to the purchase.
alter table public.credit_purchases add column if not exists merchant_ref text;
create index if not exists idx_credit_purchases_merchant_ref on public.credit_purchases(merchant_ref);
