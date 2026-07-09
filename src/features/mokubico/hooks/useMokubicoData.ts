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

/** Which spaces currently have a live roda */
export function useLiveSpaces() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mokubico-live-spaces', user?.id],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data: ub } = await supabase
        .from('user_bandas')
        .select('banda_id')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!ub?.banda_id) return new Set<string>();

      const { data: activeRodas } = await supabase
        .from('rodas')
        .select('id, palcos(space)')
        .eq('banda_id', ub.banda_id)
        .in('phase', ['content', 'qa']);

      // A roda is live in whichever space its palco belongs to. Palcos with no
      // space fall back to the open Quintal.
      const liveSet = new Set<string>();
      for (const r of activeRodas ?? []) {
        const palco = Array.isArray(r.palcos) ? r.palcos[0] : r.palcos;
        liveSet.add((palco as { space?: string | null } | null)?.space ?? 'quintal');
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

/** Rodas for a specific MOKUBICO space, resolved via each roda's palco.space
 *  (a palco with no space belongs to the open Quintal). */
export function useSpaceRodas(spaceKey: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mokubico-space-rodas', spaceKey, user?.id],
    enabled: !!user,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data: ub } = await supabase
        .from('user_bandas')
        .select('banda_id')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!ub?.banda_id) return [] as SpaceRoda[];

      // Fetch active rodas in user's banda, with their palco's space.
      const { data: allRodas, error } = await supabase
        .from('rodas')
        .select('id, title, organizer_id, palco_id, phase, viewer_count, palcos(space)')
        .eq('banda_id', ub.banda_id)
        .in('phase', ['content', 'qa', 'idle'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !allRodas?.length) return [] as SpaceRoda[];

      // Keep only rodas of this space (palco with no space → open Quintal).
      const inSpace = allRodas.filter((r) => {
        const palco = Array.isArray(r.palcos) ? r.palcos[0] : r.palcos;
        return ((palco as { space?: string | null } | null)?.space ?? 'quintal') === spaceKey;
      });
      if (!inSpace.length) return [] as SpaceRoda[];

      // --- Access rules per MOKUBICO tier (relative to each roda's host) ---
      // You always see your own rodas. Quintal (wis) is open to the whole banda.
      const uid = user!.id;
      let rodas = inSpace;
      if (spaceKey === 'sala') {
        // Kambas = accepted friends of the host.
        const { data: fr } = await supabase
          .from('friend_requests')
          .select('sender_id, receiver_id')
          .eq('status', 'accepted')
          .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`);
        const friendIds = new Set<string>();
        for (const f of fr ?? []) friendIds.add(f.sender_id === uid ? f.receiver_id : f.sender_id);
        rodas = inSpace.filter((r) => r.organizer_id === uid || (r.organizer_id && friendIds.has(r.organizer_id)));
      } else if (spaceKey === 'cozinha') {
        // Cozinha das Sis = women's space (invited guests come in a later phase).
        const { data: me } = await supabase.from('profiles').select('gender').eq('id', uid).maybeSingle();
        if (me?.gender !== 'female') rodas = inSpace.filter((r) => r.organizer_id === uid);
      } else if (spaceKey === 'quarto') {
        // Só Nós = 1:1 invite (invites come in a later phase); for now, host-only.
        rodas = inSpace.filter((r) => r.organizer_id === uid);
      }
      if (!rodas.length) return [] as SpaceRoda[];

      // Get organizer names
      const organizerIds = [...new Set(rodas.map(r => r.organizer_id).filter(Boolean))];
      const profileMap: Record<string, string> = {};

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
