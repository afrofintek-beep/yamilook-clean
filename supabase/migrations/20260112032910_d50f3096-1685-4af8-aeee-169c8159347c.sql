-- First, sync the comments_count with actual comment counts
UPDATE posts p
SET comments_count = (
  SELECT COUNT(*)::integer 
  FROM post_comments pc 
  WHERE pc.post_id = p.id
);

-- Create a function to update comments count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for post_comments
DROP TRIGGER IF EXISTS update_comments_count_trigger ON post_comments;
CREATE TRIGGER update_comments_count_trigger
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_post_comments_count();