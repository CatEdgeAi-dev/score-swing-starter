-- Fix search path security warnings for the new functions

CREATE OR REPLACE FUNCTION public.user_can_access_flight(flight_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.user_created_flight(flight_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.flights 
    WHERE id = flight_id 
    AND created_by = auth.uid()
  )
$$;