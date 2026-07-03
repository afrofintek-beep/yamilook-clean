import { motion } from 'framer-motion';
import { UserPlus, Heart, MessageCircle, Share2, Coins, TrendingUp, TrendingDown } from 'lucide-react';
import { MOMAMBO_COPY } from '../copy';
import { usePerformanceStats } from '../hooks/useMomamboData';

function formatNumber(n: number) {
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function PerformanceCards() {
  const { data, isLoading } = usePerformanceStats();

  // NOTE: no "Visualizações" (views) card — there is no views data in the DB.
  const cards = [
    { key: 'followers', label: MOMAMBO_COPY.labels.newFollowers, icon: UserPlus, value: data?.newFollowers ?? 0, delta: data?.followersDelta ?? 0 },
    { key: 'likes', label: MOMAMBO_COPY.labels.likes, icon: Heart, value: data?.likes ?? 0, delta: data?.likesDelta ?? 0 },
    { key: 'comments', label: MOMAMBO_COPY.labels.comments, icon: MessageCircle, value: data?.comments ?? 0, delta: data?.commentsDelta ?? 0 },
    { key: 'shares', label: MOMAMBO_COPY.labels.shares, icon: Share2, value: data?.shares ?? 0, delta: data?.sharesDelta ?? 0 },
    { key: 'kumbu', label: MOMAMBO_COPY.labels.kumbuEarned, icon: Coins, value: data?.kumbuEarned ?? 0, delta: data?.kumbuDelta ?? 0 },
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/60 px-1">
        {MOMAMBO_COPY.sections.performance}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card, i) => {
          const Icon = card.icon;
          const isPositive = card.delta >= 0;
          const isKumbu = card.key === 'kumbu';

          return (
            <motion.div
              key={card.key}
              className={`relative overflow-hidden rounded-2xl border border-border/30 p-4 ${
                isKumbu
                  ? 'bg-gradient-to-br from-primary/10 via-card to-card border-primary/20'
                  : 'bg-card'
              }`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
            >
              {isKumbu && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              )}

              <div className="relative flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isKumbu ? 'bg-primary/15' : 'bg-muted/50'
                }`}>
                  <Icon className={`w-4 h-4 ${isKumbu ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={1.8} />
                </div>
                {card.delta !== 0 && (
                  <div className={`flex items-center gap-0.5 text-[11px] font-semibold ${
                    isPositive ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {isPositive ? '+' : ''}{card.delta}%
                  </div>
                )}
              </div>

              <p className="relative text-2xl font-bold text-foreground tabular-nums leading-none mb-1">
                {isLoading ? '–' : formatNumber(card.value)}
              </p>
              <p className="relative text-[11px] text-muted-foreground/60">
                {card.label}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
