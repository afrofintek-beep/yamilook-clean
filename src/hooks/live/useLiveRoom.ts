import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
  Track,
  LocalTrack,
  ConnectionState,
  VideoPresets,
  createLocalTracks
} from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useLiveSessions } from './useLiveSessions';
import { useLiveChat } from './useLiveChat';
import type { LiveSession, StreamError, UseLiveStreamReturn } from './types';

/**
 * Minimal structural type for enabling/disabling a media track. LiveKit's
 * LocalTrack exposes `mute`/`unmute`; some track implementations also expose a
 * `setEnabled` helper. All are probed defensively at runtime, hence optional.
 */
interface ToggleableTrack {
  setEnabled?: (enabled: boolean) => Promise<void> | void;
  mute?: () => Promise<void> | void;
  unmute?: () => Promise<void> | void;
}

export function useLiveStream(): UseLiveStreamReturn {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [currentSession, setCurrentSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);
  const [streamError, setStreamError] = useState<StreamError | null>(null);

  const clearStreamError = useCallback(() => setStreamError(null), []);

  const roomRef = useRef<Room | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isHostRef = useRef(false);
  const viewerIdentityRef = useRef<string | null>(null);
  const facingModeRef = useRef<'user' | 'environment'>('user');

  useEffect(() => { isHostRef.current = isHost; }, [isHost]);
  useEffect(() => { return () => { roomRef.current?.disconnect(); }; }, []);

  // Sub-hooks
  const { liveSessions, loading: sessionsLoading, fetchLiveSessions } = useLiveSessions();
  const { messages, reactions, setMessages, sendMessage, sendReaction } = useLiveChat(
    currentSession?.id ?? null,
    user?.id ?? null
  );

  const getToken = useCallback(async (roomName: string, isHostUser: boolean) => {
    if (!user || !profile) return null;
    const participantIdentity = isHostUser
      ? `host:${user.id}`
      : (viewerIdentityRef.current ??= `viewer:${user.id}:${globalThis.crypto?.randomUUID?.() ?? Date.now()}`);
    const body = { roomName, participantName: profile.display_name || 'User', participantIdentity, isHost: isHostUser };

    // The token edge function requires a valid user session. On mobile the
    // access token can be stale/detached (backgrounded tab), which made
    // supabase.functions.invoke fall back to the anon key → 401. Fetch a fresh
    // session (refreshing if expired) and pass the user's JWT explicitly.
    let { data: { session } } = await supabase.auth.getSession();
    if (session?.expires_at && session.expires_at * 1000 < Date.now() + 5000) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      session = refreshed.session;
    }
    if (!session?.access_token) {
      toast({ title: 'Sessão expirada', description: 'Inicia sessão novamente para entrar na live.', variant: 'destructive' });
      return null;
    }
    const authHeaders = { Authorization: `Bearer ${session.access_token}` };

    // The token edge function can also cold-start slowly; retry a few times.
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke('generate-livekit-token', { body, headers: authHeaders });
        if (error) throw error;
        if (data?.token) return { token: data.token, url: data.url };
        throw new Error('No token in response');
      } catch (error) {
        lastError = error;
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
      }
    }
    logger.error('Token error', 'live', lastError);
    toast({ title: 'Erro de ligação', description: 'Não foi possível obter as credenciais da live.', variant: 'destructive' });
    return null;
  }, [user, profile, toast]);

  const setupRoom = useCallback((newRoom: Room) => {
    newRoom.on(RoomEvent.ConnectionStateChanged, (state) => setConnectionState(state));
    newRoom.on(RoomEvent.ParticipantConnected, (p) => {
      setRemoteParticipants(prev => [...prev, p]);
      // Alert everyone already in the room (host + viewers) that someone joined.
      toast({ title: `${p.name || 'Espectador'} entrou na live 👋` });
    });
    newRoom.on(RoomEvent.ParticipantDisconnected, (p) => setRemoteParticipants(prev => prev.filter(x => x.sid !== p.sid)));
    newRoom.on(RoomEvent.TrackSubscribed, () => setRemoteParticipants([...newRoom.remoteParticipants.values()]));
    newRoom.on(RoomEvent.TrackUnsubscribed, () => setRemoteParticipants([...newRoom.remoteParticipants.values()]));
    newRoom.on(RoomEvent.LocalTrackPublished, () => setLocalParticipant(newRoom.localParticipant));
    newRoom.on(RoomEvent.Disconnected, () => {
      const endedSessionId = sessionIdRef.current;
      if (isHostRef.current && endedSessionId) {
        supabase.from('live_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', endedSessionId);
      }
      setRoom(null);
      setLocalParticipant(null);
      setRemoteParticipants([]);
      setConnectionState(ConnectionState.Disconnected);
    });
  }, []);

  const startStream = useCallback(async (title: string, description?: string, localTracks?: LocalTrack[]): Promise<string | null> => {
    if (!user) { toast({ title: 'Please log in to start streaming', variant: 'destructive' }); return null; }
    setLoading(true);
    setStreamError(null);
    let createdSessionId: string | null = null;

    try {
      const roomName = `live-${user.id}-${Date.now()}`;
      const { data: session, error: sessionError } = await supabase.from('live_sessions').insert({
        host_id: user.id, title, description, livekit_room_name: roomName, status: 'live', started_at: new Date().toISOString(),
      }).select().single();

      if (sessionError) { setStreamError({ code: 'DATABASE_ERROR', message: 'Failed to create stream session', details: sessionError.message }); throw sessionError; }
      createdSessionId = session.id;

      const credentials = await getToken(roomName, true);
      if (!credentials) { setStreamError({ code: 'TOKEN_FAILED', message: 'Failed to get streaming credentials' }); throw new Error('No credentials'); }

      const newRoom = new Room({ adaptiveStream: true, dynacast: true, videoCaptureDefaults: { resolution: VideoPresets.h720.resolution } });
      setupRoom(newRoom);
      roomRef.current = newRoom;

      const tracks = localTracks ?? (await createLocalTracks({ audio: true, video: true }));
      await newRoom.connect(credentials.url, credentials.token);
      for (const track of tracks) {
        await newRoom.localParticipant.publishTrack(track, { source: track.kind === Track.Kind.Video ? Track.Source.Camera : Track.Source.Microphone });
      }

      await supabase.from('live_participants').insert({ session_id: session.id, user_id: user.id, role: 'host' });

      setRoom(newRoom);
      setLocalParticipant(newRoom.localParticipant);
      setCurrentSession({
        ...session,
        host: { id: user.id, display_name: profile?.display_name || user.user_metadata?.display_name || user.email || 'Host', avatar_url: profile?.avatar_url ?? null },
      });
      setIsHost(true);
      sessionIdRef.current = session.id;
      toast({ title: 'You are now live!' });

      await new Promise<void>(r => typeof requestAnimationFrame === 'function' ? requestAnimationFrame(() => r()) : setTimeout(r, 0));
      return session.id;
    } catch (error) {
      logger.error('Error starting stream', 'live', error);
      if (createdSessionId) {
        await supabase.from('live_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', createdSessionId);
      }
      if (!streamError) { setStreamError({ code: 'UNKNOWN', message: 'Failed to start stream', details: error instanceof Error ? error.message : 'Unknown' }); }
      toast({ title: 'Failed to start stream', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, profile, getToken, setupRoom, toast, streamError]);

  const joinStream = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!user) { toast({ title: 'Please log in to join', variant: 'destructive' }); return false; }
    setLoading(true);
    try {
      const { data: session, error: sessionError } = await supabase.from('live_sessions').select('*, host:profiles!live_sessions_host_id_fkey(id, display_name, avatar_url)').eq('id', sessionId).single();
      if (sessionError) throw sessionError;
      if (session.status !== 'live') { toast({ title: 'This stream has ended', variant: 'destructive' }); return false; }

      const credentials = await getToken(session.livekit_room_name!, false);
      if (!credentials) throw new Error('Failed to get credentials');

      const newRoom = new Room({ adaptiveStream: true, dynacast: true });
      setupRoom(newRoom);
      roomRef.current = newRoom;
      await newRoom.connect(credentials.url, credentials.token);

      await supabase.from('live_participants').insert({ session_id: sessionId, user_id: user.id, role: 'viewer' });

      const { data: existingMessages } = await supabase.from('live_messages').select('*, user:profiles(display_name, avatar_url)').eq('session_id', sessionId).eq('is_deleted', false).order('created_at', { ascending: true }).limit(100);

      setRoom(newRoom);
      setLocalParticipant(newRoom.localParticipant);
      setRemoteParticipants([...newRoom.remoteParticipants.values()]);
      setCurrentSession(session);
      setIsHost(false);
      setMessages(existingMessages || []);
      sessionIdRef.current = sessionId;
      return true;
    } catch (error) {
      logger.error('Error joining stream', 'live', error);
      toast({ title: 'Failed to join stream', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, getToken, setupRoom, toast, setMessages]);

  const leaveStream = useCallback(async () => {
    if (roomRef.current) {
      try { for (const pub of roomRef.current.localParticipant.trackPublications.values()) pub.track?.stop(); } catch { /* ignore track stop errors */ }
      roomRef.current.disconnect();
    }
    if (sessionIdRef.current && user) {
      await supabase.from('live_participants').update({ left_at: new Date().toISOString() }).eq('session_id', sessionIdRef.current).eq('user_id', user.id);
    }
    setRoom(null); setLocalParticipant(null); setRemoteParticipants([]); setCurrentSession(null);
    setIsHost(false); sessionIdRef.current = null; roomRef.current = null; viewerIdentityRef.current = null;
  }, [user]);

  const endStream = useCallback(async () => {
    if (!isHost || !sessionIdRef.current) return;
    await supabase.from('live_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', sessionIdRef.current);
    await leaveStream();
    toast({ title: 'Stream ended' });
  }, [isHost, leaveStream, toast]);

  const forceEndSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data: session } = await supabase.from('live_sessions').select('host_id, status').eq('id', sessionId).single();
      if (!session) { toast({ title: 'Session not found', variant: 'destructive' }); return false; }
      if (session.status === 'ended') { toast({ title: 'Session already ended' }); return true; }

      const isOwner = session.host_id === user.id;
      const { data: isAdminData } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (!isOwner && isAdminData !== true) { toast({ title: 'Permission denied', variant: 'destructive' }); return false; }

      const { error } = await supabase.from('live_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', sessionId);
      if (error) { logger.error('Error ending session', 'live', error); toast({ title: 'Error', description: 'Failed to end session', variant: 'destructive' }); return false; }
      if (sessionIdRef.current === sessionId) await leaveStream();
      toast({ title: 'Session ended successfully' });
      await fetchLiveSessions();
      return true;
    } catch (error) {
      logger.error('Error in forceEndSession', 'live', error);
      toast({ title: 'Error', description: 'Failed to end session', variant: 'destructive' });
      return false;
    }
  }, [user, toast, leaveStream, fetchLiveSessions]);

  const toggleCamera = useCallback(async () => {
    if (!room || !localParticipant) return;
    try {
      const pub = localParticipant.getTrackPublication(Track.Source.Camera);
      if (pub?.track) {
        const next = !isCameraEnabled;
        const t = pub.track as ToggleableTrack;
        if (typeof t.setEnabled === 'function') await t.setEnabled(next);
        else if (next && typeof t.unmute === 'function') await t.unmute();
        else if (!next && typeof t.mute === 'function') await t.mute();
        setIsCameraEnabled(next);
        return;
      }
      if (!isCameraEnabled) {
        const tracks = await createLocalTracks({ video: true, audio: false });
        for (const track of tracks) await localParticipant.publishTrack(track, { source: Track.Source.Camera });
        setIsCameraEnabled(true);
      }
    } catch (e) {
      logger.error('Failed to toggle camera', 'live', e);
      toast({ title: 'Camera Error', description: 'Could not toggle camera.', variant: 'destructive' });
    }
  }, [room, localParticipant, isCameraEnabled, toast]);

  const toggleMicrophone = useCallback(async () => {
    if (!room || !localParticipant) return;
    try {
      const pub = localParticipant.getTrackPublication(Track.Source.Microphone);
      if (pub?.track) {
        const next = !isMicrophoneEnabled;
        const t = pub.track as ToggleableTrack;
        if (typeof t.setEnabled === 'function') await t.setEnabled(next);
        else if (next && typeof t.unmute === 'function') await t.unmute();
        else if (!next && typeof t.mute === 'function') await t.mute();
        setIsMicrophoneEnabled(next);
        return;
      }
      if (!isMicrophoneEnabled) {
        const tracks = await createLocalTracks({ audio: true, video: false });
        for (const track of tracks) await localParticipant.publishTrack(track, { source: Track.Source.Microphone });
        setIsMicrophoneEnabled(true);
      }
    } catch (e) {
      logger.error('Failed to toggle microphone', 'live', e);
      toast({ title: 'Microphone Error', description: 'Could not toggle microphone.', variant: 'destructive' });
    }
  }, [room, localParticipant, isMicrophoneEnabled, toast]);

  const flipCamera = useCallback(async () => {
    if (!room || !localParticipant) return;
    try {
      const pub = localParticipant.getTrackPublication(Track.Source.Camera);
      const newFacingMode = facingModeRef.current === 'user' ? 'environment' : 'user';
      if (pub?.track) {
        const track = pub.track as LocalTrack;
        await localParticipant.unpublishTrack(track);
        track.stop();
      }
      const tracks = await createLocalTracks({ video: { facingMode: newFacingMode, resolution: VideoPresets.h720.resolution }, audio: false });
      for (const track of tracks) {
        if (track.kind === Track.Kind.Video) await localParticipant.publishTrack(track, { source: Track.Source.Camera });
      }
      facingModeRef.current = newFacingMode;
      setIsCameraEnabled(true);
    } catch (e) {
      logger.error('Failed to flip camera', 'live', e);
      toast({ title: 'Camera Error', description: 'Could not switch camera.', variant: 'destructive' });
    }
  }, [room, localParticipant, toast]);

  return {
    room, connectionState, localParticipant, remoteParticipants, isHost, currentSession,
    messages, reactions,
    loading: loading || sessionsLoading,
    streamError, clearStreamError,
    startStream, joinStream, leaveStream, endStream, forceEndSession,
    toggleCamera, toggleMicrophone, flipCamera,
    sendMessage, sendReaction,
    isCameraEnabled, isMicrophoneEnabled,
    liveSessions, fetchLiveSessions,
  };
}
