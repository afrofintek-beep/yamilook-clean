import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, MapPin, Sparkles } from 'lucide-react';
import { useAdvertising, LocationMarket } from '@/hooks/useAdvertising';
import { FeaturedBusinessCard } from './FeaturedBusinessCard';

interface LocalBusinessSectionProps {
  userCity?: string;
  userMarket?: LocationMarket;
  title?: string;
  onViewAll?: () => void;
}

export function LocalBusinessSection({ 
  userCity, 
  userMarket,
  title,
  onViewAll 
}: LocalBusinessSectionProps) {
  const { t } = useTranslation();
  const { fetchFeaturedBusinesses } = useAdvertising();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRef = useRef(fetchFeaturedBusinesses);
  fetchRef.current = fetchFeaturedBusinesses;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const data = await fetchRef.current(userCity, 6);
      if (!cancelled) {
        setBusinesses(data);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userCity]);

  // Don't hide section during loading, only hide if no businesses after load
  if (!loading && businesses.length === 0) {
    return null;
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{title || t('discover.localBusinesses')}</h3>
            {userCity && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {userCity}
              </p>
            )}
          </div>
        </div>
        {onViewAll && businesses.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            {t('discover.viewAll')}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide touch-pan-x">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-64 h-48 rounded-xl shrink-0" />
          ))}
        </div>
      ) : (
        <div 
          className="flex gap-3 px-4 pb-2 overflow-x-auto scrollbar-hide touch-pan-x"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {businesses.map((ad, index) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="w-64 flex-shrink-0 flex-grow-0"
              style={{ minWidth: '256px' }}
            >
              <FeaturedBusinessCard ad={ad} userMarket={userMarket} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
