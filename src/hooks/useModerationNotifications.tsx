import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ModerationNotification {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  related_strike_id: string | null;
  related_appeal_id: string | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export function useModerationNotifications() {
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('moderation_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []) as ModerationNotification[];
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    await supabase
      .from('moderation_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    await supabase
      .from('moderation_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  }, [user]);

  const getUnreadCount = useCallback(async () => {
    if (!user) return 0;

    const { count, error } = await supabase
      .from('moderation_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) return 0;
    return count || 0;
  }, [user]);

  return {
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
  };
}
