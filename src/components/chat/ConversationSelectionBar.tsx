import { motion } from 'framer-motion';
import { X, Archive, Pin, BellOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConversationSelectionBarProps {
  selectedCount: number;
  onCancel: () => void;
  onArchive: () => void;
  onPin: () => void;
  onMute: () => void;
  onDelete: () => void;
}

export function ConversationSelectionBar({
  selectedCount,
  onCancel,
  onArchive,
  onPin,
  onMute,
  onDelete,
}: ConversationSelectionBarProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50 safe-bottom"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onCancel}
          >
            <X className="w-5 h-5" />
          </Button>
          <span className="font-medium">
            {selectedCount} {selectedCount === 1 ? 'selecionada' : 'selecionadas'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onPin}
            title="Fixar"
          >
            <Pin className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onMute}
            title="Silenciar"
          >
            <BellOff className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onArchive}
            title="Arquivar"
          >
            <Archive className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Apagar"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
