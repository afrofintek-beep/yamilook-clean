import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMessageNotification } from '@/hooks/useMessageNotification';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Global component that listens for new messages AND typing indicators
 * across ALL conversations the user participates in, and triggers
 * notification sound/vibration even when not viewing that specific chat.
 */
export function GlobalMessageNotifier() {
  const { user } = useAuth();
  const { notifyMessage, triggerVibration } = useMessageNotification();
  const messageChannelRef = useRef<RealtimeChannel | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const participatingConversationsRef = useRef<Set<string>>(new Set());
  // Único por instância para não colidir no mesmo tópico do canal realtime.
  const instanceIdRef = useRef(Math.random().toString(36).slice(2));

  // Track which conversations the user is currently viewing
  // to avoid notifying when already watching the typing happen
  const currentPathRef = useRef(window.location.pathname);
  useEffect(() => {
    const update = () => { currentPathRef.current = window.location.pathname; };
    window.addEventListener('popstate', update);
    // Also track react-router navigation via a MutationObserver on title
    const observer = new MutationObserver(update);
    observer.observe(document.querySelector('title') || document.head, { childList: true, subtree: true });
    return () => {
      window.removeEventListener('popstate', update);
      observer.disconnect();
    };
  }, []);

  // Soft typing notification: gentle haptic only (no sound — would be annoying)
  const notifyTyping = useCallback(() => {
    triggerVibration('reaction'); // [50ms] — subtle
  }, [triggerVibration]);

  const isViewingConversation = useCallback((conversationId: string) => {
    return currentPathRef.current.includes(conversationId);
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch all conversation IDs the user participates in
    const fetchConversations = async () => {
      const { data } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (data) {
        participatingConversationsRef.current = new Set(data.map(d => d.conversation_id));
      }
    };

    fetchConversations();

    // ── 1. Listen for new messages ──────────────────────────────
    const messageChannel = supabase
      .channel(`global-message-notifications-${instanceIdRef.current}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as { sender_id: string; conversation_id: string };

          // Only notify for messages from OTHER users, in conversations we participate in,
          // AND only when we are NOT already viewing that conversation
          if (
            newMessage.sender_id !== user.id &&
            participatingConversationsRef.current.has(newMessage.conversation_id) &&
            !isViewingConversation(newMessage.conversation_id)
          ) {
            notifyMessage();
          }
        }
      )
      .subscribe();

    messageChannelRef.current = messageChannel;

    // ── 2. Listen for typing indicators ────────────────────────
    // We listen to both INSERT and UPDATE because upsert generates UPDATE
    // when the record already exists (same user typing again).
    const handleTypingEvent = (payload: any) => {
      const indicator = (payload.new || payload.old) as { user_id: string; conversation_id: string } | null;
      if (!indicator?.user_id || !indicator?.conversation_id) return;

      // Only notify if:
      // - The typer is someone else
      // - We participate in that conversation
      // - We are NOT currently viewing that conversation
      if (
        indicator.user_id !== user.id &&
        participatingConversationsRef.current.has(indicator.conversation_id) &&
        !isViewingConversation(indicator.conversation_id)
      ) {
        notifyTyping();
      }
    };

    const typingChannel = supabase
      .channel(`global-typing-notifications-${instanceIdRef.current}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'typing_indicators' },
        handleTypingEvent
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'typing_indicators' },
        handleTypingEvent
      )
      .subscribe();

    typingChannelRef.current = typingChannel;

    return () => {
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
        messageChannelRef.current = null;
      }
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
    };
  }, [user, notifyMessage, notifyTyping, isViewingConversation]);

  // Refresh conversation list periodically (new groups, etc.)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (data) {
        participatingConversationsRef.current = new Set(data.map(d => d.conversation_id));
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [user]);

  return null;
}
