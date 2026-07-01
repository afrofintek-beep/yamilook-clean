import { cn } from '@/lib/utils';

interface ShimmerSkeletonProps {
  className?: string;
  /** Circle variant for avatars */
  circle?: boolean;
  /** Show text lines skeleton */
  lines?: number;
  /** Card variant with avatar + lines */
  card?: boolean;
  /** Post card variant */
  post?: boolean;
  /** Conversation item variant */
  conversation?: boolean;
}

export function ShimmerSkeleton({ className, circle, lines, card, post, conversation }: ShimmerSkeletonProps) {
  if (circle) {
    return <div className={cn('shimmer-loading rounded-full', className)} />;
  }

  if (lines) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'shimmer-loading h-3 rounded',
              i === lines - 1 && 'w-3/4'
            )}
          />
        ))}
      </div>
    );
  }

  if (card) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="shimmer-loading w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="shimmer-loading h-4 w-24 rounded" />
          <div className="shimmer-loading h-3 w-32 rounded" />
        </div>
      </div>
    );
  }

  if (post) {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4">
          <div className="shimmer-loading w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="shimmer-loading h-3.5 w-24 rounded" />
            <div className="shimmer-loading h-2.5 w-16 rounded" />
          </div>
        </div>
        {/* Image */}
        <div className="shimmer-loading w-full aspect-[4/3]" />
        {/* Actions */}
        <div className="flex items-center gap-4 px-4">
          <div className="shimmer-loading w-8 h-8 rounded-full" />
          <div className="shimmer-loading w-8 h-8 rounded-full" />
          <div className="shimmer-loading w-8 h-8 rounded-full" />
        </div>
      </div>
    );
  }

  if (conversation) {
    return (
      <div className={cn('flex items-center gap-3 p-4', className)}>
        <div className="shimmer-loading w-14 h-14 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="shimmer-loading h-4 w-32 rounded" />
          <div className="shimmer-loading h-3 w-48 rounded" />
        </div>
        <div className="shimmer-loading h-3 w-10 rounded" />
      </div>
    );
  }

  return <div className={cn('shimmer-loading rounded-md', className)} />;
}

// Feed skeleton with multiple posts
export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6 py-4">
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerSkeleton key={i} post />
      ))}
    </div>
  );
}

// Conversations list skeleton
export function ConversationsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="divide-y divide-border/30">
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerSkeleton key={i} conversation />
      ))}
    </div>
  );
}

// Status ring skeleton
export function StatusSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-4 p-4 overflow-x-auto scrollbar-hide">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className="shimmer-loading w-16 h-16 rounded-full" />
          <div className="shimmer-loading h-2.5 w-12 rounded" />
        </div>
      ))}
    </div>
  );
}

export default ShimmerSkeleton;
