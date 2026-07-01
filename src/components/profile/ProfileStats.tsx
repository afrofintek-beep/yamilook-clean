import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Globe, Heart, Image as ImageIcon, Eye, FileText, Film, Sparkles } from 'lucide-react';

interface StatItem {
  icon: 'users' | 'messageSquare' | 'globe' | 'heart' | 'image' | 'eye' | 'posts' | 'ritmos' | 'momambos' | string;
  label: string;
  value: number;
  onClick?: () => void;
  ownerOnly?: boolean;
}

interface ProfileStatsProps {
  items: StatItem[];
  hideZeros?: boolean;
  animateCountUp?: boolean;
  isOwner?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  users: Users,
  messageSquare: MessageSquare,
  globe: Globe,
  heart: Heart,
  image: ImageIcon,
  eye: Eye,
  posts: FileText,
  ritmos: Film,
  momambos: Sparkles,
};

function AnimatedNumber({ value, animate }: { value: number; animate: boolean }) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);

  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      return;
    }

    const duration = 800;
    const steps = 25;
    const stepValue = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(stepValue * step), value);
      setDisplayValue(current);

      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, animate]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return <span>{formatNumber(displayValue)}</span>;
}

export function ProfileStats({
  items,
  hideZeros = true,
  animateCountUp = true,
  isOwner = false,
}: ProfileStatsProps) {
  const filteredItems = items.filter((item) => {
    if (item.ownerOnly && !isOwner) return false;
    if (hideZeros && item.value === 0) return false;
    return true;
  });

  if (filteredItems.length === 0) return null;

  return (
    <motion.div
      className="mb-5 px-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
    >
      <div className="flex justify-center gap-1">
        {filteredItems.map((stat, index) => {
          const Icon = iconMap[stat.icon] || FileText;

          return (
            <motion.button
              key={stat.label}
              className={`flex flex-col items-center py-3 px-4 rounded-xl transition-colors min-w-[72px] ${
                stat.onClick ? 'hover:bg-card active:scale-95' : ''
              }`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              onClick={stat.onClick}
              disabled={!stat.onClick}
            >
              <span className="text-lg font-bold text-foreground leading-none tabular-nums">
                <AnimatedNumber value={stat.value} animate={animateCountUp} />
              </span>
              <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium mt-1">
                {stat.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
