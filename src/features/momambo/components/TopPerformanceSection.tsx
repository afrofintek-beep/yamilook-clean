import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Heart, Mic, Radio, GraduationCap, FileText } from 'lucide-react';
import { MOMAMBO_COPY } from '../copy';
import { mockTopPerformance } from '../mocks';

const TABS = [
  { key: 'posts', label: MOMAMBO_COPY.labels.posts, icon: FileText },
  { key: 'voices', label: MOMAMBO_COPY.labels.voices, icon: Mic },
  { key: 'lives', label: MOMAMBO_COPY.labels.lives, icon: Radio },
  { key: 'academy', label: MOMAMBO_COPY.labels.academy, icon: GraduationCap },
] as const;

type TabKey = typeof TABS[number]['key'];

function formatNumber(n: number) {
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

const TYPE_ICONS: Record<string, string> = {
  post: '📝',
  voice: '🎙️',
  live: '📡',
  academy: '🎓',
};

export default function TopPerformanceSection() {
  const [activeTab, setActiveTab] = useState<TabKey>('posts');
  const items = mockTopPerformance[activeTab];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/60 px-1">
        {MOMAMBO_COPY.sections.topPerformance}
      </h2>

      {/* Tab bar */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'bg-muted/20 text-muted-foreground border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="space-y-2.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {items.length === 0 ? (
            <div className="rounded-2xl border border-border/20 bg-card/50 p-6 text-center">
              <p className="text-sm text-muted-foreground/50">Sem dados ainda</p>
            </div>
          ) : (
            items.map((item, i) => (
              <motion.div
                key={item.id}
                className="rounded-2xl border border-border/30 bg-card p-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{TYPE_ICONS[item.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-muted-foreground/50" />
                        <span className="text-[11px] text-muted-foreground/70 tabular-nums">{formatNumber(item.views)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-muted-foreground/50" />
                        <span className="text-[11px] text-muted-foreground/70 tabular-nums">{formatNumber(item.likes)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
