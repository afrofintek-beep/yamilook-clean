import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track, type RemoteParticipant, type Participant } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

export interface ConversaMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  at: number;
}

interface Peer {
  id: string;
  name: string;
  speaking: boolean;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

/** Group voice (LiveKit) + ephemeral text chat (data channel) for a Mokubico
 *  conversa. Everyone allowed in can talk; the token function enforces access. */
export function useMokubicoRoom(roomName: string | null) {
  const { user, profile } = useAuth();
  const roomRef = useRef<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [messages, setMessages] = useState<ConversaMessage[]>([]);

  const refreshPeers = useCallback((room: Room) => {
    const speaking = new Set(room.activeSpeakers.map((p) => p.identity));
    const all: Participant[] = [room.localParticipant, ...room.remoteParticipants.values()];
    setPeers(
      all.map((p) => ({
        id: p.identity,
        name: p.name || 'Alguém',
        speaking: speaking.has(p.identity),
      })),
    );
  }, []);

  const getToken = useCallback(async (): Promise<{ token: string; url: string } | null> => {
    if (!user || !roomName) return null;
    let { data: { session } } = await supabase.auth.getSession();
    if (session && session.expires_at && session.expires_at * 1000 < Date.now() + 5000) {
      const r = await supabase.auth.refreshSession();
      session = r.data.session;
    }
    if (!session?.access_token) return null;
    const body = {
      roomName,
      participantName: profile?.display_name || 'User',
      participantIdentity: user.id,
      isHost: false,
    };
    const { data, error: fnErr } = await supabase.functions.invoke('generate-livekit-token', {
      body,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (fnErr || !data?.token) return null;
    return { token: data.token, url: data.url };
  }, [user, profile, roomName]);

  const connect = useCallback(async () => {
    if (!roomName || roomRef.current || connecting) return;
    setConnecting(true);
    setError(null);
    try {
      const creds = await getToken();
      if (!creds) throw new Error('Sem credenciais para entrar.');

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      room
        .on(RoomEvent.ParticipantConnected, () => refreshPeers(room))
        .on(RoomEvent.ParticipantDisconnected, () => refreshPeers(room))
        .on(RoomEvent.ActiveSpeakersChanged, () => refreshPeers(room))
        .on(RoomEvent.TrackSubscribed, (track, _pub, participant: RemoteParticipant) => {
          if (track.kind === Track.Kind.Audio) track.attach(); // play remote audio
          refreshPeers(room);
        })
        .on(RoomEvent.Disconnected, () => { setConnected(false); })
        .on(RoomEvent.DataReceived, (payload, participant) => {
          try {
            const m = JSON.parse(dec.decode(payload)) as { text: string };
            if (!m?.text) return;
            setMessages((prev) => [
              ...prev,
              {
                id: `${participant?.identity ?? 'x'}-${prev.length}-${m.text.length}`,
                senderId: participant?.identity ?? '',
                senderName: participant?.name || 'Alguém',
                text: m.text,
                at: prev.length,
              },
            ]);
          } catch { /* ignore non-JSON */ }
        });

      await room.connect(creds.url, creds.token);
      await room.localParticipant.setMicrophoneEnabled(true);
      setMicOn(true);
      setConnected(true);
      refreshPeers(room);
    } catch (e) {
      logger.error('Mokubico room connect failed', 'mokubico', e);
      setError(e instanceof Error ? e.message : 'Falha ao entrar na sala.');
      roomRef.current?.disconnect();
      roomRef.current = null;
    } finally {
      setConnecting(false);
    }
  }, [roomName, connecting, getToken, refreshPeers]);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !micOn;
    await room.localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  }, [micOn]);

  const sendMessage = useCallback(async (text: string) => {
    const room = roomRef.current;
    const t = text.trim();
    if (!room || !t) return;
    await room.localParticipant.publishData(enc.encode(JSON.stringify({ text: t })), { reliable: true });
    // Echo locally (data messages aren't received by the sender).
    setMessages((prev) => [
      ...prev,
      { id: `me-${prev.length}`, senderId: user?.id ?? '', senderName: profile?.display_name || 'Tu', text: t, at: prev.length },
    ]);
  }, [user, profile]);

  const leave = useCallback(() => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setConnected(false);
  }, []);

  useEffect(() => () => { roomRef.current?.disconnect(); roomRef.current = null; }, []);

  return { connect, leave, toggleMic, sendMessage, connected, connecting, error, micOn, peers, messages, selfId: user?.id ?? '' };
}
