import { useParams, useNavigate } from 'react-router-dom';
import { EmptyStateBack } from '@/components/common/EmptyStateBack';
import { ArrowLeft, Radio, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PalcoMockCard, type PalcoMockItem } from '../components/PalcoMockCard';
import { SPACES, MOKUBICO_COPY } from '../copy';
import { motion } from 'framer-motion';
import BottomNav from '@/components/BottomNav';

/* Mock palcos per space */
const MOCK_PALCOS: Record<string, PalcoMockItem[]> = {
  quintal: [
    { id: 'p1', title: 'Conversa sobre kuduro', hostName: 'Marfox', listeners: 24, isLive: true },
    { id: 'p2', title: 'Beats angolanos', hostName: 'Puto Português', listeners: 0, isLive: false },
  ],
  sala: [
    { id: 'p3', title: 'Papo da banda', hostName: 'Tchissola', listeners: 8, isLive: false },
  ],
  cozinha: [
    { id: 'p4', title: 'Girls talk', hostName: 'Ana Bela', listeners: 15, isLive: false },
  ],
  quarto: [],
};

export default function SpaceView() {
  const { space } = useParams<{ space: string }>();
  const navigate = useNavigate();

  const config = SPACES.find((s) => s.key === space);
  const palcos = MOCK_PALCOS[space ?? ''] ?? [];

  if (!config) {
    return <EmptyStateBack message="Espaço não encontrado." fallbackRoute="/mokubico" />;
  }

  const hasLive = palcos.some((p) => p.isLive);

  return (
    <div className="flex min-h-screen-safe flex-col bg-background pb-[calc(11rem+env(safe-area-inset-bottom,0px))]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border/30 px-4 safe-top">
        <div className="flex items-center gap-3 h-14">
          <button onClick={() => navigate('/mokubico')} className="p-1.5 -ml-1 rounded-lg hover:bg-card transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-lg">{config.emoji}</span>
            <h1 className="text-sm font-bold text-foreground truncate">{config.title}</h1>
            {hasLive && (
              <Badge className="bg-destructive/15 text-destructive text-[10px] px-2 py-0.5 rounded-full gap-1 shrink-0 border-0">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
                </span>
                {MOKUBICO_COPY.liveBadge}
              </Badge>
            )}
          </div>
        </div>

        {/* Space description */}
        <motion.div 
          className="pb-3 -mt-1"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-xs text-muted-foreground leading-relaxed">{config.description}</p>
          <span className="text-[10px] text-muted-foreground/50 mt-1 inline-block">Acesso: {config.access}</span>
        </motion.div>
      </header>

      {/* Palcos list */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-3">
        {palcos.length === 0 ? (
          <motion.div 
            className="flex flex-col items-center justify-center py-20 text-center gap-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="h-16 w-16 rounded-2xl bg-card border border-border/30 flex items-center justify-center">
              <Radio className="h-7 w-7 text-muted-foreground/30" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{MOKUBICO_COPY.emptySpace}</p>
              <p className="text-xs text-muted-foreground/50">{MOKUBICO_COPY.beFirst}</p>
            </div>
            <Button
              variant="default"
              className="rounded-full mt-2 gap-1.5"
              onClick={() => navigate('/palco/create')}
            >
              <Plus className="h-4 w-4" />
              {MOKUBICO_COPY.openRoda}
            </Button>
          </motion.div>
        ) : (
          palcos.map((p, i) => <PalcoMockCard key={p.id} palco={p} index={i} />)
        )}
      </div>

      {/* Fixed bottom CTA - only show when there are existing rooms */}
      {palcos.length > 0 && (
        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px)+0.75rem)] left-0 right-0 z-40 p-4">
          <Button
            className="w-full rounded-full shadow-glow gap-1.5"
            onClick={() => navigate('/palco/create')}
          >
            <Plus className="h-4 w-4" />
            {MOKUBICO_COPY.openRoda}
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
