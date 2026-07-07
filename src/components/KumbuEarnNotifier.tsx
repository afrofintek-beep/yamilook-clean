import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ACTION_LABELS } from '@/features/kumbu/copy';

/**
 * Global listener that congratulates the user when they earn Kumbu.
 *
 * Kumbu is awarded server-side (triggers / weekly cron / RPCs), so the client
 * never sees the award directly — we listen to inserts on the user's own
 * kumbu_ledger (RLS already scopes rows to the owner) and toast on credits.
 */
export function KumbuEarnNotifier() {
  const { user } = useAuth();
  const { toast } = useToast();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`kumbu-earn-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'kumbu_ledger' },
        (payload) => {
          const row = payload.new as {
            id: string;
            user_id: string;
            amount: number;
            action_type: string;
            source: string | null;
            description: string | null;
          };
          if (row.user_id !== user.id) return; // only my earnings
          if (!row.amount || row.amount <= 0) return; // credits only, not spends
          if (row.action_type === 'spend' || row.action_type === 'payout') return;
          if (seen.current.has(row.id)) return; // avoid double toasts
          seen.current.add(row.id);

          // action_type is just the category (earn/spend/payout); the readable
          // reason lives in description, with a source-based label as fallback.
          const label = row.description || ACTION_LABELS[row.source ?? ''] || 'Kumbu ganho';
          toast({ title: `🪙 +${row.amount} Kumbu`, description: label });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // toast from useToast is module-stable; safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return null;
}
