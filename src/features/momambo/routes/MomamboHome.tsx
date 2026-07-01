import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import PerformanceCards from '../components/PerformanceCards';
import TrendingSection from '../components/TrendingSection';
import StrengthInsights from '../components/StrengthInsights';
import OpportunitiesSection from '../components/OpportunitiesSection';
import TopPerformanceSection from '../components/TopPerformanceSection';
import { MOMAMBO_COPY } from '../copy';

export default function MomamboHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-nav safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary" strokeWidth={1.8} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-none">{MOMAMBO_COPY.title}</h1>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">{MOMAMBO_COPY.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        className="px-4 py-4 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <PerformanceCards />
        <TrendingSection />
        <StrengthInsights />
        <OpportunitiesSection />
        <TopPerformanceSection />
      </motion.div>

      <BottomNav />
    </div>
  );
}
