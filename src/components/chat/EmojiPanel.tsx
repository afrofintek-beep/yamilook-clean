import { useState } from 'react';
import { cn } from '@/lib/utils';
import { EMOJI_GROUPS } from '@/lib/african-emojis';

interface Props {
  onSelect: (emoji: string) => void;
}

/** African-first emoji picker for the chat. Category chips switch the grid;
 *  the "Outros" group holds the general set. */
export function EmojiPanel({ onSelect }: Props) {
  const [active, setActive] = useState(EMOJI_GROUPS[0].key);
  const group = EMOJI_GROUPS.find((g) => g.key === active) ?? EMOJI_GROUPS[0];

  return (
    <div className="w-[300px] max-w-[80vw]">
      {/* Category chips */}
      <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1">
        {EMOJI_GROUPS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setActive(g.key)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs whitespace-nowrap shrink-0 transition-colors',
              active === g.key
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-muted-foreground hover:bg-secondary/50',
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-7 gap-0.5 max-h-[184px] overflow-y-auto">
        {group.emojis.map((e, i) => (
          <button
            key={`${e}-${i}`}
            type="button"
            onClick={() => onSelect(e)}
            className="text-xl p-1.5 rounded-lg hover:bg-secondary/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Emoji ${e}`}
          >
            <span role="img">{e}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
