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

      const sessions = data || [];

      if (sessions.length > 0) {
        const hostIds = [...new Set(sessions.map(s => s.host_id))];
        const { data: hosts } = await (supabase as any)
          .from('public_profiles')
          .select('id, display_name, avatar_url')
          .in('id', hostIds);

        const hostMap: Record<string, { id: string; display_name: string; avatar_url: string | null }> = {};
        (hosts ?? []).forEach((h: any) => { hostMap[h.id] = h; });

        sessions.forEach((s: any) => {
          s.host = hostMap[s.host_id] ?? null;
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
