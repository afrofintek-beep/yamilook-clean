import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useUserBanda() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-banda', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('user_bandas')
        .select('banda_id, bandas:banda_id(id, name, city)')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { banda_id: string; bandas: { id: string; name: string; city: string } } | null;
    },
  });
}

export function useWeeklyRanking(bandaId: string | undefined) {
  return useQuery({
    queryKey: ['weekly-ranking', bandaId],
    enabled: !!bandaId,
    queryFn: async () => {
      const { data: ranking, error: rErr } = await supabase
        .from('weekly_rankings')
        .select('*')
        .eq('banda_id', bandaId!)
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (rErr) throw rErr;
      if (!ranking) return null;

      const { data: entries, error: eErr } = await supabase
        .from('weekly_ranking_entries')
        .select('position, user_id')
        .eq('ranking_id', ranking.id)
        .order('position', { ascending: true })
        .limit(10);
      if (eErr) throw eErr;

      const userIds = (entries ?? []).map((e: any) => e.user_id);
      let profiles: Record<string, { display_name: string; level: string }> = {};

      if (userIds.length > 0) {
        const { data: pData } = await supabase
          .from('public_profiles' as any)
          .select('id, display_name, level')
          .in('id', userIds);
        (pData ?? []).forEach((p: any) => {
          profiles[p.id] = { display_name: p.display_name, level: p.level };
        });
      }

      return {
        weekStart: ranking.week_start,
        weekEnd: ranking.week_end,
        entries: (entries ?? []).map((e: any) => ({
          position: e.position,
          userId: e.user_id,
          displayName: profiles[e.user_id]?.display_name ?? 'Utilizador',
          level: profiles[e.user_id]?.level ?? 'Bronze',
        })),
      };
    },
  });
}

export function useRankingHistory(bandaId: string | undefined) {
  return useQuery({
    queryKey: ['ranking-history', bandaId],
    enabled: !!bandaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ranking_history')
        .select('*')
        .eq('banda_id', bandaId!)
        .order('week_start', { ascending: false })
        .limit(12);
      if (error) throw error;
      return data;
    },
  });
}
