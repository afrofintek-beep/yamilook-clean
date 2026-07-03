import { supabase } from '@/integrations/supabase/client';

/**
 * Normalised result of the `kumbu_spend` / `kumbu_refund` RPCs.
 * The functions return a JSON object; this is its typed shape.
 */
export interface KumbuTxResult {
  success: boolean;
  /** Coins charged, on a successful spend. */
  spent?: number;
  /** Coins returned, on a successful refund (0 when nothing was outstanding). */
  refunded?: number;
  /** Resulting available balance, on a successful mutation. */
  available?: number;
  /** Human-readable reason when `success` is false. */
  error?: string;
}

/** Coerce an RPC `{ data, error }` pair into a {@link KumbuTxResult}. */
function toResult(data: unknown, error: { message: string } | null): KumbuTxResult {
  if (error) return { success: false, error: error.message };
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    return data as KumbuTxResult;
  }
  return { success: false, error: 'Resposta inesperada do servidor.' };
}

/**
 * Charge the current user `amount` Kumbu for an action.
 * `actionType` must be a value the `kumbu_ledger_action_type_check`
 * constraint accepts — defaults to `'spend'` (the RPC's own default).
 */
export async function kumbuSpend(params: {
  amount: number;
  actionType?: string;
  source?: string;
  referenceId?: string;
  description?: string;
}): Promise<KumbuTxResult> {
  const { data, error } = await supabase.rpc('kumbu_spend', {
    p_amount: params.amount,
    p_action_type: params.actionType ?? 'spend',
    p_source: params.source,
    p_reference_id: params.referenceId,
    p_description: params.description,
  });
  return toResult(data, error);
}

/**
 * Refund any Kumbu the current user still has outstanding on `referenceId`.
 * Idempotent: the amount is the net spend minus prior refunds, so calling it
 * twice never double-refunds (a second call returns `refunded: 0`).
 */
export async function kumbuRefund(params: {
  referenceId: string;
  source?: string;
  description?: string;
}): Promise<KumbuTxResult> {
  const { data, error } = await supabase.rpc('kumbu_refund', {
    p_reference_id: params.referenceId,
    p_source: params.source,
    p_description: params.description,
  });
  return toResult(data, error);
}
