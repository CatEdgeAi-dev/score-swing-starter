-- Create flight handicap validations table
CREATE TABLE public.flight_handicap_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flight_id UUID NOT NULL REFERENCES public.flights(id) ON DELETE CASCADE,
  validator_user_id UUID NOT NULL,
  validated_user_id UUID NOT NULL,
  claimed_handicap NUMERIC,
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'questioned')),
  validation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure a user can't validate themselves
  CONSTRAINT no_self_validation CHECK (validator_user_id != validated_user_id),
  -- Ensure one validation per validator-validated pair per flight
  UNIQUE(flight_id, validator_user_id, validated_user_id)
);

-- Enable RLS
ALTER TABLE public.flight_handicap_validations ENABLE ROW LEVEL SECURITY;

-- Users can view validations for flights they're part of
CREATE POLICY "Users can view validations in their flights" 
ON public.flight_handicap_validations 
FOR SELECT 
USING (user_can_access_flight(flight_id));

-- Users can create validations for flights they're part of
CREATE POLICY "Users can create validations in their flights" 
ON public.flight_handicap_validations 
FOR INSERT 
WITH CHECK (
  user_can_access_flight(flight_id) AND 
  validator_user_id = auth.uid()
);

-- Users can update their own validations
CREATE POLICY "Users can update their own validations" 
ON public.flight_handicap_validations 
FOR UPDATE 
USING (validator_user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_flight_handicap_validations_updated_at
BEFORE UPDATE ON public.flight_handicap_validations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();