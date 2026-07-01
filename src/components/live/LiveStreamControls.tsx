import { motion } from 'framer-motion';
import { 
  Camera, 
  CameraOff, 
  Mic, 
  MicOff, 
  PhoneOff,
  RotateCcw,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LiveStreamControlsProps {
  isHost: boolean;
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  showChat: boolean;
  onToggleCamera: () => void;
  onToggleMicrophone: () => void;
  onToggleChat: () => void;
  onEndStream: () => void;
  onFlipCamera?: () => void;
}

export function LiveStreamControls({
  isHost,
  isCameraEnabled,
  isMicrophoneEnabled,
  showChat,
  onToggleCamera,
  onToggleMicrophone,
  onToggleChat,
  onEndStream,
  onFlipCamera,
}: LiveStreamControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-3"
    >
      {/* Chat toggle (for all users) */}
      <Button
        size="icon"
        variant={showChat ? 'default' : 'secondary'}
        className="w-12 h-12 rounded-full"
        onClick={onToggleChat}
      >
        <MessageCircle className="w-5 h-5" />
      </Button>

      {/* Host-only controls */}
      {isHost && (
        <>
          <Button
            size="icon"
            variant={isMicrophoneEnabled ? 'secondary' : 'destructive'}
            className="w-12 h-12 rounded-full"
            onClick={onToggleMicrophone}
          >
            {isMicrophoneEnabled ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </Button>

          <Button
            size="icon"
            variant={isCameraEnabled ? 'secondary' : 'destructive'}
            className="w-12 h-12 rounded-full"
            onClick={onToggleCamera}
          >
            {isCameraEnabled ? (
              <Camera className="w-5 h-5" />
            ) : (
              <CameraOff className="w-5 h-5" />
            )}
          </Button>

          {onFlipCamera && (
            <Button
              size="icon"
              variant="secondary"
              className="w-12 h-12 rounded-full"
              onClick={onFlipCamera}
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          )}
        </>
      )}

      {/* End/Leave button */}
      <Button
        size="icon"
        variant="destructive"
        className="w-12 h-12 rounded-full"
        onClick={onEndStream}
      >
        <PhoneOff className="w-5 h-5" />
      </Button>
    </motion.div>
  );
}
