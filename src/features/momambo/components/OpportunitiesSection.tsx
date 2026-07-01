import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOMAMBO_COPY } from '../copy';
import { mockOpportunities } from '../mocks';

const URGENCY_STYLES = {
  high: 'border-primary/30 bg-gradient-to-r from-primary/8 to-card',
  medium: 'border-border/30 bg-card',
  low: 'border-border/20 bg-card/80',
} as const;

export default function OpportunitiesSection() {
  const navigate = useNavigate();

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/60 px-1">
        {MOMAMBO_COPY.sections.opportunities}
      </h2>

      <div className="space-y-2.5">
        {mockOpportunities.map((opp, i) => (
          <motion.button
            key={opp.id}
            className={`w-full rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${URGENCY_STYLES[opp.urgency]}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            onClick={() => navigate(opp.route)}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none mt-0.5">{opp.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{opp.title}</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                </div>
                <p className="text-[12px] text-muted-foreground/70 mt-0.5 leading-relaxed">
                  {opp.description}
                </p>
              </div>
            </div>
            {opp.urgency === 'high' && (
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Recomendado agora</span>
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </section>
  );
}
