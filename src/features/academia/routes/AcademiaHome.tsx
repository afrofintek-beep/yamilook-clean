import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, GraduationCap, Sparkles, TrendingUp } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionCard } from '../components/SessionCard';
import { MentorCard } from '../components/MentorCard';
import { ACADEMIA_COPY } from '../copy';
import { MOCK_MENTORS } from '../mocks';
import { useAcademiaSessions } from '../hooks/useAcademia';
import { motion } from 'framer-motion';

export default function AcademiaHome() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const { data: sessions = [], isLoading } = useAcademiaSessions();

  const liveSessions = sessions.filter((s) => s.status === 'live');

  const filtered = tab === 'all'
    ? sessions
    : tab === 'free'
      ? sessions.filter((s) => !s.isPremium)
      : sessions.filter((s) => s.isPremium);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-nav px-4 pt-safe-top">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-4.5 w-4.5 text-primary" />
            </div>
            <h1 className="text-base font-bold tracking-tight text-foreground">{ACADEMIA_COPY.title}</h1>
          </div>
          <Button size="sm" variant="default" className="rounded-full gap-1.5 h-8 text-xs" onClick={() => navigate('/academia/create')}>
            <Plus className="h-3.5 w-3.5" />
            {ACADEMIA_COPY.createSession}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-6 pt-4">
        {/* Hero section */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-4"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-card p-5">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -translate-y-12 translate-x-12" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-success/5 rounded-full blur-2xl translate-y-8 -translate-x-8" />
            
            <div className="relative space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Cresce com a tua banda</p>
                  <p className="text-[11px] text-muted-foreground">{ACADEMIA_COPY.subtitle}</p>
                </div>
              </div>
              
              {/* Stats strip */}
              <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                  <span className="text-[11px] text-muted-foreground">
                    <span className="text-foreground font-semibold tabular-nums">{sessions.length}</span> sessões
                  </span>
                </div>
                <div className="w-px h-3.5 bg-border" />
                <span className="text-[11px] text-muted-foreground">
                  <span className="text-foreground font-semibold tabular-nums">{MOCK_MENTORS.length}</span> mentores
                </span>
                {liveSessions.length > 0 && (
                  <>
                    <div className="w-px h-3.5 bg-border" />
                    <span className="text-[11px] text-destructive font-medium">
                      {liveSessions.length} ao vivo
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Live now */}
        {liveSessions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="px-4"
          >
            <h2 className="text-xs font-semibold text-destructive uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
              </span>
              {ACADEMIA_COPY.liveNow}
            </h2>
            <div className="space-y-3">
              {liveSessions.map((s) => (
                <SessionCard
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  mentorName={s.mentorName}
                  format={s.format}
                  scheduledAt={s.scheduledAt}
                  date={s.date}
                  time={s.time}
                  spots={s.spots}
                  spotsLeft={s.spotsLeft}
                  isPremium={s.isPremium}
                  priceCoins={s.priceCoins}
                  isLive
                  onPress={() => navigate(`/academia/live/${s.id}`)}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Mentors carousel */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{ACADEMIA_COPY.mentors}</h2>
            <span className="text-[10px] text-muted-foreground/50">{MOCK_MENTORS.length} disponíveis</span>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2 px-4">
              {MOCK_MENTORS.map((m) => (
                <MentorCard key={m.id} {...m} onPress={() => navigate(`/academia/mentor/${m.id}`)} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </motion.section>

        {/* Sessions */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="px-4 pb-4"
        >
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full rounded-xl h-10">
              <TabsTrigger value="all" className="rounded-lg text-xs flex-1">{ACADEMIA_COPY.tabAll}</TabsTrigger>
              <TabsTrigger value="free" className="rounded-lg text-xs flex-1">{ACADEMIA_COPY.tabFree}</TabsTrigger>
              <TabsTrigger value="premium" className="rounded-lg text-xs flex-1">{ACADEMIA_COPY.tabPremium}</TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="mt-4 space-y-3">
              {isLoading && (
                <div className="space-y-3">
                  <Skeleton className="h-28 w-full rounded-2xl" />
                  <Skeleton className="h-28 w-full rounded-2xl" />
                </div>
              )}
              {!isLoading && filtered.map((s) => (
                <SessionCard
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  mentorName={s.mentorName}
                  format={s.format}
                  scheduledAt={s.scheduledAt}
                  date={s.date}
                  time={s.time}
                  spots={s.spots}
                  spotsLeft={s.spotsLeft}
                  isPremium={s.isPremium}
                  priceCoins={s.priceCoins}
                  isLive={s.status === 'live'}
                  status={s.status}
                  onPress={() => navigate(
                    s.status === 'live'
                      ? `/academia/live/${s.id}`
                      : `/academia/${s.id}`
                  )}
                />
              ))}
              {!isLoading && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-card border border-border/30 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground">Sem sessões de momento.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.section>
      </div>

      <BottomNav />
    </div>
  );
}
