import { motion } from 'framer-motion';
import { Zap, Clock, Tag, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { MOMAMBO_COPY } from '../copy';
import { mockStrength } from '../mocks';

const insights = [
  {
    key: 'content',
    label: MOMAMBO_COPY.labels.bestContentType,
    icon: Zap,
    value: `${mockStrength.bestContentType.icon} ${mockStrength.bestContentType.type}`,
    sub: `${mockStrength.bestContentType.confidence}% confiança`,
    progress: mockStrength.bestContentType.confidence,
  },
  {
    key: 'time',
    label: MOMAMBO_COPY.labels.bestTime,
    icon: Clock,
    value: mockStrength.bestTime.time,
    sub: mockStrength.bestTime.day,
    progress: mockStrength.bestTime.confidence,
  },
  {
    key: 'category',
    label: MOMAMBO_COPY.labels.strongestCategory,
    icon: Tag,
    value: mockStrength.strongestCategory.name,
    sub: `Score: ${mockStrength.strongestCategory.score}`,
    progress: mockStrength.strongestCategory.score,
  },
];

export default function StrengthInsights() {
  const { audienceBehavior } = mockStrength;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/60 px-1">
        {MOMAMBO_COPY.sections.strength}
      </h2>

      <div className="space-y-3">
        {insights.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.key}
              className="rounded-2xl border border-border/30 bg-card p-4"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.06 }}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground/50 uppercase tracking-wider mb-0.5">
                    {item.label}
                  </p>
                  <p className="text-base font-semibold text-foreground leading-tight">{item.value}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">{item.sub}</p>
                  <Progress value={item.progress} className="h-1 mt-2" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Audience behavior card */}
      <motion.div
        className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-card to-card p-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">{MOMAMBO_COPY.labels.audienceBehavior}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Dia de pico', value: audienceBehavior.peakDay },
            { label: 'Sessão média', value: `${audienceBehavior.avgSessionMin} min` },
            { label: 'Taxa de retorno', value: `${audienceBehavior.returnRate}%` },
            { label: 'Top cidade', value: audienceBehavior.topCity },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{stat.label}</p>
              <p className="text-sm font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
