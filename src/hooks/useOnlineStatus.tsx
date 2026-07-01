import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

interface UserStatus {
  is_online: boolean;
  last_seen: string | null;
  show_online_status: boolean;
  show_last_seen: boolean;
}

/**
 * Tracks the current user's online presence using Supabase Realtime Presence.
 * This replaces the old polling-based heartbeat that wrote to the DB every 30s.
 * 
 * How it works:
 * - Joins a shared "online-presence" channel and calls channel.track()
 * - Other users subscribe to the same channel to see who's online
 * - On visibility change / unload, we untrack (no DB writes needed for heartbeat)
 * - We only write to DB on login (online) and logout/unload (offline + last_seen)
 */
export function useOnlineStatus() {
  const { user } = useAuth();
  const wantsOnlineRef = useRef<boolean | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch the user's show_online_status preference once
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('show_online_status')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        wantsOnlineRef.current = data?.show_online_status !== false;
      });
  }, [user]);

  // Write online/offline to DB (only on significant state changes, not heartbeat)
  const persistStatus = useCallback(async (isOnline: boolean) => {
    if (!user) return;
    if (isOnline && wantsOnlineRef.current === false) return;

    try {
      await supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch (error) {
      logger.error('Failed to persist online status', 'presence', error);
    }
  }, [user]);

  // Set up Realtime Presence channel
  useEffect(() => {
    if (!user) return;

    // Set online in DB once
    persistStatus(true);

    const channel = supabase.channel('online-presence', {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        // Presence state synced — consumers use usePresenceStatus to read it
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Only track if user wants to show online status
          if (wantsOnlineRef.current !== false) {
            await channel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    channelRef.current = channel;

    // Handle visibility change
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        await channel.untrack();
      } else if (wantsOnlineRef.current !== false) {
        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });
      }
    };

    // Handle browser close — persist offline to DB
    const handleBeforeUnload = () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`;
      const data = JSON.stringify({
        is_online: false,
        last_seen: new Date().toISOString(),
      });
      navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Subscribe to show_online_status preference changes
    const prefChannel = supabase
      .channel(`my-show-online-pref-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        async (payload) => {
          const newPref = (payload.new as any)?.show_online_status;
          if (typeof newPref === 'boolean') {
            wantsOnlineRef.current = newPref;
            if (!newPref) {
              await channelRef.current?.untrack();
              await supabase
                .from('profiles')
                .update({ is_online: false, last_seen: new Date().toISOString() })
                .eq('id', user.id);
            } else {
              await channelRef.current?.track({
                user_id: user.id,
                online_at: new Date().toISOString(),
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      supabase.removeChannel(prefChannel);
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
      persistStatus(false);
    };
  }, [user, persistStatus]);

  return { persistStatus };
}

/**
 * Hook to check if specific users are online via Realtime Presence.
 * Falls back to DB query for last_seen and privacy settings.
 */
export function useUserStatus(userId: string | null) {
  const [status, setStatus] = useState<UserStatus>({
    is_online: false,
    last_seen: null,
    show_online_status: true,
    show_last_seen: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_online, last_seen, show_online_status, show_last_seen')
          .eq('id', userId)
          .single();

        if (data && !error) {
          setStatus({
            is_online: data.is_online ?? false,
            last_seen: data.last_seen,
            show_online_status: data.show_online_status ?? true,
            show_last_seen: data.show_last_seen ?? true,
          });
        }
      } catch (error) {
        logger.error('Error fetching user status', 'presence', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Also listen to the presence channel for real-time updates
    const channel = supabase.channel('online-presence');
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const isPresent = !!state[userId]?.length;
      setStatus(prev => ({ ...prev, is_online: isPresent }));
    });

    // DB subscription for privacy setting changes
    const dbChannel = supabase
      .channel(`user-status-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const { is_online, last_seen, show_online_status, show_last_seen } = payload.new as any;
          setStatus({
            is_online: is_online ?? false,
            last_seen,
            show_online_status: show_online_status ?? true,
            show_last_seen: show_last_seen ?? true,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dbChannel);
    };
  }, [userId]);

  return { ...status, loading };
}

export function useMultipleUserStatus(userIds: string[]) {
  const [statuses, setStatuses] = useState<Record<string, UserStatus>>({});
  const [loading, setLoading] = useState(true);
  // Único por instância para não colidir no mesmo tópico do canal realtime.
  const instanceIdRef = useRef(Math.random().toString(36).slice(2));

  useEffect(() => {
    if (userIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchStatuses = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, is_online, last_seen, show_online_status, show_last_seen')
          .in('id', userIds);

        if (data && !error) {
          const statusMap: Record<string, UserStatus> = {};
          data.forEach((profile) => {
            statusMap[profile.id] = {
              is_online: profile.is_online ?? false,
              last_seen: profile.last_seen,
              show_online_status: profile.show_online_status ?? true,
              show_last_seen: profile.show_last_seen ?? true,
            };
          });
          setStatuses(statusMap);
        }
      } catch (error) {
        logger.error('Error fetching user statuses', 'presence', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatuses();

    // Listen to presence channel for real-time online state
    const channel = supabase.channel('online-presence');
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setStatuses(prev => {
        const next = { ...prev };
        userIds.forEach(id => {
          if (next[id]) {
            next[id] = { ...next[id], is_online: !!state[id]?.length };
          }
        });
        return next;
      });
    });

    // DB subscription for full profile changes
    const dbChannel = supabase
      .channel(`multi-user-status-${instanceIdRef.current}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const { id, is_online, last_seen, show_online_status, show_last_seen } = payload.new as any;
          if (userIds.includes(id)) {
            setStatuses((prev) => ({
              ...prev,
              [id]: {
                is_online: is_online ?? false,
                last_seen,
                show_online_status: show_online_status ?? true,
                show_last_seen: show_last_seen ?? true,
              },
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dbChannel);
    };
  }, [userIds.join(',')]);

  return { statuses, loading };
}
