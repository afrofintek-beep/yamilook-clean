-- Message edit history table
CREATE TABLE public.message_edits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  original_content TEXT NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sticker packs table
CREATE TABLE public.sticker_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  is_animated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stickers table
CREATE TABLE public.stickers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID NOT NULL REFERENCES public.sticker_packs(id) ON DELETE CASCADE,
  name TEXT,
  url TEXT NOT NULL,
  emoji TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User sticker favorites
CREATE TABLE public.user_sticker_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sticker_id UUID NOT NULL REFERENCES public.stickers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, sticker_id)
);

-- User sticker pack ownership (for premium packs)
CREATE TABLE public.user_sticker_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL REFERENCES public.sticker_packs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, pack_id)
);

-- Add forwarded_from to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS forwarded_from_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS forwarded_from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add edited_at timestamp
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.message_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticker_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sticker_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sticker_packs ENABLE ROW LEVEL SECURITY;

-- Message edits policies
CREATE POLICY "Users can view edits for messages in their conversations"
ON public.message_edits FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.messages m
  JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
  WHERE m.id = message_edits.message_id AND cp.user_id = auth.uid()
));

CREATE POLICY "Users can create edit history for own messages"
ON public.message_edits FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.messages m
  WHERE m.id = message_id AND m.sender_id = auth.uid()
));

-- Sticker packs policies (public read)
CREATE POLICY "Anyone can view sticker packs"
ON public.sticker_packs FOR SELECT
USING (true);

CREATE POLICY "Anyone can view stickers"
ON public.stickers FOR SELECT
USING (true);

-- User sticker favorites policies
CREATE POLICY "Users can view own favorites"
ON public.user_sticker_favorites FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can manage own favorites"
ON public.user_sticker_favorites FOR ALL
USING (user_id = auth.uid());

-- User sticker packs policies
CREATE POLICY "Users can view own packs"
ON public.user_sticker_packs FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can manage own packs"
ON public.user_sticker_packs FOR ALL
USING (user_id = auth.uid());

-- Insert default sticker packs
INSERT INTO public.sticker_packs (id, name, description, cover_url, is_animated) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Classic Emojis', 'Essential emoji stickers', 'https://em-content.zobj.net/thumbs/120/apple/354/grinning-face_1f600.png', false),
  ('00000000-0000-0000-0000-000000000002', 'Love & Hearts', 'Express your love', 'https://em-content.zobj.net/thumbs/120/apple/354/red-heart_2764-fe0f.png', false),
  ('00000000-0000-0000-0000-000000000003', 'Reactions', 'Quick reaction stickers', 'https://em-content.zobj.net/thumbs/120/apple/354/thumbs-up_1f44d.png', false);

-- Insert default stickers
INSERT INTO public.stickers (pack_id, name, url, emoji, display_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Grinning', 'https://em-content.zobj.net/thumbs/120/apple/354/grinning-face_1f600.png', '😀', 1),
  ('00000000-0000-0000-0000-000000000001', 'Joy', 'https://em-content.zobj.net/thumbs/120/apple/354/face-with-tears-of-joy_1f602.png', '😂', 2),
  ('00000000-0000-0000-0000-000000000001', 'Wink', 'https://em-content.zobj.net/thumbs/120/apple/354/winking-face_1f609.png', '😉', 3),
  ('00000000-0000-0000-0000-000000000001', 'Heart Eyes', 'https://em-content.zobj.net/thumbs/120/apple/354/smiling-face-with-heart-eyes_1f60d.png', '😍', 4),
  ('00000000-0000-0000-0000-000000000001', 'Cool', 'https://em-content.zobj.net/thumbs/120/apple/354/smiling-face-with-sunglasses_1f60e.png', '😎', 5),
  ('00000000-0000-0000-0000-000000000001', 'Think', 'https://em-content.zobj.net/thumbs/120/apple/354/thinking-face_1f914.png', '🤔', 6),
  ('00000000-0000-0000-0000-000000000002', 'Red Heart', 'https://em-content.zobj.net/thumbs/120/apple/354/red-heart_2764-fe0f.png', '❤️', 1),
  ('00000000-0000-0000-0000-000000000002', 'Heart Fire', 'https://em-content.zobj.net/thumbs/120/apple/354/heart-on-fire_2764-fe0f-200d-1f525.png', '❤️‍🔥', 2),
  ('00000000-0000-0000-0000-000000000002', 'Sparkling Heart', 'https://em-content.zobj.net/thumbs/120/apple/354/sparkling-heart_1f496.png', '💖', 3),
  ('00000000-0000-0000-0000-000000000002', 'Kiss', 'https://em-content.zobj.net/thumbs/120/apple/354/kiss-mark_1f48b.png', '💋', 4),
  ('00000000-0000-0000-0000-000000000003', 'Thumbs Up', 'https://em-content.zobj.net/thumbs/120/apple/354/thumbs-up_1f44d.png', '👍', 1),
  ('00000000-0000-0000-0000-000000000003', 'Clap', 'https://em-content.zobj.net/thumbs/120/apple/354/clapping-hands_1f44f.png', '👏', 2),
  ('00000000-0000-0000-0000-000000000003', 'Fire', 'https://em-content.zobj.net/thumbs/120/apple/354/fire_1f525.png', '🔥', 3),
  ('00000000-0000-0000-0000-000000000003', 'Party', 'https://em-content.zobj.net/thumbs/120/apple/354/party-popper_1f389.png', '🎉', 4),
  ('00000000-0000-0000-0000-000000000003', 'Crying', 'https://em-content.zobj.net/thumbs/120/apple/354/loudly-crying-face_1f62d.png', '😭', 5);

-- Indexes
CREATE INDEX idx_stickers_pack_id ON public.stickers(pack_id);
CREATE INDEX idx_user_sticker_favorites_user_id ON public.user_sticker_favorites(user_id);
CREATE INDEX idx_messages_forwarded_from ON public.messages(forwarded_from_id);