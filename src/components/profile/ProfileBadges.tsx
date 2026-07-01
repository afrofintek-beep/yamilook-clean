import { motion } from 'framer-motion';
import { Crown, Users, ShieldCheck, Star } from 'lucide-react';

interface ProfileBadge {
  type: 'founder' | 'community' | 'verified' | 'creator' | string;
  label: string;
}

interface ProfileBadgesProps {
  badges: ProfileBadge[];
}

const badgeConfig: Record<string, { icon: React.ElementType; bgClass: string; textClass: string; borderClass: string }> = {
  founder: {
    icon: Crown,
    bgClass: 'bg-[#C9A23F]/8',
    textClass: 'text-[#C9A23F]',
    borderClass: 'border-[#C9A23F]/20',
  },
  community: {
    icon: Users,
    bgClass: 'bg-primary/8',
    textClass: 'text-primary',
    borderClass: 'border-primary/20',
  },
  verified: {
    icon: ShieldCheck,
    bgClass: 'bg-primary/8',
    textClass: 'text-primary',
    borderClass: 'border-primary/20',
  },
  creator: {
    icon: Star,
    bgClass: 'bg-primary/8',
    textClass: 'text-primary',
    borderClass: 'border-primary/20',
  },
};

export function ProfileBadges({ badges }: ProfileBadgesProps) {
  if (!badges || badges.length === 0) return null;

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-2 px-6 mb-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
    >
      {badges.map((badge, index) => {
        const config = badgeConfig[badge.type] || {
          icon: Star,
          bgClass: 'bg-muted/60',
          textClass: 'text-muted-foreground',
          borderClass: 'border-border/30',
        };
        const Icon = config.icon;

        return (
          <motion.div
            key={badge.type}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold ${config.bgClass} ${config.textClass} ${config.borderClass}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.08 }}
          >
            <Icon className="w-3 h-3" strokeWidth={2} />
            {badge.label}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
