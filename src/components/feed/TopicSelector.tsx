import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, X, Check, ChevronDown, Plus, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

interface TopicSelectorProps {
  selectedTopics: string[];
  onTopicsChange: (topics: string[]) => void;
  maxTopics?: number;
}

export function TopicSelector({ 
  selectedTopics, 
  onTopicsChange, 
  maxTopics = 3 
}: TopicSelectorProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newTopicName, setNewTopicName] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [showSuggestInput, setShowSuggestInput] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('discover_topics')
        .select('id, name, slug, description, image_url')
        .order('display_order');

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const checkDuplicate = async (name: string): Promise<boolean> => {
    const slug = generateSlug(name);
    
    // Check in existing topics
    const existingTopic = topics.find(
      t => t.slug === slug || t.name.toLowerCase() === name.toLowerCase()
    );
    if (existingTopic) {
      setDuplicateError(t('feed.topicExists', { name: existingTopic.name }));
      return true;
    }

    // Check in pending suggestions
    const { data: pendingSuggestions } = await supabase
      .from('topic_suggestions')
      .select('name, slug')
      .or(`slug.eq.${slug},name.ilike.${name}`)
      .eq('status', 'pending');

    if (pendingSuggestions && pendingSuggestions.length > 0) {
      setDuplicateError(t('feed.topicAlreadySuggested'));
      return true;
    }

    setDuplicateError(null);
    return false;
  };

  const handleSuggestTopic = async () => {
    if (!newTopicName.trim() || !user) return;

    const trimmedName = newTopicName.trim();
    
    // Validate minimum length
    if (trimmedName.length < 2) {
      toast.error(t('feed.topicTooShort'));
      return;
    }

    // Check for duplicates
    const isDuplicate = await checkDuplicate(trimmedName);
    if (isDuplicate) return;

    setSuggesting(true);
    try {
      const slug = generateSlug(trimmedName);

      const { error } = await supabase
        .from('topic_suggestions')
        .insert({
          name: trimmedName,
          slug,
          suggested_by: user.id,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error(t('feed.topicAlreadySuggested'));
        } else {
          throw error;
        }
        return;
      }

      toast.success(t('feed.topicSuggested'));
      setNewTopicName('');
      setShowSuggestInput(false);
    } catch (error) {
      console.error('Error suggesting topic:', error);
      toast.error(t('feed.errorSuggestingTopic'));
    } finally {
      setSuggesting(false);
    }
  };

  const toggleTopic = (topicId: string) => {
    if (selectedTopics.includes(topicId)) {
      onTopicsChange(selectedTopics.filter(id => id !== topicId));
    } else if (selectedTopics.length < maxTopics) {
      onTopicsChange([...selectedTopics, topicId]);
    }
  };

  const removeTopic = (topicId: string) => {
    onTopicsChange(selectedTopics.filter(id => id !== topicId));
  };

  const getTopicById = (id: string) => topics.find(t => t.id === id);

  const getTopicName = (topic: Topic) => {
    // Try slug-based key first, then name-based
    const slugKey = `discover.topicNames.${topic.slug}`;
    const nameKey = `discover.topicNames.${topic.name.toLowerCase()}`;
    
    const translatedSlug = t(slugKey);
    if (translatedSlug !== slugKey) return translatedSlug;
    
    const translatedName = t(nameKey);
    if (translatedName !== nameKey) return translatedName;
    
    return topic.name;
  };

  const getTopicDescription = (topic: Topic) => {
    if (!topic.description) return null;
    
    // Try slug-based key first, then name-based
    const slugKey = `discover.topicDescriptions.${topic.slug}`;
    const nameKey = `discover.topicDescriptions.${topic.name.toLowerCase()}`;
    
    const translatedSlug = t(slugKey);
    if (translatedSlug !== slugKey) return translatedSlug;
    
    const translatedName = t(nameKey);
    if (translatedName !== nameKey) return translatedName;
    
    return topic.description;
  };

  // Filter topics based on search
  const filteredTopics = newTopicName.trim()
    ? topics.filter(t => 
        t.name.toLowerCase().includes(newTopicName.toLowerCase()) ||
        getTopicName(t).toLowerCase().includes(newTopicName.toLowerCase())
      )
    : topics;

  const showSuggestOption = newTopicName.trim().length >= 2 && 
    !topics.some(t => t.name.toLowerCase() === newTopicName.trim().toLowerCase());

  return (
    <div className="space-y-2">
      {/* Selected topics badges */}
      <AnimatePresence>
        {selectedTopics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-1.5"
          >
            {selectedTopics.map(topicId => {
              const topic = getTopicById(topicId);
              if (!topic) return null;
              return (
                <motion.div
                  key={topicId}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Badge 
                    variant="secondary" 
                    className="gap-1 pr-1 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    <span>{getTopicName(topic)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 hover:bg-primary/20 rounded-full"
                      onClick={() => removeTopic(topicId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Topic selector button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Hash className="w-4 h-4" />
            <span>{t('feed.addTopics')}</span>
            <ChevronDown className="w-3 h-3" />
            {selectedTopics.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {selectedTopics.length}/{maxTopics}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-2 bg-card border border-border z-[100]"
          side="top"
          align="start"
        >
          <div className="space-y-2">
            {/* Search/Suggest input */}
            <div className="px-2">
              <Input
                placeholder={t('feed.searchOrSuggestTopic')}
                value={newTopicName}
                onChange={(e) => {
                  setNewTopicName(e.target.value);
                  setDuplicateError(null);
                }}
                className="h-9"
              />
            </div>

            {/* Duplicate error */}
            {duplicateError && (
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-destructive bg-destructive/10 rounded-lg mx-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{duplicateError}</span>
              </div>
            )}

            <div className="text-xs text-muted-foreground px-2">
              {t('feed.selectUpToTopics', { count: maxTopics })}
            </div>

            <ScrollArea className="h-56">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Suggest new topic option */}
                  {showSuggestOption && user && (
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left bg-primary/5 hover:bg-primary/10 border border-dashed border-primary/30"
                      onClick={handleSuggestTopic}
                      disabled={suggesting}
                    >
                      {suggesting ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      ) : (
                        <Plus className="w-5 h-5 text-primary" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-primary truncate">
                          {t('feed.suggestTopic', { name: newTopicName.trim() })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('feed.willBeReviewed')}
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Existing topics */}
                  {filteredTopics.map(topic => {
                    const isSelected = selectedTopics.includes(topic.id);
                    const isDisabled = !isSelected && selectedTopics.length >= maxTopics;
                    
                    return (
                      <button
                        key={topic.id}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                          isSelected 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-muted",
                          isDisabled && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => !isDisabled && toggleTopic(topic.id)}
                        disabled={isDisabled}
                      >
                        {topic.image_url && (
                          <img src={topic.image_url} alt="" className="w-6 h-6 rounded object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {getTopicName(topic)}
                          </p>
                          {topic.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {getTopicDescription(topic)}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}

                  {filteredTopics.length === 0 && !showSuggestOption && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      {t('feed.noTopicsFound')}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
