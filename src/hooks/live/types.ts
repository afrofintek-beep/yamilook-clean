import { Room, ConnectionState, LocalParticipant, RemoteParticipant, LocalTrack } from 'livekit-client';

export interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  host_id: string;
  status: string;
  viewer_count: number;
  peak_viewers: number;
  city: string | null;
  neighborhood: string | null;
  thumbnail_url: string | null;
  livekit_room_name: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  host?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface LiveMessage {
  id: string;
  session_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: {
    display_name: string;
    avatar_url: string | null;
  };
}

export interface LiveReaction {
  id: string;
  session_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

export interface StreamError {
  code: 'TOKEN_FAILED' | 'CONNECTION_FAILED' | 'TRACK_PUBLISH_FAILED' | 'DATABASE_ERROR' | 'UNKNOWN';
  message: string;
  details?: string;
}

export interface UseLiveStreamReturn {
  room: Room | null;
  connectionState: ConnectionState;
  localParticipant: LocalParticipant | null;
  remoteParticipants: RemoteParticipant[];
  isHost: boolean;
  currentSession: LiveSession | null;
  messages: LiveMessage[];
  reactions: LiveReaction[];
  loading: boolean;
  streamError: StreamError | null;
  clearStreamError: () => void;
  startStream: (title: string, description?: string, localTracks?: LocalTrack[]) => Promise<string | null>;
  joinStream: (sessionId: string) => Promise<boolean>;
  leaveStream: () => Promise<void>;
  endStream: () => Promise<void>;
  forceEndSession: (sessionId: string) => Promise<boolean>;
  toggleCamera: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  flipCamera: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  sendReaction: (reactionType: string) => Promise<void>;
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  liveSessions: LiveSession[];
  fetchLiveSessions: (city?: string) => Promise<void>;
}
