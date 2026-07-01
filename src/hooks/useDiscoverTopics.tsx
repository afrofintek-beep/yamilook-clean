import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

export interface DiscoverTopic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_trending: boolean;
  post_count: number;
  display_order: number | null;
  created_at: string;
}

export function useDiscoverTopics() {
  const { t } = useTranslation();

  return useQuery({
    queryKey: ['discover-topics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discover_topics')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('is_trending', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      
      // Enrich with translated names and descriptions
      return (data || []).map(topic => ({
        ...topic,
        translatedName: t(`discover.topicNames.${topic.slug}`, topic.name),
        translatedDescription: t(`discover.topicDescriptions.${topic.slug}`, topic.description || ''),
      }));
    },
  });
}

export function useTrendingTopics(limit = 10) {
  const { t } = useTranslation();

  return useQuery({
    queryKey: ['trending-topics', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discover_topics')
        .select('*')
        .eq('is_trending', true)
        .order('post_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return (data || []).map(topic => ({
        ...topic,
        translatedName: t(`discover.topicNames.${topic.slug}`, topic.name),
        translatedDescription: t(`discover.topicDescriptions.${topic.slug}`, topic.description || ''),
      }));
    },
  });
}

// Helper hook for Palco-specific themes (can filter to relevant categories)
export function usePalcoThemes() {
  const { t } = useTranslation();

  return useQuery({
    queryKey: ['palco-themes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discover_topics')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(topic => ({
        id: topic.id,
        slug: topic.slug,
        name: t(`discover.topicNames.${topic.slug}`, topic.name),
        description: t(`discover.topicDescriptions.${topic.slug}`, topic.description || ''),
        image_url: topic.image_url,
        is_trending: topic.is_trending,
      }));
    },
  });
}
