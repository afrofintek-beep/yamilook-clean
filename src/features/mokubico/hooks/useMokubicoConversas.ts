import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Conversa {
  id: string;
  title: string;
  hostId: string;
  hostName: string;
  roomName: string;
  isHost: boolean;
}

/** Live conversas in a space that the user may see (RLS returns only their own
 *  and the ones they were individually invited to). */
export function useSpaceConversas(space: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['mokubico-conversas', space, user?.id],
    enabled: !!user,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mokubico_conversas')
        .select('id, title, host_id, livekit_room_name')
        .eq('space', space)
        .eq('status', 'live')
        .order('started_at', { ascending: false })
        .limit(30);
      if (error || !data?.length) return [] as Conversa[];

      const hostIds = [...new Set(data.map((c) => c.host_id))];
      const { data: profiles } = await supabase.rpc('get_public_profiles_by_ids', { p_ids: hostIds });
      const names = new Map<string, string>();
      for (const p of profiles ?? []) names.set(p.id, p.display_name || 'Anónimo');

      return data.map((c): Conversa => ({
        id: c.id,
        title: c.title || 'Conversa',
        hostId: c.host_id,
        hostName: names.get(c.host_id) ?? 'Anónimo',
        roomName: c.livekit_room_name,
        isHost: c.host_id === user!.id,
      }));
    },
  });
}

/** Open a free conversa in a space with an individually-chosen guest list.
 *  Returns the new conversa id (navigate to its room). */
export function useOpenConversa() {
  const { user } = useAuth();
  return useCallback(
    async ({ space, title, guestIds }: { space: string; title: string; guestIds: string[] }) => {
      if (!user) throw new Error('Not authenticated');

      // The user's active banda, for context (nullable).
      const { data: ub } = await supabase
        .from('user_bandas').select('banda_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

      const roomName = `mok-${user.id}-${Date.now()}`;
      const { data: conversa, error } = await supabase
        .from('mokubico_conversas')
        .insert({ host_id: user.id, banda_id: ub?.banda_id ?? null, space, title: title || null, livekit_room_name: roomName })
        .select('id')
        .single();
      if (error) throw error;

      if (guestIds.length > 0) {
        await supabase
          .from('mokubico_conversa_guests')
          .insert(guestIds.map((uid) => ({ conversa_id: conversa.id, user_id: uid })));
      }
      return { id: conversa.id as string, roomName };
    },
    [user],
  );
}
