-- Add display_order column to discover_topics for drag-and-drop ordering
ALTER TABLE public.discover_topics 
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Set initial order based on existing rows
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY is_trending DESC, name ASC) as rn
  FROM public.discover_topics
)
UPDATE public.discover_topics
SET display_order = ordered.rn
FROM ordered
WHERE discover_topics.id = ordered.id;

-- Create index for faster ordering queries
CREATE INDEX idx_discover_topics_display_order ON public.discover_topics(display_order);