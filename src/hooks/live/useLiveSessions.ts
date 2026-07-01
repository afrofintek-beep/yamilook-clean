import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { LiveSession } from './types';

/**
 * Hook for fetching and managing the list of live sessions.
 */
export function useLiveSessions() {
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLiveSessions = useCallback(async (city?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('live_sessions')
        .select('*')
        .eq('status', 'live')
        .order('viewer_count', { ascending: false });

      if (city) {
        query = query.eq('city', city);
      }

      const { data, error } = await query;
      if (error) throw error;

      const sessions: LiveSession[] = data || [];

      if (sessions.length > 0) {
        const hostIds = [...new Set(sessions.map(s => s.host_id))];
        const { data: hosts } = await supabase
          .from('public_profiles')
          .select('id, display_name, avatar_url')
          .in('id', hostIds);

        const hostMap: Record<string, { id: string; display_name: string; avatar_url: string | null }> = {};
        (hosts ?? []).forEach((h) => {
          if (h.id) hostMap[h.id] = { id: h.id, display_name: h.display_name ?? '', avatar_url: h.avatar_url };
        });

        sessions.forEach((s) => {
          s.host = hostMap[s.host_id] ?? undefined;
        });
      }

      setLiveSessions(sessions);
    } catch (error) {
      logger.error('Error fetching live sessions', 'live', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { liveSessions, loading, fetchLiveSessions };
}
