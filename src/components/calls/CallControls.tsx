import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Mic, MicOff, Video, VideoOff, Phone, 
  MonitorUp, FlipHorizontal2, Hand, MoreVertical,
  Volume2, VolumeX, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface CallControlsProps {
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  callType: 'voice' | 'video';
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onFlipCamera: () => void;
  onRaiseHand: () => void;
  onEndCall: () => void;
  onOpenSettings: () => void;
}

export function CallControls({
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  isHandRaised,
  callType,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onFlipCamera,
  onRaiseHand,
  onEndCall,
  onOpenSettings,
}: CallControlsProps) {
  const { t } = useTranslation();
  const [volume, setVolume] = useState(100);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Volume Control */}
      <div className="relative">
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full border-white/20 bg-white/10 hover:bg-white/20"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          {volume === 0 ? (
            <VolumeX className="h-6 w-6 text-white" />
          ) : (
            <Volume2 className="h-6 w-6 text-white" />
          )}
        </Button>

        {showVolumeSlider && (
          <div 
            className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-background p-3 rounded-lg shadow-xl"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <Slider
              orientation="vertical"
              value={[volume]}
              onValueChange={([val]) => setVolume(val)}
              max={100}
              step={1}
              className="h-24"
            />
          </div>
        )}
      </div>

      {/* Mute */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full border-white/20 bg-white/10 hover:bg-white/20 transition-all",
          isMuted && "bg-red-500 hover:bg-red-600 border-red-500"
        )}
        onClick={onToggleMute}
      >
        {isMuted ? (
          <MicOff className="h-6 w-6 text-white" />
        ) : (
          <Mic className="h-6 w-6 text-white" />
        )}
      </Button>

      {/* Video Toggle */}
      {callType === 'video' && (
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full border-white/20 bg-white/10 hover:bg-white/20 transition-all",
            !isVideoEnabled && "bg-red-500 hover:bg-red-600 border-red-500"
          )}
          onClick={onToggleVideo}
        >
          {isVideoEnabled ? (
            <Video className="h-6 w-6 text-white" />
          ) : (
            <VideoOff className="h-6 w-6 text-white" />
          )}
        </Button>
      )}

      {/* Screen Share */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full border-white/20 bg-white/10 hover:bg-white/20 transition-all",
          isScreenSharing && "bg-primary hover:bg-primary/90 border-primary"
        )}
        onClick={onToggleScreenShare}
      >
        <MonitorUp className="h-6 w-6 text-white" />
      </Button>

      {/* End Call */}
      <Button
        size="icon"
        className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 transition-all hover:scale-105"
        onClick={onEndCall}
      >
        <Phone className="h-7 w-7 text-white rotate-[135deg]" />
      </Button>

      {/* Flip Camera (mobile) */}
      {callType === 'video' && (
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full border-white/20 bg-white/10 hover:bg-white/20 transition-all"
          onClick={onFlipCamera}
        >
          <FlipHorizontal2 className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Raise Hand */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full border-white/20 bg-white/10 hover:bg-white/20 transition-all",
          isHandRaised && "bg-yellow-500 hover:bg-yellow-600 border-yellow-500"
        )}
        onClick={onRaiseHand}
      >
        <Hand className="h-6 w-6 text-white" />
      </Button>

      {/* More Options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full border-white/20 bg-white/10 hover:bg-white/20 transition-all"
          >
            <MoreVertical className="h-6 w-6 text-white" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={onOpenSettings}>
            <Settings className="h-4 w-4 mr-2" />
            {t('calls.settings')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onEndCall}>
            <Phone className="h-4 w-4 mr-2 rotate-[135deg]" />
            {t('calls.leaveCall')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
