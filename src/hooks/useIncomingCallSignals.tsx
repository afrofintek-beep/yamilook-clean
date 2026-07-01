/* @refresh reset */
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface IncomingOffer {
  callId: string;
  callType: 'voice' | 'video';
  callerId: string;
  sdp: RTCSessionDescriptionInit;
}

interface UseIncomingCallSignalsProps {
  onOfferReceived: (offer: IncomingOffer) => void;
}

/**
 * This hook listens for incoming WebRTC offer signals sent to the current user.
 * It subscribes to call_signals by to_user_id ONLY (not by call_id),
 * so the callee can detect offers before knowing the call_id.
 */
export function useIncomingCallSignals({ onOfferReceived }: UseIncomingCallSignalsProps) {
  const { user } = useAuth();
  const processedOffers = useRef<Set<string>>(new Set());
  const onOfferReceivedRef = useRef(onOfferReceived);
  // Stable channel suffix to prevent recreating channels on every render
  const channelSuffixRef = useRef<string>(`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  // Keep callback ref updated without triggering effect re-runs
  onOfferReceivedRef.current = onOfferReceived;

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const userId = user.id;
    // Use stable suffix to prevent duplicate subscriptions
    const channelName = `incoming-offers-${userId}-${channelSuffixRef.current}`;
    // Subscribe silently in production

    // Subscribe to all call_signals sent TO this user
    // Using broader subscription to avoid server/client binding mismatch errors
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
        },
        (payload) => {
          const signal = payload.new as {
            id: string;
            call_id: string;
            signal_type: string;
            from_user_id: string;
            to_user_id: string;
            payload: any;
            processed: boolean;
            created_at?: string;
          };
          
          // Client-side filter: only process signals for this user
          if (signal.to_user_id !== userId) return;
          
          console.log('[IncomingCallSignals] 📨 Realtime event received!');
          console.log('[IncomingCallSignals] 📨 Raw payload:', JSON.stringify(payload, null, 2));

          console.log('[IncomingCallSignals] 📨 Signal details:');
          console.log('[IncomingCallSignals]    - ID:', signal.id);
          console.log('[IncomingCallSignals]    - Type:', signal.signal_type);
          console.log('[IncomingCallSignals]    - Call ID:', signal.call_id);
          console.log('[IncomingCallSignals]    - From User:', signal.from_user_id);
          console.log('[IncomingCallSignals]    - Processed:', signal.processed);
          console.log('[IncomingCallSignals]    - Created At:', signal.created_at);
          console.log('[IncomingCallSignals]    - Has Payload:', !!signal.payload);

          // Only process offer signals
          if (signal.signal_type !== 'offer') {
            console.log('[IncomingCallSignals] ⏭️ Ignoring non-offer signal type:', signal.signal_type);
            return;
          }

          console.log('[IncomingCallSignals] ✅ This is an OFFER signal - processing...');

          // Prevent duplicate processing
          if (processedOffers.current.has(signal.id)) {
            console.log('[IncomingCallSignals] ⚠️ Already processed this offer, skipping:', signal.id);
            console.log('[IncomingCallSignals] 📋 Currently processed offers:', Array.from(processedOffers.current));
            return;
          }
          processedOffers.current.add(signal.id);
          console.log('[IncomingCallSignals] ➕ Added to processed offers set, count:', processedOffers.current.size);

          // Extract call type from payload or default to voice
          const sdpPayload = signal.payload as RTCSessionDescriptionInit | null;
          
          console.log('[IncomingCallSignals] 📄 SDP Payload analysis:');
          console.log('[IncomingCallSignals]    - Payload exists:', !!sdpPayload);
          console.log('[IncomingCallSignals]    - SDP type:', sdpPayload?.type);
          console.log('[IncomingCallSignals]    - SDP length:', sdpPayload?.sdp?.length || 0);
          
          // Determine call type from SDP content (video calls have video in SDP)
          let callType: 'voice' | 'video' = 'voice';
          if (sdpPayload?.sdp && sdpPayload.sdp.includes('m=video')) {
            callType = 'video';
            console.log('[IncomingCallSignals] 📹 Detected VIDEO call (m=video found in SDP)');
          } else {
            console.log('[IncomingCallSignals] 📞 Detected VOICE call (no m=video in SDP)');
          }

          if (sdpPayload) {
            console.log('[IncomingCallSignals] 🔔 Triggering onOfferReceived callback with:');
            console.log('[IncomingCallSignals]    - callId:', signal.call_id);
            console.log('[IncomingCallSignals]    - callType:', callType);
            console.log('[IncomingCallSignals]    - callerId:', signal.from_user_id);
            
            onOfferReceivedRef.current({
              callId: signal.call_id,
              callType,
              callerId: signal.from_user_id,
              sdp: sdpPayload,
            });
            
            console.log('[IncomingCallSignals] ✅ onOfferReceived callback executed successfully');
          } else {
            console.error('[IncomingCallSignals] ❌ Offer signal has NO SDP payload - cannot process!');
            console.error('[IncomingCallSignals] ❌ Full signal for debugging:', JSON.stringify(signal, null, 2));
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[IncomingCallSignals] 📡 Subscription callback triggered');
        console.log('[IncomingCallSignals] 📡 Status:', status);
        
        if (err) {
          console.error('[IncomingCallSignals] ❌ Subscription error:', err);
          console.error('[IncomingCallSignals] ❌ Error message:', err.message);
        }

        if (status === 'SUBSCRIBED') {
          console.log('[IncomingCallSignals] ✅ Successfully subscribed to Realtime channel!');
          console.log('[IncomingCallSignals] 🔄 Checking for any pending offers that may have been missed...');
          void checkPendingOffers(userId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[IncomingCallSignals] ❌ Channel error - subscription failed');
        } else if (status === 'TIMED_OUT') {
          console.error('[IncomingCallSignals] ⏰ Subscription timed out');
        } else if (status === 'CLOSED') {
          console.log('[IncomingCallSignals] 🔒 Channel closed');
        }
      });

    // Check for pending offers on initial subscribe
    // Only fetch offers from the last 2 minutes to avoid processing stale calls
    const checkPendingOffers = async (userId: string) => {
      console.log('[IncomingCallSignals] 🔍 Checking for recent pending offers...');
      
      try {
        // Only look for offers created in the last 2 minutes
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        
        const { data: pendingSignals, error } = await supabase
          .from('call_signals')
          .select('*')
          .eq('to_user_id', userId)
          .eq('signal_type', 'offer')
          .eq('processed', false)
          .gte('created_at', twoMinutesAgo)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('[IncomingCallSignals] ❌ Error fetching pending offers:', error);
          return;
        }

        console.log('[IncomingCallSignals] 📊 Recent pending offers:', pendingSignals?.length || 0);

        if (pendingSignals && pendingSignals.length > 0) {
          // Process only the most recent offer per call
          const latestOfferByCall = new Map<string, typeof pendingSignals[0]>();
          for (const signal of pendingSignals) {
            latestOfferByCall.set(signal.call_id, signal);
          }

          for (const signal of latestOfferByCall.values()) {
            if (processedOffers.current.has(signal.id)) continue;
            processedOffers.current.add(signal.id);

            const sdpPayload = signal.payload as unknown as RTCSessionDescriptionInit | null;
            let callType: 'voice' | 'video' = 'voice';
            if (sdpPayload?.sdp && sdpPayload.sdp.includes('m=video')) {
              callType = 'video';
            }

            if (sdpPayload) {
              console.log('[IncomingCallSignals] 🔔 Processing recent offer for call:', signal.call_id);
              onOfferReceivedRef.current({
                callId: signal.call_id,
                callType,
                callerId: signal.from_user_id,
                sdp: sdpPayload,
              });
            }
          }
        } else {
          console.log('[IncomingCallSignals] ✅ No recent pending offers');
        }
      } catch (err) {
        console.error('[IncomingCallSignals] ❌ Error checking pending offers:', err);
      }
    };

    return () => {
      console.log('[IncomingCallSignals] 🔌 Unsubscribing from Realtime channel:', channelName);
      supabase.removeChannel(channel);
      console.log('[IncomingCallSignals] ✅ Channel removed');
    };
  }, [user?.id]);

  // Cleanup old processed offers periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      // Keep only the last 100 processed offers
      if (processedOffers.current.size > 100) {
        const arr = Array.from(processedOffers.current);
        processedOffers.current = new Set(arr.slice(-50));
      }
    }, 60000);

    return () => clearInterval(cleanup);
  }, []);
}
