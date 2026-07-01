import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { LiveMessage, LiveReaction } from './types';

/**
 * Hook for managing live chat messages and reactions within a session.
 */
export function useLiveChat(sessionId: string | null, userId: string | null) {
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [reactions, setReactions] = useState<LiveReaction[]>([]);

  // Subscribe to messages and reactions
  useEffect(() => {
    if (!sessionId) return;

    const messagesChannel = supabase
      .channel(`live-messages-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          const newMessage = payload.new as LiveMessage;
          const { data: userData } = await (supabase as any)
            .from('public_profiles')
            .select('display_name, avatar_url')
            .eq('id', newMessage.user_id)
            .single();

          setMessages(prev => [...prev, { ...newMessage, user: userData || undefined }]);
        }
      )
      .subscribe();

    const reactionsChannel = supabase
      .channel(`live-reactions-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_reactions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newReaction = payload.new as LiveReaction;
          setReactions(prev => [...prev, newReaction]);
          setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== newReaction.id));
          }, 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(reactionsChannel);
    };
  }, [sessionId]);

  const sendMessage = useCallback(async (message: string) => {
    if (!sessionId || !userId) return;
    await supabase.from('live_messages').insert({
      session_id: sessionId,
      user_id: userId,
      message,
    });
  }, [sessionId, userId]);

  const sendReaction = useCallback(async (reactionType: string) => {
    if (!sessionId || !userId) return;
    await supabase.from('live_reactions').insert({
      session_id: sessionId,
      user_id: userId,
      reaction_type: reactionType,
    });
  }, [sessionId, userId]);

  return {
    messages,
    reactions,
    setMessages,
    sendMessage,
    sendReaction,
  };
}
