import { motion } from 'framer-motion';
import { Zap, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { MOMAMBO_COPY } from '../copy';
import { useStrengthInsights } from '../hooks/useMomamboData';

export default function StrengthInsights() {
  const { data, isLoading } = useStrengthInsights();

  const empty = !isLoading && (!data || !data.hasData);

  const insights = data?.hasData
    ? [
        data.bestContentType && {
          key: 'content',
          label: MOMAMBO_COPY.labels.bestContentType,
          icon: Zap,
          value: `${data.bestContentType.icon} ${data.bestContentType.type}`,
          sub: `${data.bestContentType.sharePct}% do teu engajamento`,
          progress: data.bestContentType.sharePct,
        },
        data.bestTime && {
          key: 'time',
          label: MOMAMBO_COPY.labels.bestTime,
          icon: Clock,
          value: data.bestTime.time,
          sub: data.bestTime.day,
          progress: data.bestTime.sharePct,
        },
      ].filter(Boolean as unknown as <T>(x: T | null | undefined | false) => x is T)
    : [];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/60 px-1">
        {MOMAMBO_COPY.sections.strength}
      </h2>

      {empty ? (
        <div className="rounded-2xl border border-border/20 bg-card/50 p-6 text-center">
          <p className="text-sm text-muted-foreground/50">Sem dados ainda</p>
        </div>
      ) : (
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
      )}
    </section>
  );
}
