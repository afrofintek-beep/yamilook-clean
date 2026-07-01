/* @refresh reset */
import { useCallback, useRef, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// IMPORTANT: These must match the backend DB check constraint on public.call_signals.signal_type
export type SignalType =
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'call-ended'
  | 'call-declined'
  | 'call-accepted';

// Normalized type for internal processing (simpler)
type NormalizedType = 'offer' | 'answer' | 'ice' | 'call-ended' | 'call-declined' | 'call-accepted';

// Bounded dedup cap – once we exceed this, we trim to half
const DEDUP_CAP = 500;
const DEDUP_TRIM_TO = 250;

function normalizeType(signalType: string): NormalizedType {
  const raw = (signalType || '').toLowerCase();
  if (raw === 'ice-candidate' || raw === 'ice_candidate' || raw === 'ice') {
    return 'ice';
  }
  return raw as NormalizedType;
}

export interface SignalingMessage {
  id?: string;
  call_id: string;
  from_user_id: string;
  to_user_id: string;
  signal_type: SignalType;
  payload?: RTCSessionDescriptionInit | RTCIceCandidateInit | EventPayload | null;
  created_at?: string;
  processed?: boolean;
  __type?: NormalizedType;
}

export interface EventPayload {
  type: 'ended' | 'declined' | 'accepted' | 'ringing' | 'connected' | 'muted' | 'unmuted';
  data?: Record<string, unknown>;
}

interface UseWebRTCSignalingProps {
  callId: string | null;
  onOffer: (offer: RTCSessionDescriptionInit, from: string) => void;
  onAnswer: (answer: RTCSessionDescriptionInit, from: string) => void;
  onIceCandidate: (candidate: RTCIceCandidateInit, from: string) => void;
  onEvent: (event: EventPayload, from: string) => void;
}

export function useWebRTCSignaling({
  callId,
  onOffer,
  onAnswer,
  onIceCandidate,
  onEvent,
}: UseWebRTCSignalingProps) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // CRITICAL: Dedupe signals by ID to prevent double-processing (bounded)
  const processedSignalIds = useRef(new Set<string>());
  const processedQueue = useRef<string[]>([]);

  const markProcessed = useCallback((id: string) => {
    if (processedSignalIds.current.has(id)) return;
    processedSignalIds.current.add(id);
    processedQueue.current.push(id);

    if (processedQueue.current.length > DEDUP_CAP) {
      const removeCount = processedQueue.current.length - DEDUP_TRIM_TO;
      for (let i = 0; i < removeCount; i++) {
        const oldest = processedQueue.current.shift();
        if (oldest) processedSignalIds.current.delete(oldest);
      }
    }
  }, []);
  // Fallback cursor for polling fetches
  const lastFetchedAtRef = useRef<string | null>(null);

  // Keep latest handlers without causing resubscriptions
  const handlersRef = useRef({ onOffer, onAnswer, onIceCandidate, onEvent });

  useEffect(() => {
    handlersRef.current = { onOffer, onAnswer, onIceCandidate, onEvent };
  }, [onOffer, onAnswer, onIceCandidate, onEvent]);

  // Process a single signal (with deduplication)
  const processSignal = useCallback((signal: SignalingMessage) => {
    // Dedupe by signal ID — primary guard, works for both Realtime and polling
    if (signal.id && processedSignalIds.current.has(signal.id)) return;
    // NOTE: Do NOT skip by timestamp cursor here — that guard caused Realtime signals
    // to be silently dropped when they arrived before the polling cursor advanced.
    // The ID-based dedup above is sufficient and correct for both code paths.
    if (signal.id) markProcessed(signal.id);

    const normalizedType = normalizeType(signal.signal_type);
    console.log('[Signaling] Processing:', signal.signal_type, 'from:', signal.from_user_id?.substring(0, 8));

    const handlers = handlersRef.current;

    try {
      switch (normalizedType) {
        case 'offer':
          if (signal.payload) handlers.onOffer(signal.payload as RTCSessionDescriptionInit, signal.from_user_id);
          break;
        case 'answer':
          if (signal.payload) handlers.onAnswer(signal.payload as RTCSessionDescriptionInit, signal.from_user_id);
          break;
        case 'ice':
          if (signal.payload) handlers.onIceCandidate(signal.payload as RTCIceCandidateInit, signal.from_user_id);
          break;
        case 'call-accepted':
          handlers.onEvent({ type: 'accepted' }, signal.from_user_id);
          break;
        case 'call-declined':
          handlers.onEvent({ type: 'declined' }, signal.from_user_id);
          break;
        case 'call-ended':
          handlers.onEvent({ type: 'ended' }, signal.from_user_id);
          break;
        default:
          console.warn('[Signaling] Unknown signal type:', signal.signal_type);
      }
    } catch (err) {
      console.error('[Signaling] Error processing signal:', err);
    }
  }, [markProcessed]);

  // One-time fetch of pending signals (catch-up on subscription start)
  const fetchPendingSignals = useCallback(async () => {
    if (!callId || !userId) return;

    let query = supabase
      .from('call_signals')
      .select('*')
      .eq('call_id', callId)
      .eq('to_user_id', userId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (lastFetchedAtRef.current) {
      query = query.gt('created_at', lastFetchedAtRef.current);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Signaling] Error fetching pending signals:', error);
      return;
    }

    if (data && data.length > 0) {
      const last = data[data.length - 1] as any;
      if (last?.created_at) lastFetchedAtRef.current = String(last.created_at);
    }

    data?.forEach((signal) => {
      processSignal(signal as unknown as SignalingMessage);
    });
  }, [callId, userId, processSignal]);

  // Polling fallback
  useEffect(() => {
    if (!callId || !userId) return;

    void fetchPendingSignals();

    const intervalMs = isSubscribed ? 4000 : 1000;
    const id = window.setInterval(() => {
      void fetchPendingSignals();
    }, intervalMs);

    return () => {
      window.clearInterval(id);
    };
  }, [callId, userId, isSubscribed, fetchPendingSignals]);

  // Subscribe to Realtime INSERT events only
  useEffect(() => {
    if (!callId || !userId) return;

    // Clear processed signals on new subscription
    processedSignalIds.current.clear();
    lastFetchedAtRef.current = null;

    const channel = supabase
      .channel(`call-signals-${callId}-${userId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
        },
        (payload) => {
          const signal = payload.new as unknown as SignalingMessage;
          // Client-side filter: only process signals for this call and user
          if (!signal || signal.call_id !== callId || signal.to_user_id !== userId) return;
          processSignal(signal);
        }
      )
      .subscribe((status, err) => {
        console.log('[Signaling] Subscription status:', status, err ? 'Error:' + err : '');
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true);
          fetchPendingSignals();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Signaling] Subscription error:', status, err);
          setIsSubscribed(false);
        }
      });

    subscriptionRef.current = channel;

    return () => {
      setIsSubscribed(false);
      supabase.removeChannel(channel);
      subscriptionRef.current = null;
    };
  }, [callId, userId, processSignal, fetchPendingSignals]);

  const sendSignal = useCallback(
    async (
      type: SignalType,
      to: string,
      payload?: RTCSessionDescriptionInit | RTCIceCandidateInit | EventPayload | null
    ): Promise<boolean> => {
      if (!user || !callId) return false;

      const { error } = await supabase.from('call_signals').insert({
        call_id: callId,
        from_user_id: user.id,
        to_user_id: to,
        signal_type: type,
        payload: payload ? JSON.parse(JSON.stringify(payload)) : null,
      });

      if (error) {
        console.error('[Signaling] Error sending signal:', error);
        return false;
      }
      return true;
    },
    [user, callId]
  );

  const sendOffer = useCallback((to: string, offer: RTCSessionDescriptionInit) => sendSignal('offer', to, offer), [sendSignal]);
  const sendAnswer = useCallback((to: string, answer: RTCSessionDescriptionInit) => sendSignal('answer', to, answer), [sendSignal]);
  const sendIceCandidate = useCallback((to: string, candidate: RTCIceCandidateInit) => sendSignal('ice-candidate', to, candidate), [sendSignal]);
  const sendCallEnded = useCallback((to: string) => sendSignal('call-ended', to, null), [sendSignal]);
  const sendCallDeclined = useCallback((to: string) => sendSignal('call-declined', to, null), [sendSignal]);
  const sendCallAccepted = useCallback((to: string) => sendSignal('call-accepted', to, null), [sendSignal]);

  const cleanupSignals = useCallback(async () => {
    if (!callId || !user) return;
    await supabase
      .from('call_signals')
      .delete()
      .eq('call_id', callId)
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);
  }, [callId, user]);

  return {
    isSubscribed,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    sendCallEnded,
    sendCallDeclined,
    sendCallAccepted,
    cleanupSignals,
    fetchPendingSignals,
    processSignal,
  };
}
