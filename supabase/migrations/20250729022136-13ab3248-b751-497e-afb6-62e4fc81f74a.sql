-- Add is_flight_round column to rounds table
ALTER TABLE public.rounds 
ADD COLUMN is_flight_round BOOLEAN NOT NULL DEFAULT false;

-- Add flight_name column to store flight information
ALTER TABLE public.rounds 
ADD COLUMN flight_name TEXT;