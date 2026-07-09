import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { EmptyStateBack } from '@/components/common/EmptyStateBack';
import { ArrowLeft, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PalcoCard } from '../components/PalcoCard';
import { GenderPromptCard } from '../components/GenderPromptCard';
import { SPACES, MOKUBICO_COPY } from '../copy';
import { useSpaceRodas } from '../hooks/useMokubicoData';
import { useAuth } from '@/hooks/useAuth';
import BottomNav from '@/components/BottomNav';

export default function MokubicoSpace() {
  const { space } = useParams<{ space: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const config = SPACES.find((s) => s.key === space);
  const { data: rodas = [], isLoading } = useSpaceRodas(space ?? '');

  if (!config) {
    return <EmptyStateBack message="Espaço não encontrado." fallbackRoute="/mokubico" />;
  }

  const hasLive = rodas.some((p) => p.isLive);
  // Legacy accounts with no gender on file can't be placed in the Cozinha das
  // Sis — ask them to self-declare before showing the space.
  const needsGender = config.key === 'cozinha' && !!profile && !profile.gender;

  return (
    <div className="flex min-h-screen-safe flex-col bg-background pb-[calc(11rem+env(safe-area-inset-bottom,0px))]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40 px-4 safe-top">
        <div className="flex items-center gap-3 h-14">
          <button onClick={() => navigate('/mokubico')} className="p-1 -ml-1">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-lg">{config.emoji}</span>
            <h1 className="text-sm font-bold text-foreground truncate">{config.title}</h1>
            {hasLive && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 rounded-full animate-pulse gap-1 shrink-0">
                <Radio className="h-2.5 w-2.5" />
                {MOKUBICO_COPY.liveBadge}
              </Badge>
            )}
          </div>
        </div>

        <div className="pb-3 -mt-1">
          <p className="text-xs text-muted-foreground">{config.description}</p>
          <p className="text-[10px] text-muted-foreground/70 tracking-wide mt-1">Acesso: {config.access}</p>
        </div>
      </header>

      {/* Rodas list */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-3">
        {needsGender ? (
          <GenderPromptCard
            onSaved={() => queryClient.invalidateQueries({ queryKey: ['mokubico-space-rodas'] })}
          />
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : rodas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl">{config.emoji}</span>
            </div>
            <p className="text-sm text-muted-foreground">{MOKUBICO_COPY.emptySpace}</p>
            <p className="text-xs text-muted-foreground/70">{MOKUBICO_COPY.beFirst}</p>
          </div>
        ) : (
          rodas.map((r) => (
            <PalcoCard
              key={r.id}
              palco={{
                id: r.id,
                title: r.title,
                hostName: r.hostName,
                listeners: r.listeners,
                isLive: r.isLive,
                palcoId: r.palcoId,
              }}
            />
          ))
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px)+0.75rem)] left-0 right-0 z-40 p-4">
        <Button
          className="w-full rounded-full shadow-glow"
          onClick={() => navigate(`/palco/create?space=${config.key}`)}
        >
          {MOKUBICO_COPY.openRoda}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
