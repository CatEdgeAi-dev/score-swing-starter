-- Create flight system for multiplayer golf rounds

-- Create flights table (represents a group playing together)
CREATE TABLE public.flights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Golf Flight',
  course_name TEXT,
  date_played DATE NOT NULL DEFAULT CURRENT_DATE,
  weather TEXT DEFAULT 'sunny',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on flights
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;

-- Create flight_players table (links players to flights)
CREATE TABLE public.flight_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flight_id UUID REFERENCES public.flights(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for guest players
  guest_name TEXT, -- Name for guest players (NULL for registered users)
  player_order INTEGER NOT NULL DEFAULT 1, -- Playing order in the flight
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT flight_players_user_or_guest CHECK (
    (user_id IS NOT NULL AND guest_name IS NULL) OR 
    (user_id IS NULL AND guest_name IS NOT NULL)
  ),
  UNIQUE(flight_id, user_id), -- Prevent duplicate registered users
  UNIQUE(flight_id, player_order) -- Ensure unique playing order
);

-- Enable RLS on flight_players
ALTER TABLE public.flight_players ENABLE ROW LEVEL SECURITY;

-- Update rounds table to link to flights instead of individual users
ALTER TABLE public.rounds DROP CONSTRAINT IF EXISTS rounds_user_id_fkey;
ALTER TABLE public.rounds ADD COLUMN flight_id UUID REFERENCES public.flights(id) ON DELETE CASCADE;
ALTER TABLE public.rounds ADD COLUMN player_id UUID REFERENCES public.flight_players(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX idx_rounds_flight_id ON public.rounds(flight_id);
CREATE INDEX idx_rounds_player_id ON public.rounds(player_id);
CREATE INDEX idx_flight_players_flight_id ON public.flight_players(flight_id);

-- RLS Policies for flights
CREATE POLICY "Users can view flights they created or are part of" 
ON public.flights 
FOR SELECT 
USING (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.flight_players fp 
    WHERE fp.flight_id = flights.id AND fp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own flights" 
ON public.flights 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update flights they created" 
ON public.flights 
FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Users can delete flights they created" 
ON public.flights 
FOR DELETE 
USING (created_by = auth.uid());

-- RLS Policies for flight_players
CREATE POLICY "Users can view players in flights they're part of" 
ON public.flight_players 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.flights f 
    WHERE f.id = flight_players.flight_id AND (
      f.created_by = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.flight_players fp2 
        WHERE fp2.flight_id = f.id AND fp2.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can add players to flights they created" 
ON public.flight_players 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.flights f 
    WHERE f.id = flight_players.flight_id AND f.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update players in flights they created" 
ON public.flight_players 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.flights f 
    WHERE f.id = flight_players.flight_id AND f.created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete players from flights they created" 
ON public.flight_players 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.flights f 
    WHERE f.id = flight_players.flight_id AND f.created_by = auth.uid()
  )
);

-- Update RLS policies for rounds to work with flights
DROP POLICY IF EXISTS "Users can view their own rounds" ON public.rounds;
DROP POLICY IF EXISTS "Users can create their own rounds" ON public.rounds;
DROP POLICY IF EXISTS "Users can update their own rounds" ON public.rounds;
DROP POLICY IF EXISTS "Users can delete their own rounds" ON public.rounds;

CREATE POLICY "Users can view rounds from their flights" 
ON public.rounds 
FOR SELECT 
USING (
  -- Legacy support for individual rounds
  (flight_id IS NULL AND user_id = auth.uid()) OR
  -- New flight-based rounds
  (flight_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.flights f 
    WHERE f.id = rounds.flight_id AND (
      f.created_by = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.flight_players fp 
        WHERE fp.flight_id = f.id AND fp.user_id = auth.uid()
      )
    )
  ))
);

CREATE POLICY "Users can create rounds for their flights" 
ON public.rounds 
FOR INSERT 
WITH CHECK (
  -- Legacy support for individual rounds
  (flight_id IS NULL AND user_id = auth.uid()) OR
  -- New flight-based rounds
  (flight_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.flights f 
    WHERE f.id = rounds.flight_id AND (
      f.created_by = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.flight_players fp 
        WHERE fp.flight_id = f.id AND fp.user_id = auth.uid()
      )
    )
  ))
);

CREATE POLICY "Users can update rounds from their flights" 
ON public.rounds 
FOR UPDATE 
USING (
  -- Legacy support for individual rounds
  (flight_id IS NULL AND user_id = auth.uid()) OR
  -- New flight-based rounds
  (flight_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.flights f 
    WHERE f.id = rounds.flight_id AND (
      f.created_by = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.flight_players fp 
        WHERE fp.flight_id = f.id AND fp.user_id = auth.uid()
      )
    )
  ))
);

CREATE POLICY "Users can delete rounds from their flights" 
ON public.rounds 
FOR DELETE 
USING (
  -- Legacy support for individual rounds
  (flight_id IS NULL AND user_id = auth.uid()) OR
  -- New flight-based rounds
  (flight_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.flights f 
    WHERE f.id = rounds.flight_id AND (
      f.created_by = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.flight_players fp 
        WHERE fp.flight_id = f.id AND fp.user_id = auth.uid()
      )
    )
  ))
);

-- Add trigger for updating timestamps
CREATE TRIGGER update_flights_updated_at
BEFORE UPDATE ON public.flights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();