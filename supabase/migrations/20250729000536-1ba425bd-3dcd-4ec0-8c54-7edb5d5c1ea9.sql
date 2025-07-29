-- Create tables for golf scorecard data persistence

-- Create rounds table to store golf round information
CREATE TABLE public.rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_name TEXT,
  date_played DATE NOT NULL DEFAULT CURRENT_DATE,
  total_score INTEGER NOT NULL DEFAULT 0,
  total_putts INTEGER NOT NULL DEFAULT 0,
  fairways_hit INTEGER NOT NULL DEFAULT 0,
  greens_in_regulation INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create holes table to store individual hole data
CREATE TABLE public.holes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
  par INTEGER NOT NULL CHECK (par >= 3 AND par <= 5),
  strokes INTEGER NOT NULL DEFAULT 0,
  putts INTEGER NOT NULL DEFAULT 0,
  fairway_hit BOOLEAN NOT NULL DEFAULT false,
  green_in_regulation BOOLEAN NOT NULL DEFAULT false,
  up_and_down BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(round_id, hole_number)
);

-- Enable Row Level Security
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rounds table
CREATE POLICY "Users can view their own rounds" 
ON public.rounds 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rounds" 
ON public.rounds 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rounds" 
ON public.rounds 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rounds" 
ON public.rounds 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for holes table
CREATE POLICY "Users can view holes from their own rounds" 
ON public.holes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.rounds 
    WHERE rounds.id = holes.round_id 
    AND rounds.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create holes for their own rounds" 
ON public.holes 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rounds 
    WHERE rounds.id = holes.round_id 
    AND rounds.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update holes from their own rounds" 
ON public.holes 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.rounds 
    WHERE rounds.id = holes.round_id 
    AND rounds.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete holes from their own rounds" 
ON public.holes 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.rounds 
    WHERE rounds.id = holes.round_id 
    AND rounds.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_rounds_updated_at
  BEFORE UPDATE ON public.rounds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_holes_updated_at
  BEFORE UPDATE ON public.holes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_rounds_user_id ON public.rounds(user_id);
CREATE INDEX idx_rounds_date_played ON public.rounds(date_played);
CREATE INDEX idx_holes_round_id ON public.holes(round_id);
CREATE INDEX idx_holes_hole_number ON public.holes(hole_number);