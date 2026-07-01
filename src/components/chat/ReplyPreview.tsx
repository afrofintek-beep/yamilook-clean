import { X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ReplyPreviewProps {
  message: {
    id: string;
    content: string | null;
    message_type: string;
    sender_profile?: {
      display_name: string;
      avatar_url: string | null;
    };
  };
  onCancel?: () => void;
  compact?: boolean;
}

export function ReplyPreview({ message, onCancel, compact }: ReplyPreviewProps) {
  const displayName = message.sender_profile?.display_name || 'Unknown';
  const previewText = message.content
    ? message.content.length > 50
      ? message.content.slice(0, 50) + '...'
      : message.content
    : message.message_type === 'image'
    ? '📷 Photo'
    : message.message_type === 'voice'
    ? '🎤 Voice message'
    : message.message_type === 'video'
    ? '🎥 Video'
    : 'Message';

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg border-l-2 border-primary text-sm">
        <span className="font-medium text-primary">{displayName}</span>
        <span className="text-muted-foreground truncate">{previewText}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-secondary/50 border-l-4 border-primary">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-primary block">{displayName}</span>
        <span className="text-sm text-muted-foreground truncate block">{previewText}</span>
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
