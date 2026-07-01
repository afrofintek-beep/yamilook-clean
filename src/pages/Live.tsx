/* @refresh reset */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Radio, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useLiveStreamContext } from '@/components/live/LiveStreamProvider';
import { VideoTrack } from '@/components/live/VideoTrack';
import { AudioTrack } from '@/components/live/AudioTrack';
import { LiveChat } from '@/components/live/LiveChat';
import { LiveReactions } from '@/components/live/LiveReactions';
import { LiveStreamControls } from '@/components/live/LiveStreamControls';
import { RoomEvent, Track } from 'livekit-client';

export default function Live() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const {
    room,
    joinStream,
    leaveStream,
    endStream,
    currentSession,
    localParticipant,
    remoteParticipants,
    isHost,
    messages,
    reactions,
    sendMessage,
    sendReaction,
    toggleCamera,
    toggleMicrophone,
    flipCamera,
    isCameraEnabled,
    isMicrophoneEnabled,
    loading,
  } = useLiveStreamContext();

  const [showChat, setShowChat] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [trackTick, setTrackTick] = useState(0);

  // Force re-render when tracks change (LiveKit uses RoomEvent constants)
  useEffect(() => {
    if (!room) return;

    const bump = () => setTrackTick((n) => n + 1);

    room.on(RoomEvent.LocalTrackPublished, bump);
    room.on(RoomEvent.LocalTrackUnpublished, bump);
    room.on(RoomEvent.TrackSubscribed, bump);
    room.on(RoomEvent.TrackUnsubscribed, bump);
    room.on(RoomEvent.ParticipantConnected, bump);
    room.on(RoomEvent.ParticipantDisconnected, bump);

    return () => {
      room.off(RoomEvent.LocalTrackPublished, bump);
      room.off(RoomEvent.LocalTrackUnpublished, bump);
      room.off(RoomEvent.TrackSubscribed, bump);
      room.off(RoomEvent.TrackUnsubscribed, bump);
      room.off(RoomEvent.ParticipantConnected, bump);
      room.off(RoomEvent.ParticipantDisconnected, bump);
    };
  }, [room]);

  useEffect(() => {
    if (!sessionId) return;

    // CRITICAL: If we are the host and already have a room connected for this session,
    // mark as joined immediately and skip any join logic.
    if (isHost && currentSession?.id === sessionId && room) {
      if (!hasJoined) {
        console.log('[Live] Host already connected, skipping joinStream');
        setHasJoined(true);
      }
      return;
    }

    // If already joined, nothing to do
    if (hasJoined) return;

    // If we're the host but room isn't ready yet, wait for it
    if (isHost && currentSession?.id === sessionId) {
      console.log('[Live] Host waiting for room connection...');
      return;
    }

    // Only join as viewer if we're not the host of this session
    console.log('[Live] Joining stream as viewer:', sessionId);
    joinStream(sessionId).then((success) => {
      if (success) {
        console.log('[Live] Successfully joined as viewer');
        setHasJoined(true);
      } else {
        console.log('[Live] Failed to join, navigating back');
        navigate('/live');
      }
    });
  }, [sessionId, hasJoined, joinStream, navigate, isHost, currentSession?.id, room]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hasJoined && !isHost) {
        console.log('[Live] Viewer leaving stream on unmount');
        leaveStream();
      }
    };
  }, [hasJoined, isHost, leaveStream]);

  const handleEndOrLeave = async () => {
    try {
      if (isHost) {
        await endStream();
      } else {
        await leaveStream();
      }
    } catch (e) {
      console.warn('[Live] Error during leave/end:', e);
    } finally {
      navigate('/banda');
    }
  };

  // IMPORTANT: do not memoize this; the participant object is stable while track publications mutate.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _trackTick = trackTick;

  // Find the host participant - use prefixed identity format
  const hostIdentity = currentSession?.host_id ? `host:${currentSession.host_id}` : null;
  
  const hostParticipant = isHost
    ? (room?.localParticipant ?? localParticipant)
    : (remoteParticipants.find((p) => p.identity === hostIdentity) ?? remoteParticipants[0]);

  // Get all track publications from host - convert to array safely
  const publications = hostParticipant
    ? [...hostParticipant.trackPublications.values()]
    : [];

  // Find camera and microphone tracks with proper source detection
  const cameraPub = publications.find((p) => 
    p.source === Track.Source.Camera && p.track
  ) ?? publications.find((p) => 
    p.kind === Track.Kind.Video && p.source !== Track.Source.ScreenShare && p.track
  ) ?? null;

  const micPub = publications.find((p) => 
    p.source === Track.Source.Microphone && p.track
  ) ?? publications.find((p) => 
    p.kind === Track.Kind.Audio && p.track
  ) ?? null;

  // Get the actual track objects (can be local or remote)
  const videoTrack = cameraPub?.track ?? null;
  const audioTrack = micPub?.track ?? null;

  // Debug logging for track state
  useEffect(() => {
    console.log('[Live] Track state:', {
      isHost,
      hostIdentity,
      hostParticipantIdentity: hostParticipant?.identity,
      publicationCount: publications.length,
      hasVideo: !!videoTrack,
      hasAudio: !!audioTrack,
    });
  }, [isHost, hostIdentity, hostParticipant?.identity, publications.length, videoTrack, audioTrack]);

  if (loading && !hasJoined) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Radio className="w-12 h-12 text-primary animate-pulse mx-auto" />
          <p className="text-white">Joining stream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Video layer */}
      <div className="absolute inset-0">
        {videoTrack ? (
          <>
            <VideoTrack
              track={videoTrack}
              className="w-full h-full object-cover"
              muted={isHost}
            />
            {audioTrack ? <AudioTrack track={audioTrack} muted={isHost} /> : null}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-background">
            <Radio className="w-20 h-20 text-primary/50 animate-pulse" />
          </div>
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-10 safe-top"
      >
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 rounded-full"
            onClick={handleEndOrLeave}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-3">
            <Badge variant="destructive" className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              LIVE
            </Badge>
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
              <Users className="w-4 h-4" />
              {currentSession?.viewer_count || 0}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 rounded-full"
            onClick={handleEndOrLeave}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Host info */}
        {currentSession && (
          <div className="px-4 flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-primary">
              <AvatarImage src={currentSession.host?.avatar_url || ''} />
              <AvatarFallback>
                {currentSession.host?.display_name?.[0] || 'H'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-medium">
                {currentSession.host?.display_name || 'Anonymous'}
              </p>
              <p className="text-white/70 text-sm">{currentSession.title}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Chat panel - positioned as bottom overlay on mobile */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute left-0 right-0 bottom-24 max-h-[50vh] bg-black/60 backdrop-blur-md border-t border-white/10 rounded-t-2xl z-20"
          >
            <LiveChat
              messages={messages}
              onSendMessage={sendMessage}
              isHost={isHost}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reactions - moved above controls */}
      <div className="absolute right-4 bottom-28 z-10">
        <LiveReactions reactions={reactions} onReact={sendReaction} />
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 safe-bottom pb-6 px-4">
        <LiveStreamControls
          isHost={isHost}
          isCameraEnabled={isCameraEnabled}
          isMicrophoneEnabled={isMicrophoneEnabled}
          showChat={showChat}
          onToggleCamera={toggleCamera}
          onToggleMicrophone={toggleMicrophone}
          onToggleChat={() => setShowChat(!showChat)}
          onEndStream={handleEndOrLeave}
          onFlipCamera={flipCamera}
        />
      </div>
    </div>
  );
}
