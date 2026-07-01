import { useState } from 'react';
import { Reply, Copy, Star, Pin, Forward, Trash2, Highlighter, Tag } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AFRICAN_REACTIONS, AfricanReactionType } from '@/lib/reactions';

const HIGHLIGHT_COLORS = [
  { name: 'yellow', color: 'bg-yellow-200 dark:bg-yellow-900/50', border: 'border-yellow-400' },
  { name: 'blue', color: 'bg-blue-200 dark:bg-blue-900/50', border: 'border-blue-400' },
  { name: 'green', color: 'bg-green-200 dark:bg-green-900/50', border: 'border-green-400' },
  { name: 'pink', color: 'bg-pink-200 dark:bg-pink-900/50', border: 'border-pink-400' },
  { name: 'orange', color: 'bg-orange-200 dark:bg-orange-900/50', border: 'border-orange-400' },
  { name: 'purple', color: 'bg-purple-200 dark:bg-purple-900/50', border: 'border-purple-400' },
];

interface MessageActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageContent?: string;
  isOwn: boolean;
  isStarred: boolean;
  isPinned: boolean;
  highlight?: { color: string; label?: string };
  onReply: () => void;
  onCopy: () => void;
  onReact: (emoji: string) => void | Promise<void>;
  onStar: () => void | Promise<void>;
  onPin: () => void | Promise<void>;
  onForward?: () => void;
  onDelete?: () => void | Promise<void>;
  onHighlight?: (color: string, label?: string) => void | Promise<void>;
  onRemoveHighlight?: () => void | Promise<void>;
}

export function MessageActionsSheet({
  open,
  onOpenChange,
  messageContent,
  isOwn,
  isStarred,
  isPinned,
  highlight,
  onReply,
  onCopy,
  onReact,
  onStar,
  onPin,
  onForward,
  onDelete,
  onHighlight,
  onRemoveHighlight,
}: MessageActionsSheetProps) {
  const [selectedColor, setSelectedColor] = useState(highlight?.color || '');
  const [highlightLabel, setHighlightLabel] = useState(highlight?.label || '');

  const handleAction = (action: () => void | Promise<void>) => {
    action();
    onOpenChange(false);
  };

  const handleHighlightSave = () => {
    if (selectedColor && onHighlight) {
      onHighlight(selectedColor, highlightLabel || undefined);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
        <SheetHeader className="sr-only">
          <SheetTitle>Ações da mensagem</SheetTitle>
        </SheetHeader>
        
        {/* African Reactions */}
        <div className="flex justify-center gap-1 py-4">
          {AFRICAN_REACTIONS.map((reaction) => (
            <Button
              key={reaction.type}
              variant="ghost"
              size="lg"
              className="text-2xl h-14 w-14 rounded-full hover:bg-primary/10 flex flex-col items-center gap-0.5"
              onClick={() => handleAction(() => onReact(reaction.type))}
              title={`${reaction.label}: ${reaction.meaning}`}
            >
              <span>{reaction.icon}</span>
              <span className="text-[9px] text-muted-foreground font-normal">{reaction.label.split(' ')[0]}</span>
            </Button>
          ))}
        </div>

        <Separator />

        {/* Message preview */}
        {messageContent && (
          <div className="py-3 px-4 bg-muted/50 rounded-lg my-3 max-h-20 overflow-hidden">
            <p className="text-sm text-muted-foreground line-clamp-2">{messageContent}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-base"
            onClick={() => handleAction(onReply)}
          >
            <Reply className="w-5 h-5 mr-3" />
            Responder
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-base"
            onClick={() => handleAction(onCopy)}
          >
            <Copy className="w-5 h-5 mr-3" />
            Copiar
          </Button>

          {onForward && (
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-base"
              onClick={() => handleAction(onForward)}
            >
              <Forward className="w-5 h-5 mr-3" />
              Reencaminhar
            </Button>
          )}

          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-base"
            onClick={() => handleAction(onStar)}
          >
            <Star className={`w-5 h-5 mr-3 ${isStarred ? 'fill-warning text-warning' : ''}`} />
            {isStarred ? 'Remover estrela' : 'Adicionar estrela'}
          </Button>

          {isOwn && (
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-base"
              onClick={() => handleAction(onPin)}
            >
              <Pin className={`w-5 h-5 mr-3 ${isPinned ? 'fill-primary text-primary' : ''}`} />
              {isPinned ? 'Desafixar' : 'Fixar'}
            </Button>
          )}

          {onHighlight && (
            <>
              <Separator className="my-2" />
              <div className="px-4 py-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Highlighter className="w-5 h-5" />
                    <span className="text-sm font-medium">Destacar mensagem</span>
                  </div>
                  {highlight?.color && onRemoveHighlight && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive"
                      onClick={() => handleAction(onRemoveHighlight)}
                    >
                      Remover
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2 flex-wrap mb-3">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={cn(
                        'w-10 h-10 rounded-full border-2 transition-transform hover:scale-110',
                        c.color,
                        selectedColor === c.name ? c.border : 'border-transparent'
                      )}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Adicionar etiqueta (opcional)"
                    value={highlightLabel}
                    onChange={(e) => setHighlightLabel(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleHighlightSave}
                  disabled={!selectedColor}
                >
                  Guardar destaque
                </Button>
              </div>
            </>
          )}

          {onDelete && (
            <>
              <Separator className="my-2" />
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-base text-destructive hover:text-destructive"
                onClick={() => handleAction(onDelete)}
              >
                <Trash2 className="w-5 h-5 mr-3" />
                Apagar mensagem
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
