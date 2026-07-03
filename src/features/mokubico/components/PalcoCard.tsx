import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { MOKUBICO_COPY } from '../copy';

export interface PalcoItem {
  id: string;
  title: string;
  hostName: string;
  listeners: number;
  isLive: boolean;
  palcoId?: string;
}

interface PalcoCardProps {
  palco: PalcoItem;
  index?: number;
}

export function PalcoCard({ palco, index = 0 }: PalcoCardProps) {
  const navigate = useNavigate();

  const handleJoin = () => {
    if (palco.palcoId) {
      navigate(`/palco/${palco.palcoId}/roda/${palco.id}`);
    } else {
      navigate(`/palco/${palco.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className={`rounded-2xl border bg-card p-4 space-y-3 transition-all duration-200 active:scale-[0.98] cursor-pointer ${
        palco.isLive ? 'border-destructive/25 shadow-[0_0_20px_rgba(239,68,68,0.08)]' : 'border-border/30 hover:border-border/50'
      }`}
      onClick={handleJoin}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="text-xs bg-secondary text-secondary-foreground font-semibold">
              {palco.hostName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-foreground leading-tight truncate">{palco.title}</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">{palco.hostName}</p>
          </div>
        </div>
        {palco.isLive && (
          <Badge className="bg-destructive/15 text-destructive text-[10px] px-2 py-0.5 rounded-full gap-1 shrink-0 border-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
            </span>
            {MOKUBICO_COPY.liveBadge}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between">
        {palco.listeners > 0 ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Headphones className="h-3.5 w-3.5" />
            {palco.listeners} {MOKUBICO_COPY.listeners}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">Sê o primeiro</span>
        )}

        <Button
          size="sm"
          variant={palco.isLive ? 'destructive' : 'secondary'}
          className="rounded-full text-[11px] h-8 px-4"
          onClick={(e) => {
            e.stopPropagation();
            handleJoin();
          }}
        >
          {palco.isLive ? MOKUBICO_COPY.enterPalco : MOKUBICO_COPY.openRoda}
        </Button>
      </div>
    </motion.div>
  );
}
