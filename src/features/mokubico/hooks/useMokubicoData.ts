import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/** Active live session (most recent one that's live right now) */
export function useActiveLiveSession() {
  return useQuery({
    queryKey: ['mokubico-active-live'],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('id, title, host_id, viewer_count, city')
        .eq('status', 'live')
        .order('viewer_count', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const { data: host } = await (supabase as any)
        .from('public_profiles')
        .select('display_name')
        .eq('id', data.host_id)
        .maybeSingle();

      return {
        id: data.id,
        title: data.title,
        hostName: host?.display_name ?? 'Alguém',
        viewerCount: data.viewer_count ?? 0,
      };
    },
  });
}

/** Count of active members in user's banda */
export function useBandaActiveCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mokubico-banda-active', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: ub } = await (supabase as any)
        .from('user_bandas')
        .select('banda_id')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!ub?.banda_id) return 0;

      const { count, error } = await (supabase as any)
        .from('user_bandas')
        .select('user_id', { count: 'exact', head: true })
        .eq('banda_id', ub.banda_id)
        .eq('is_active', true);

      if (error) return 0;
      return count ?? 0;
    },
  });
}

/** Count of new posts in user's banda in last 24h */
export function useNovidadesCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mokubico-novidades', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: ub } = await (supabase as any)
        .from('user_bandas')
        .select('banda_id')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!ub?.banda_id) return 0;

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { count, error } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('banda_id', ub.banda_id)
        .gte('created_at', yesterday);

      if (error) return 0;
      return count ?? 0;
    },
  });
}

/** Which spaces currently have a live roda */
export function useLiveSpaces() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mokubico-live-spaces', user?.id],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data: ub } = await (supabase as any)
        .from('user_bandas')
        .select('banda_id')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!ub?.banda_id) return new Set<string>();

      const { data: activeRodas } = await supabase
        .from('rodas')
        .select('id')
        .eq('banda_id', ub.banda_id)
        .in('phase', ['content', 'qa']);

      const liveSet = new Set<string>();
      if (activeRodas && activeRodas.length > 0) {
        liveSet.add('quintal');
      }
      return liveSet;
    },
  });
}

export interface SpaceRoda {
  id: string;
  title: string;
  hostName: string;
  listeners: number;
  isLive: boolean;
  palcoId: string;
}

/** Rodas for a specific space (currently all go to quintal) */
export function useSpaceRodas(spaceKey: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mokubico-space-rodas', spaceKey, user?.id],
    enabled: !!user,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data: ub } = await (supabase as any)
        .from('user_bandas')
        .select('banda_id')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!ub?.banda_id) return [] as SpaceRoda[];

      // Fetch active rodas in user's banda
      const { data: rodas, error } = await supabase
        .from('rodas')
        .select('id, title, organizer_id, palco_id, phase, viewer_count')
        .eq('banda_id', ub.banda_id)
        .in('phase', ['content', 'qa', 'idle'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !rodas?.length) return [] as SpaceRoda[];

      // Get organizer names
      const organizerIds = [...new Set(rodas.map(r => r.organizer_id).filter(Boolean))];
      let profileMap: Record<string, string> = {};

      if (organizerIds.length > 0) {
        const { data: profiles } = await supabase.rpc('get_public_profiles_by_ids', {
          p_ids: organizerIds,
        });
        if (profiles) {
          for (const p of profiles) {
            profileMap[p.id] = p.display_name || 'Anónimo';
          }
        }
      }

      return rodas.map((r): SpaceRoda => ({
        id: r.id,
        title: r.title || 'Roda sem título',
        hostName: profileMap[r.organizer_id ?? ''] ?? 'Anónimo',
        listeners: r.viewer_count ?? 0,
        isLive: r.phase === 'content' || r.phase === 'qa',
        palcoId: r.palco_id ?? '',
      }));
    },
  });
}
