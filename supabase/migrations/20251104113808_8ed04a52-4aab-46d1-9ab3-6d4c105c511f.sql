-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  theme TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room_participants table
CREATE TABLE public.room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create room_messages table
CREATE TABLE public.room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID,
  user_email TEXT,
  message TEXT NOT NULL,
  is_ai BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room_ai_suggestions table
CREATE TABLE public.room_ai_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  suggestion TEXT NOT NULL,
  suggestion_type TEXT NOT NULL DEFAULT 'idea',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_ai_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms (anyone can view, authenticated users can create)
CREATE POLICY "Anyone can view rooms"
  ON public.rooms FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators can update their rooms"
  ON public.rooms FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Room creators can delete their rooms"
  ON public.rooms FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for room_participants
CREATE POLICY "Anyone can view room participants"
  ON public.room_participants FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can join rooms"
  ON public.room_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms they joined"
  ON public.room_participants FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for room_messages
CREATE POLICY "Anyone can view room messages"
  ON public.room_messages FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can send messages"
  ON public.room_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_ai = true);

-- RLS Policies for room_ai_suggestions
CREATE POLICY "Anyone can view AI suggestions"
  ON public.room_ai_suggestions FOR SELECT
  USING (true);

CREATE POLICY "System can create AI suggestions"
  ON public.room_ai_suggestions FOR INSERT
  WITH CHECK (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_ai_suggestions;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rooms updated_at
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();