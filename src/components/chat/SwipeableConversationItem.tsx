import { useState, useCallback, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Trash2, Forward, Copy, Reply, Star, Pin, BellOff } from 'lucide-react';
import { ConversationItem } from './ConversationItem';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useLongPress } from '@/hooks/useLongPress';

interface SwipeableConversationItemProps {
  conversation: {
    id: string;
    type: string;
    name: string | null;
    avatar_url: string | null;
    participants?: {
      user_id: string;
      profile?: {
        id: string;
        display_name: string;
        username: string;
        avatar_url: string | null;
        is_online: boolean;
        last_seen: string | null;
      };
    }[];
    last_message?: {
      content: string | null;
      message_type: string;
      sender_id: string;
      created_at: string;
    };
    unread_count?: number;
  };
  currentUserId: string;
  onClick: () => void;
  isPinned?: boolean;
  isMuted?: boolean;
  isStarred?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onEnterSelectionMode?: (id: string) => void;
  onDelete?: () => void;
  onForward?: () => void;
  onCopy?: () => void;
  onReply?: () => void;
  onStar?: () => void;
  onPin?: () => void;
  onMute?: () => void;
  onArchive?: () => void;
}

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 70;

export function SwipeableConversationItem({
  conversation,
  currentUserId,
  onClick,
  isPinned,
  isMuted,
  isStarred,
  isSelectionMode,
  isSelected,
  onSelect,
  onEnterSelectionMode,
  onDelete,
  onForward,
  onCopy,
  onReply,
  onStar,
  onPin,
  onMute,
  onArchive,
}: SwipeableConversationItemProps) {
  const [isOpen, setIsOpen] = useState<'left' | 'right' | null>(null);
  const x = useMotionValue(0);
  const isDragging = useRef(false);

  // Long press to enter selection mode
  const handleLongPress = useCallback(() => {
    if (!isSelectionMode && onEnterSelectionMode) {
      if (navigator.vibrate) navigator.vibrate(50);
      onEnterSelectionMode(conversation.id);
    }
  }, [isSelectionMode, onEnterSelectionMode, conversation.id]);

  const { isPressed, handlers: longPressHandlers } = useLongPress({
    onLongPress: handleLongPress,
    delay: 500,
  });

  // Transform for left actions (swipe right reveals)
  const leftActionsOpacity = useTransform(x, [0, 40, 80], [0, 0.5, 1]);
  const leftActionsScale = useTransform(x, [0, 40, 80], [0.8, 0.9, 1]);

  // Transform for right actions (swipe left reveals)
  const rightActionsOpacity = useTransform(x, [-80, -40, 0], [1, 0.5, 0]);
  const rightActionsScale = useTransform(x, [-80, -40, 0], [1, 0.9, 0.8]);

  const handleDragStart = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Haptic feedback at thresholds
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDragging.current = false;

    if (info.offset.x > SWIPE_THRESHOLD) {
      // Swiped right - show left actions (4 buttons now)
      setIsOpen('left');
      x.set(ACTION_WIDTH * 4);
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      // Swiped left - show right actions
      setIsOpen('right');
      x.set(-ACTION_WIDTH * 3);
    } else {
      // Snap back
      setIsOpen(null);
      x.set(0);
    }
  }, [x]);

  const closeActions = useCallback(() => {
    setIsOpen(null);
    x.set(0);
  }, [x]);

  const handleAction = useCallback((action?: () => void) => {
    if (action) {
      action();
      if (navigator.vibrate) navigator.vibrate(20);
    }
    closeActions();
  }, [closeActions]);

  const handleClick = useCallback(() => {
    if (isSelectionMode && onSelect) {
      onSelect(conversation.id);
      return;
    }
    if (isOpen) {
      closeActions();
    } else if (!isDragging.current) {
      onClick();
    }
  }, [isOpen, closeActions, onClick, isSelectionMode, onSelect, conversation.id]);

  // In selection mode, render simplified view with checkbox
  if (isSelectionMode) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "relative flex items-center gap-3 px-4 bg-card",
          isSelected && "bg-primary/10"
        )}
        onClick={handleClick}
      >
        <div className="py-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect?.(conversation.id)}
            className="w-5 h-5"
          />
        </div>
        <div className="flex-1">
          <ConversationItem
            conversation={conversation}
            currentUserId={currentUserId}
            onClick={handleClick}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <div 
      className={cn("relative overflow-hidden", isPressed && "bg-muted/50")}
      {...longPressHandlers}
    >
      {/* Left actions (revealed on swipe right) - Reply, Copy, Forward & Star */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 flex items-center gap-0.5 pl-2"
        style={{ opacity: leftActionsOpacity, scale: leftActionsScale }}
      >
        <button
          onClick={() => handleAction(onReply)}
          className="flex flex-col items-center justify-center w-14 h-full py-2 bg-primary text-primary-foreground first:rounded-l-lg"
        >
          <Reply className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Reply</span>
        </button>
        <button
          onClick={() => handleAction(onCopy)}
          className="flex flex-col items-center justify-center w-14 h-full py-2 bg-accent text-accent-foreground"
        >
          <Copy className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Copy</span>
        </button>
        <button
          onClick={() => handleAction(onForward)}
          className="flex flex-col items-center justify-center w-14 h-full py-2 bg-secondary text-secondary-foreground"
        >
          <Forward className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Forward</span>
        </button>
        <button
          onClick={() => handleAction(onStar)}
          className={cn(
            "flex flex-col items-center justify-center w-14 h-full py-2 text-secondary-foreground",
            isStarred ? "bg-accent" : "bg-muted"
          )}
        >
          <Star className={cn("w-5 h-5 mb-1", isStarred && "fill-current")} />
          <span className="text-[10px] font-medium">{isStarred ? 'Unstar' : 'Star'}</span>
        </button>
      </motion.div>

      {/* Right actions (revealed on swipe left) - Pin, Mute, Delete */}
      <motion.div
        className="absolute right-0 top-0 bottom-0 flex items-center gap-0.5 pr-2"
        style={{ opacity: rightActionsOpacity, scale: rightActionsScale }}
      >
        <button
          onClick={() => handleAction(onPin)}
          className={cn(
            "flex flex-col items-center justify-center w-14 h-full py-2 text-primary-foreground",
            isPinned ? "bg-primary" : "bg-secondary"
          )}
        >
          <Pin className={cn("w-5 h-5 mb-1", isPinned && "fill-current")} />
          <span className="text-[10px] font-medium">{isPinned ? 'Unpin' : 'Pin'}</span>
        </button>
        <button
          onClick={() => handleAction(onMute)}
          className={cn(
            "flex flex-col items-center justify-center w-14 h-full py-2 text-primary-foreground",
            isMuted ? "bg-muted-foreground" : "bg-muted"
          )}
        >
          <BellOff className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>
        <button
          onClick={() => handleAction(onDelete)}
          className="flex flex-col items-center justify-center w-14 h-full py-2 bg-destructive text-destructive-foreground last:rounded-r-lg"
        >
          <Trash2 className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Delete</span>
        </button>
      </motion.div>

      {/* Main content */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -ACTION_WIDTH * 3, right: ACTION_WIDTH * 4 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative bg-card z-10"
      >
        <ConversationItem
          conversation={conversation}
          currentUserId={currentUserId}
          onClick={handleClick}
        />
      </motion.div>

      {/* Backdrop to close actions when tapping outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={closeActions}
        />
      )}
    </div>
  );
}
