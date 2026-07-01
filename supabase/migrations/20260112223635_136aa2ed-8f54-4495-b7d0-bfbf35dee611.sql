-- Drop the old check constraint and add a new one that includes African reaction types
ALTER TABLE post_likes DROP CONSTRAINT IF EXISTS post_likes_reaction_type_check;

-- Add new constraint that allows both legacy and African reaction types
ALTER TABLE post_likes ADD CONSTRAINT post_likes_reaction_type_check 
CHECK (reaction_type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry', 'sankofa', 'ubuntu', 'djembe', 'shango', 'eish'));