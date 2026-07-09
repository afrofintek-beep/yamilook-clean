import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Radio, Coins, ChevronRight, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ActiveStream } from '@/hooks/useActiveStreams';

/**
 * Desktop-only right rail for the feed. Fills the space next to the centered
 * column with genuinely useful, on-brand Yamilook content rather than filler:
 * the user's Kumbu balance and the bandas that are live right now.
 */
export function FeedSidebar({ activeStreams }: { activeStreams: ActiveStream[] }) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const kumbu = profile?.kumbu_available ?? 0;
  const level = profile?.level ?? 'Bronze';

  return (
    <div className="sticky top-4 space-y-4">
      {/* Kumbu */}
      <button
        onClick={() => navigate('/kumbu')}
        className="w-full text-left rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/40"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-primary" /> A tua Kumbu
          </span>
          <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">{level}</span>
        </div>
        <div className="text-2xl font-bold tabular-nums">{kumbu.toLocaleString('pt-AO')}</div>
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          Ver carteira <ChevronRight className="w-3 h-3" />
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
