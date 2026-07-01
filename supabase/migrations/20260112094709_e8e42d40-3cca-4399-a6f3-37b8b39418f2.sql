-- Create table for group invite links
CREATE TABLE public.group_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast code lookup
CREATE INDEX idx_group_invites_code ON public.group_invites(code);
CREATE INDEX idx_group_invites_conversation ON public.group_invites(conversation_id);

-- Enable RLS
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Only group participants can view invites for their groups
CREATE POLICY "Group participants can view invites"
ON public.group_invites
FOR SELECT
USING (
  public.user_is_participant(conversation_id)
);

-- Policy: Only group participants can create invites
CREATE POLICY "Group participants can create invites"
ON public.group_invites
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  public.user_is_participant(conversation_id)
);

-- Policy: Only invite creator can update/delete their invites
CREATE POLICY "Invite creator can update"
ON public.group_invites
FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Invite creator can delete"
ON public.group_invites
FOR DELETE
USING (auth.uid() = created_by);

-- Add trigger for updated_at
CREATE TRIGGER update_group_invites_updated_at
  BEFORE UPDATE ON public.group_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to validate and use invite
CREATE OR REPLACE FUNCTION public.use_group_invite(invite_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
  user_id_val UUID;
  existing_participant BOOLEAN;
  result JSON;
BEGIN
  user_id_val := auth.uid();
  
  IF user_id_val IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Find the invite
  SELECT * INTO invite_record
  FROM public.group_invites
  WHERE code = invite_code AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid invite link');
  END IF;
  
  -- Check if expired
  IF invite_record.expires_at IS NOT NULL AND invite_record.expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Invite link has expired');
  END IF;
  
  -- Check if max uses reached
  IF invite_record.max_uses IS NOT NULL AND invite_record.uses_count >= invite_record.max_uses THEN
    RETURN json_build_object('success', false, 'error', 'Invite link has reached maximum uses');
  END IF;
  
  -- Check if user is already a participant
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = invite_record.conversation_id
    AND user_id = user_id_val
  ) INTO existing_participant;
  
  IF existing_participant THEN
    RETURN json_build_object(
      'success', true, 
      'already_member', true,
      'conversation_id', invite_record.conversation_id
    );
  END IF;
  
  -- Add user to conversation
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (invite_record.conversation_id, user_id_val);
  
  -- Increment uses count
  UPDATE public.group_invites
  SET uses_count = uses_count + 1
  WHERE id = invite_record.id;
  
  RETURN json_build_object(
    'success', true, 
    'already_member', false,
    'conversation_id', invite_record.conversation_id
  );
END;
$$;