import { useNavigate } from 'react-router-dom';
import { GraduationCap, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SpaceCard } from '../components/SpaceCard';
import { LiveSummaryCard } from '../components/LiveSummaryCard';
import { MOKUBICO_COPY, SPACES } from '../copy';
import BottomNav from '@/components/BottomNav';
import { useLiveSpaces } from '../hooks/useMokubicoData';
import { MOCK_SESSIONS } from '@/features/academia/mocks';
import { ACADEMIA_COPY } from '@/features/academia/copy';
import { motion } from 'framer-motion';

export default function MokubHome() {
  const navigate = useNavigate();
  const { data: liveSpaces } = useLiveSpaces();
  const LIVE_SPACES = liveSpaces ?? new Set<string>();

  const upcomingSessions = MOCK_SESSIONS.filter(s => s.status === 'scheduled').slice(0, 2);

  return (
    <div className="flex min-h-screen-safe flex-col bg-background pb-[calc(5rem+env(safe-area-inset-bottom,0px)+1rem)]">
      {/* Header - glass morphism */}
      <header className="sticky top-0 z-30 glass-nav px-4 safe-top">
        <div className="flex items-center gap-3 h-14">
          <motion.div 
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-lg">🏠</span>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground">{MOKUBICO_COPY.title}</h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">{MOKUBICO_COPY.subtitle}</p>
            </div>
          </motion.div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-6 px-4 pt-5">
        {/* Live summary */}
        <LiveSummaryCard />

        {/* Spaces grid - visual cards */}
        <section className="space-y-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center justify-between"
          >
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {MOKUBICO_COPY.chooseSpace}
            </h2>
            <span className="text-[10px] text-muted-foreground/50">{SPACES.length} espaços</span>
          </motion.div>
          <div className="space-y-3">
            {SPACES.map((space, i) => (
              <SpaceCard
                key={space.key}
                space={space}
                isLive={LIVE_SPACES.has(space.key)}
                index={i}
              />
            ))}
          </div>
        </section>

        {/* Academia da Banda */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="pb-4"
        >
          <Card className="border-border/30 overflow-hidden">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-primary" />
                </div>
                {ACADEMIA_COPY.title}
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-primary h-auto p-0 gap-0.5 font-semibold"
                onClick={() => navigate('/academia')}
              >
                Ver tudo
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-3">
              <p className="text-xs text-muted-foreground">{ACADEMIA_COPY.subtitle}</p>

              {upcomingSessions.map((s) => (
                <motion.div
                  key={s.id}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-between rounded-xl border border-border/30 bg-secondary/30 p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => navigate(`/academia/${s.id}`)}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{s.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {s.date} • {s.isPremium ? `${s.priceCoins} coins` : ACADEMIA_COPY.tabFree}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full text-[10px] h-7 px-3 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/academia');
                    }}
                  >
                    Explorar
                  </Button>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.section>
      </div>

      <BottomNav />
    </div>
  );
}
