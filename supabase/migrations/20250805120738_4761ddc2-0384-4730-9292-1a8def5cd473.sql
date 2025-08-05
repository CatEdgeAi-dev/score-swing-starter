-- Add handicap_locked column to flight_players table
ALTER TABLE public.flight_players 
ADD COLUMN handicap_locked boolean NOT NULL DEFAULT false;