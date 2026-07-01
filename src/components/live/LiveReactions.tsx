import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LiveReaction } from '@/hooks/useLiveStream';
import { AFRICAN_REACTIONS, getReaction, getReactionIcon } from '@/lib/reactions';

interface LiveReactionsProps {
  reactions: LiveReaction[];
  onReact: (type: string) => void;
}

export function LiveReactions({ reactions, onReact }: LiveReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="relative">
      {/* Floating reactions */}
      <div className="absolute bottom-16 right-0 w-20 h-48 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {reactions.map((reaction, index) => {
            const icon = getReactionIcon(reaction.reaction_type);
            
            return (
              <motion.div
                key={reaction.id}
                initial={{ opacity: 1, y: 0, x: Math.random() * 40 - 20 }}
                animate={{ 
                  opacity: 0, 
                  y: -200,
                  x: Math.sin(index) * 30,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, ease: 'easeOut' }}
                className="absolute bottom-0 text-2xl"
              >
                {icon}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Reaction button & picker */}
      <div className="relative">
        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute bottom-full mb-2 right-0 bg-background/90 backdrop-blur-lg rounded-full px-3 py-2 flex gap-2 shadow-lg border border-border"
            >
              {AFRICAN_REACTIONS.map((reaction) => (
                <Button
                  key={reaction.type}
                  size="icon"
                  variant="ghost"
                  className="w-10 h-10 rounded-full hover:bg-muted text-xl"
                  onClick={() => {
                    onReact(reaction.type);
                    setShowPicker(false);
                  }}
                  title={`${reaction.label} - ${reaction.meaning}`}
                >
                  {reaction.icon}
                </Button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          size="icon"
          variant="secondary"
          className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-0 hover:bg-white/30"
          onClick={() => setShowPicker(!showPicker)}
        >
          <span className="text-xl">💛</span>
        </Button>
      </div>
    </div>
  );
}
