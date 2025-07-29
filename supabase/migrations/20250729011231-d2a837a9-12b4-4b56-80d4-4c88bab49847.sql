-- Fix infinite recursion in flight_players RLS policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view players in flights they're part of" ON public.flight_players;
DROP POLICY IF EXISTS "Users can add players to flights they created" ON public.flight_players;
DROP POLICY IF EXISTS "Users can update players in flights they created" ON public.flight_players;
DROP POLICY IF EXISTS "Users can delete players from flights they created" ON public.flight_players;

-- Create security definer function to check if user can access flight
CREATE OR REPLACE FUNCTION public.user_can_access_flight(flight_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.flights 
    WHERE id = flight_id 
    AND (
      created_by = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.flight_players 
        WHERE flight_players.flight_id = flights.id 
        AND flight_players.user_id = auth.uid()
      )
    )
  )
$$;

-- Create security definer function to check if user created flight
CREATE OR REPLACE FUNCTION public.user_created_flight(flight_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.flights 
    WHERE id = flight_id 
    AND created_by = auth.uid()
  )
$$;

-- Create new RLS policies using security definer functions
CREATE POLICY "Users can view players in accessible flights" 
ON public.flight_players 
FOR SELECT 
USING (public.user_can_access_flight(flight_id));

CREATE POLICY "Users can add players to flights they created" 
ON public.flight_players 
FOR INSERT 
WITH CHECK (public.user_created_flight(flight_id));

CREATE POLICY "Users can update players in flights they created" 
ON public.flight_players 
FOR UPDATE 
USING (public.user_created_flight(flight_id));

CREATE POLICY "Users can delete players from flights they created" 
ON public.flight_players 
FOR DELETE 
USING (public.user_created_flight(flight_id));