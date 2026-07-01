-- First, sync the likes_count with actual like counts
UPDATE posts p
SET likes_count = (
  SELECT COUNT(*)::integer 
  FROM post_likes pl 
  WHERE pl.post_id = p.id
);

-- Create a function to update likes count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for post_likes
DROP TRIGGER IF EXISTS update_likes_count_trigger ON post_likes;
CREATE TRIGGER update_likes_count_trigger
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_likes_count();