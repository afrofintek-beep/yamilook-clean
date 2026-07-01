import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HelpCircle, History, Trophy } from 'lucide-react';
import KumbuBalanceCard from '../components/KumbuBalanceCard';
import KumbuHowToEarn from '../components/KumbuHowToEarn';
import { TAGLINE_FULL } from '../copy';

export default function KumbuWallet() {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-nav safe-top">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <h1 className="text-base font-bold flex-1 tracking-tight">Carteira Kumbu</h1>
          <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={() => navigate('/kumbu/history')}>
            <History className="h-4.5 w-4.5" />
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5 space-y-4">
        <KumbuBalanceCard />

        <div className="flex gap-2">
          <motion.button
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-card border border-border/30 text-[13px] font-medium text-foreground/80 transition-colors hover:bg-card/80"
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowHelp(true)}
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground/50" />
            Como ganhar?
          </motion.button>
          <motion.button
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-card border border-border/30 text-[13px] font-medium text-foreground/80 transition-colors hover:bg-card/80"
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/ranking')}
          >
            <Trophy className="h-4 w-4 text-[#C9A23F]" />
            Ranking
          </motion.button>
        </div>

        <p className="text-[11px] text-muted-foreground/40 text-center leading-relaxed px-4 pt-2">
          {TAGLINE_FULL}
        </p>
      </main>

      <KumbuHowToEarn open={showHelp} onOpenChange={setShowHelp} />
    </div>
  );
}
