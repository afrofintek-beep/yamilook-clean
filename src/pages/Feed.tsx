import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Search, MessageCircle, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PostCard } from '@/components/feed/PostCard';
import { CreatePostSheet } from '@/components/feed/CreatePostSheet';
import { CommentsSheet } from '@/components/feed/CommentsSheet';
import { StatusList } from '@/components/status/StatusList';
import { SponsoredPostCard } from '@/components/advertising/SponsoredPostCard';
import BottomNav from '@/components/BottomNav';
import { FeedSkeleton } from '@/components/ui/ShimmerSkeleton';
import { preloadImages } from '@/components/ui/OptimizedImage';
import { LiveIndicatorBadge } from '@/components/live/LiveIndicatorBadge';
import { LivePreviewTooltip } from '@/components/live/LivePreviewTooltip';
import { usePosts, PostWithUser } from '@/hooks/usePosts';
import { useAdvertising, Advertisement, BusinessProfile } from '@/hooks/useAdvertising';
import { useActiveStreams } from '@/hooks/useActiveStreams';
import { useArchivedPosts } from '@/hooks/useArchivedPosts';
import YamilookLogo from '@/components/brand/YamilookLogo';

export default function Feed() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { feedPosts, loading, fetchFeedPosts } = usePosts();
  const { fetchActiveAdsForFeed, interleaveAdsInFeed } = useAdvertising();
  const { hasActiveStreams, activeStreams } = useActiveStreams();
  const { archivedPostIds, fetchArchivedIds, toggleArchive, isArchived } = useArchivedPosts();
  
  const [createOpen, setCreateOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostWithUser | null>(null);
  type FeedItem = PostWithUser | (Advertisement & { business: BusinessProfile; isAd: true });
  const [feedWithAds, setFeedWithAds] = useState<FeedItem[]>([]);

  // Refresh feed when create sheet closes (different hook instances don't share state)
  const handleCreateOpenChange = (open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      fetchFeedPosts();
    }
  };

  // Load archived post IDs on mount
  useEffect(() => {
    fetchArchivedIds();
  }, [fetchArchivedIds]);

  // Load ads and interleave with feed, filtering out archived posts
  useEffect(() => {
    const loadAds = async () => {
      // Filter out archived posts
      const visiblePosts = feedPosts.filter(p => !archivedPostIds.has(p.id));
      
      if (visiblePosts.length === 0) {
        setFeedWithAds([]);
        return;
      }
      const ads = await fetchActiveAdsForFeed(undefined, visiblePosts.length);
      const combined = interleaveAdsInFeed(visiblePosts, ads);
      setFeedWithAds(combined);
    };
    loadAds();
  }, [feedPosts, archivedPostIds, fetchActiveAdsForFeed, interleaveAdsInFeed]);

  // Preload images for first 5 posts (Instagram-style prefetching)
  useEffect(() => {
    if (feedPosts.length > 0) {
      const imageUrls = feedPosts
        .slice(0, 5)
        .flatMap(post => post.media_urls || []);
      preloadImages(imageUrls);
    }
  }, [feedPosts]);

  const handleCommentClick = (post: PostWithUser) => {
    setSelectedPost(post);
    setCommentsOpen(true);
  };

  return (
    <div className="min-h-screen bg-card flex flex-col">
      {/* Header - Clean, minimal */}
      <header className="sticky top-0 z-50 bg-card border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 py-2">
          <YamilookLogo size="sm" showTagline={false} animate={false} bgClassName="bg-card" />
          <div className="flex items-center gap-1">
            <LivePreviewTooltip activeStreams={activeStreams} hasActiveStreams={hasActiveStreams}>
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full text-destructive"
                  onClick={() => navigate('/live')}
                >
                  <Radio className="w-5 h-5" />
                </Button>
                {hasActiveStreams && <LiveIndicatorBadge />}
              </div>
            </LivePreviewTooltip>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={() => navigate('/discover')}
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={() => navigate('/')}
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1">
        {/* Status stories */}
        <div className="border-b border-border">
          <StatusList />
        </div>

        {/* Feed posts */}
        <div className="bg-card">
          {loading ? (
            <FeedSkeleton count={3} />
          ) : feedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Ainda não há partilhas na tua comunidade</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Partilha o que se passa à tua volta.
              </p>
              <Button 
                className="rounded-full bg-primary text-primary-foreground px-6"
                onClick={() => handleCreateOpenChange(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar publicação
              </Button>
            </div>
          ) : feedWithAds.length === 0 ? null : (
            <>
              {feedWithAds.map((item) => (
                <div key={item.id}>
                  {'isAd' in item ? (
                    <div className="py-2">
                      <SponsoredPostCard ad={item} />
                    </div>
                  ) : (
                    <PostCard 
                      post={item} 
                      onCommentClick={() => handleCommentClick(item)}
                      isArchived={isArchived(item.id)}
                      onToggleArchive={toggleArchive}
                    />
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* FAB - Amber for action */}
      <motion.button 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        onClick={() => handleCreateOpenChange(true)}
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      <BottomNav />

      {/* Sheets */}
      <CreatePostSheet open={createOpen} onOpenChange={handleCreateOpenChange} />
      <CommentsSheet 
        open={commentsOpen} 
        onOpenChange={setCommentsOpen} 
        post={selectedPost}
      />
    </div>
  );
}
