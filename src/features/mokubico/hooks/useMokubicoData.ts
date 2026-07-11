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

      const { data: host } = await supabase
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
      const { data: ub } = await supabase
        .from('user_bandas')
        .select('banda_id')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!ub?.banda_id) return 0;

      const { count, error } = await supabase
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
      const { data: ub } = await supabase
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

/** Which spaces currently have a live conversa the user can see (RLS-filtered). */
export function useLiveSpaces() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mokubico-live-spaces', user?.id],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('mokubico_conversas')
        .select('space')
        .eq('status', 'live');
      const liveSet = new Set<string>();
      for (const c of data ?? []) if (c.space) liveSet.add(c.space);
      return liveSet;
    },
  });
}
