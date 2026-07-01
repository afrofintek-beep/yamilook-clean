import { motion } from 'framer-motion';
import { Flame, MessageCircle, TrendingUp } from 'lucide-react';
import { MOMAMBO_COPY } from '../copy';
import { mockTrending } from '../mocks';

export default function TrendingSection() {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/60 px-1">
        {MOMAMBO_COPY.sections.trending}
      </h2>

      {/* Hot Topics */}
      <motion.div
        className="rounded-2xl border border-border/30 bg-card p-4 space-y-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">{MOMAMBO_COPY.labels.hotTopics}</span>
        </div>
        <div className="space-y-2.5">
          {mockTrending.hotTopics.map((topic, i) => (
            <div key={topic.name} className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-muted-foreground/40 w-4 tabular-nums">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{topic.name}</span>
                  <span className="text-[11px] text-primary font-semibold tabular-nums">{topic.heat}°</span>
                </div>
                <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${topic.heat}%` }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Growing Signals */}
      <motion.div
        className="rounded-2xl border border-border/30 bg-card p-4 space-y-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-xs font-semibold text-foreground">{MOMAMBO_COPY.labels.growingSignals}</span>
        </div>
        <div className="space-y-2">
          {mockTrending.growingSignals.map((signal) => (
            <div key={signal.label} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-muted-foreground">{signal.label}</span>
              <span className="text-sm font-semibold text-green-400">{signal.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Active Conversations + Categories */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          className="rounded-2xl border border-border/30 bg-card p-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
        >
          <MessageCircle className="w-4 h-4 text-muted-foreground/60 mb-2" />
          <p className="text-2xl font-bold text-foreground tabular-nums">{mockTrending.activeConversations}</p>
          <p className="text-[11px] text-muted-foreground/60">{MOMAMBO_COPY.labels.activeConversations}</p>
        </motion.div>

        <motion.div
          className="rounded-2xl border border-border/30 bg-card p-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
        >
          <div className="text-[11px] text-muted-foreground/60 mb-2">{MOMAMBO_COPY.labels.popularCategories}</div>
          <div className="flex flex-wrap gap-1.5">
            {mockTrending.popularCategories.map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 rounded-lg bg-muted/30 text-[11px] font-medium text-foreground/80"
              >
                {cat}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
