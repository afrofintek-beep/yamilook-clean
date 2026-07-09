import { useNavigate } from 'react-router-dom';
import { Radio, ChevronRight, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ActiveStream } from '@/hooks/useActiveStreams';

/**
 * Desktop-only right rail for the feed. Fills the space next to the centered
 * column with on-brand Yamilook content: a branded Kumbu cover (entry point to
 * the wallet, no balance exposed) and the bandas that are live right now.
 */
export function FeedSidebar({ activeStreams }: { activeStreams: ActiveStream[] }) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-4 space-y-4">
      {/* Kumbu — branded cover, not a balance readout */}
      <button
        onClick={() => navigate('/kumbu')}
        aria-label="Abrir a carteira Kumbu"
        className="group relative block w-full overflow-hidden rounded-2xl bg-gradient-primary p-5 text-left text-white shadow-md transition-transform hover:scale-[1.02]"
      >
        {/* soft glow + oversized coin motif */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-3 -right-1 select-none text-7xl leading-none opacity-20 rotate-12">🪙</div>
        <div className="relative">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">Yamilook</div>
          <div className="mt-0.5 text-3xl font-extrabold tracking-tight drop-shadow-sm">KUMBU</div>
          <div className="mt-1 text-xs text-white/85">Kumbu é valor</div>
          <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">
            Abrir a tua carteira
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </button>

      {/* Bandas ao vivo agora */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Radio className="w-4 h-4 text-destructive" />
          <span className="text-sm font-semibold">Bandas ao vivo</span>
        </div>
        {activeStreams.length === 0 ? (
          <p className="text-xs text-muted-foreground">Ninguém ao vivo agora. Sê o primeiro a abrir a tua banda!</p>
        ) : (
          <div className="space-y-1">
            {activeStreams.slice(0, 4).map((s) => (
              <button
                key={s.id}
                onClick={() => navigate('/live')}
                className="w-full flex items-center gap-2.5 text-left rounded-xl p-1.5 transition-colors hover:bg-secondary/50"
              >
                <div className="relative shrink-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={s.host.avatar_url ?? undefined} />
                    <AvatarFallback>{(s.host.display_name ?? '?').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive border-2 border-card" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{s.host.display_name}</div>
                  <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Users className="w-3 h-3 shrink-0" />
                    {s.viewer_count} · {s.title}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground/50 px-1">Yamilook · a vida na tua banda</p>
    </div>
  );
}
