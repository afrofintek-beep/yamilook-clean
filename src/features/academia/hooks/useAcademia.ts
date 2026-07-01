import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export interface AcademiaSession {
  id: string;
  title: string;
  description: string | null;
  mentorId: string;
  mentorName: string;
  mentorAvatar?: string;
  date: string;
  time: string;
  format: string;
  spots: number;
  spotsLeft: number;
  isPremium: boolean;
  priceCoins: number;
  status: string;
  scheduledAt: string;
}

const QUERY_KEY = ['academia-sessions'];

export function useAcademiaSessions() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academia_sessions')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      if (!data?.length) return [] as AcademiaSession[];

      // Get mentor names
      const mentorIds = [...new Set(data.map(s => s.mentor_id))];
      let profileMap: Record<string, { name: string; avatar?: string }> = {};

      if (mentorIds.length > 0) {
        const { data: profiles } = await supabase.rpc('get_public_profiles_by_ids', {
          p_ids: mentorIds,
        });
        if (profiles) {
          for (const p of profiles) {
            profileMap[p.id] = {
              name: p.display_name || 'Anónimo',
              avatar: p.avatar_url ?? undefined,
            };
          }
        }
      }

      return data.map((s): AcademiaSession => {
        const dt = new Date(s.scheduled_at);
        return {
          id: s.id,
          title: s.title,
          description: s.description,
          mentorId: s.mentor_id,
          mentorName: profileMap[s.mentor_id]?.name ?? 'Anónimo',
          mentorAvatar: profileMap[s.mentor_id]?.avatar,
          date: format(dt, 'd MMM', { locale: pt }),
          time: format(dt, "HH:mm"),
          format: s.format,
          spots: s.spots,
          spotsLeft: s.spots_left,
          isPremium: (s.price_coins ?? 0) > 0,
          priceCoins: s.price_coins ?? 0,
          status: s.status,
          scheduledAt: s.scheduled_at,
        };
      });
    },
  });
}

export function useCreateAcademiaSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      description: string;
      format: string;
      spots: number;
      priceCoins: number;
      scheduledAt: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('academia_sessions').insert({
        mentor_id: user.id,
        title: input.title,
        description: input.description || null,
        format: input.format,
        spots: input.spots,
        spots_left: input.spots,
        price_coins: input.priceCoins,
        scheduled_at: input.scheduledAt,
        status: 'scheduled',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
