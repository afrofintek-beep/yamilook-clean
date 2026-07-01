import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type LedgerDirection = 'all' | 'credit' | 'debit';

export function useKumbuHistory(direction: LedgerDirection = 'all') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['kumbu-ledger', user?.id, direction],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from('kumbu_ledger')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (direction === 'credit') q = q.gt('amount', 0);
      if (direction === 'debit') q = q.lt('amount', 0);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}
