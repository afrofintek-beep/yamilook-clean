import { motion } from 'framer-motion';
import { MessageCircle, TrendingUp } from 'lucide-react';
import { MOMAMBO_COPY } from '../copy';
import { useTrendingSignals } from '../hooks/useMomamboData';

export default function TrendingSection() {
  const { data } = useTrendingSignals();
  const growingSignals = data?.growingSignals ?? [];
  const activeConversations = data?.activeConversations ?? 0;

  // Hot topics & popular categories have no backing data system in the DB,
  // so this section only surfaces what's genuinely available. If there's
  // nothing real to show, hide the section entirely.
  if (growingSignals.length === 0 && activeConversations === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/60 px-1">
        {MOMAMBO_COPY.sections.trending}
      </h2>

      {/* Growing Signals */}
      {growingSignals.length > 0 && (
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
            {growingSignals.map((signal) => (
              <div key={signal.label} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-muted-foreground">{signal.label}</span>
                <span className="text-sm font-semibold text-green-400">{signal.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Active Conversations */}
      <motion.div
        className="rounded-2xl border border-border/30 bg-card p-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15 }}
      >
        <MessageCircle className="w-4 h-4 text-muted-foreground/60 mb-2" />
        <p className="text-2xl font-bold text-foreground tabular-nums">{activeConversations}</p>
        <p className="text-[11px] text-muted-foreground/60">{MOMAMBO_COPY.labels.activeConversations}</p>
      </motion.div>
    </section>
  );
}
